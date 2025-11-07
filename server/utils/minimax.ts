import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

const DEFAULT_MINIMAX_VOICE = "English_expressive_narrator";
const DEFAULT_TTS_ENDPOINT = "https://api.minimax.io/v1/t2a_v2";
const SUPPORTED_TTS_MODELS = new Set([
  "speech-2.6-hd",
  "speech-2.6",
  "speech-2.5-hd",
  "speech-2.5",
  "speech-2.0",
]);

const LEGACY_VOICE_MAP: Record<string, string> = {
  "minimax soft female": "English_captivating_female1",
  "minimax female soft": "English_captivating_female1",
  "minimax_female_soft": "English_captivating_female1",
  "soft female": "English_captivating_female1",
  "minimax deep male": "English_magnetic_voiced_man",
  "minimax male deep": "English_magnetic_voiced_man",
  "minimax_male_deep": "English_magnetic_voiced_man",
  "deep male": "English_magnetic_voiced_man",
  "expressive narrator": DEFAULT_MINIMAX_VOICE,
};

interface TextToSpeechParams {
  text: string;
  voiceId?: string;
  model?: string;
  audioFormat?: string;
  speed?: number;
  volume?: number;
  pitch?: number;
  languageBoost?: string;
  outputFormat?: "hex" | "base64" | string;
  pronunciationDict?: Record<string, unknown>;
  audioSetting?: {
    sampleRate?: number;
    bitrate?: number;
    format?: string;
    channel?: number;
  };
  voiceModify?: {
    pitch?: number;
    intensity?: number;
    timbre?: number;
    sound_effects?: string;
  };
  streamOptions?: {
    exclude_aggregated_audio?: boolean;
  };
}

class MinimaxService {
  private apiKey: string;
  private groupId: string;
  private ttsEndpoint: string;
  private defaultVoice: string | undefined;
  private defaultModel: string | undefined;
  private audioDir: string;

  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY || "";
    this.groupId = process.env.MINIMAX_GROUP_ID || "";
    const configuredEndpoint = process.env.MINIMAX_TTS_ENDPOINT?.trim();
    this.ttsEndpoint =
      configuredEndpoint && configuredEndpoint.length > 0
        ? configuredEndpoint
        : DEFAULT_TTS_ENDPOINT;

    if (!this.ttsEndpoint.includes("t2a_v2") || !this.ttsEndpoint.includes("api.minimax.io")) {
      if (configuredEndpoint) {
        console.warn(
          `[MiniMax] Overriding provided MINIMAX_TTS_ENDPOINT "${configuredEndpoint}" with official endpoint "${DEFAULT_TTS_ENDPOINT}".`,
        );
      }
      this.ttsEndpoint = DEFAULT_TTS_ENDPOINT;
    }
    const configuredDefaultVoice = process.env.MINIMAX_DEFAULT_VOICE_ID?.trim();
    this.defaultVoice =
      configuredDefaultVoice && configuredDefaultVoice.length > 0
        ? configuredDefaultVoice
        : DEFAULT_MINIMAX_VOICE;

    this.defaultModel = this.normalizeModel(process.env.MINIMAX_TTS_MODEL);
    this.audioDir = path.join(process.cwd(), "dist", "public", "audio");

    this.ensureAudioDir().catch((error) => {
      console.error("[MiniMax] Failed to prepare audio directory:", error);
    });
  }

  private async ensureAudioDir(): Promise<void> {
    try {
      await mkdirAsync(this.audioDir, { recursive: true });
    } catch (error: any) {
      if (!(error instanceof Error) || !error.message.includes("exists")) {
        throw error;
      }
    }
  }

  private buildHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    if (this.groupId) {
      headers["X-Group-Id"] = this.groupId;
      headers["Group-Id"] = this.groupId;
    }

    return headers;
  }

  private get isConfigured(): boolean {
    if (!this.apiKey) {
      console.warn("[MiniMax] Missing MINIMAX_API_KEY environment variable.");
      return false;
    }
    if (!this.groupId) {
      console.warn("[MiniMax] Missing MINIMAX_GROUP_ID environment variable.");
    }
    return true;
  }

  async textToSpeech(params: TextToSpeechParams): Promise<string> {
    if (!this.isConfigured) {
      throw new Error("MiniMax service is not configured.");
    }

    let voiceId = (params.voiceId || this.defaultVoice || "").trim();
    if (!voiceId) {
      throw new Error("No MiniMax voice ID provided.");
    }

    const normalizedVoiceKey = voiceId
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (LEGACY_VOICE_MAP[normalizedVoiceKey]) {
      console.warn(
        `[MiniMax] Mapping legacy voice name "${voiceId}" to MiniMax voice_id "${LEGACY_VOICE_MAP[normalizedVoiceKey]}".`,
      );
      voiceId = LEGACY_VOICE_MAP[normalizedVoiceKey];
    } else if (/\s/.test(voiceId)) {
      console.warn(
        `[MiniMax] Voice identifier "${voiceId}" looks like a label. Falling back to default voice "${this.defaultVoice}".`,
      );
      voiceId = this.defaultVoice!;
    }

    const audioFormat = params.audioFormat || params.audioSetting?.format || "mp3";
    const model = this.normalizeModel(params.model);
    const voiceSetting = {
      voice_id: voiceId,
      speed: typeof params.speed === "number" ? params.speed : 1,
      vol: typeof params.volume === "number" ? params.volume : 1,
      pitch: typeof params.pitch === "number" ? params.pitch : 0,
    };

    const audioSetting = {
      sample_rate: params.audioSetting?.sampleRate ?? 32_000,
      bitrate: params.audioSetting?.bitrate ?? 128_000,
      format: audioFormat,
      channel: params.audioSetting?.channel ?? 1,
    };

    const voiceModifyRaw = {
      pitch: params.voiceModify?.pitch,
      intensity: params.voiceModify?.intensity,
      timbre: params.voiceModify?.timbre,
      sound_effects: params.voiceModify?.sound_effects,
    };

    const voiceModify = Object.fromEntries(
      Object.entries(voiceModifyRaw).filter(
        ([, value]) =>
          typeof value === "number" ||
          (typeof value === "string" && value.trim().length > 0),
      ),
    );

    const payload: Record<string, any> = {
      model,
      text: params.text,
      stream: false,
      language_boost: params.languageBoost || "auto",
      output_format: params.outputFormat || "hex",
      voice_setting: voiceSetting,
      audio_setting: audioSetting,
      stream_options: {
        exclude_aggregated_audio:
          params.streamOptions?.exclude_aggregated_audio ?? true,
      },
    };

    if (Object.keys(voiceModify).length > 0) {
      payload["voice_modify"] = voiceModify;
    }

    if (this.groupId) {
      payload["group_id"] = this.groupId;
    }

    if (params.pronunciationDict) {
      payload["pronunciation_dict"] = params.pronunciationDict;
    }

    try {
      const response = await axios.post(this.ttsEndpoint, payload, {
        headers: this.buildHeaders(),
        timeout: 60_000,
      });
      
      console.log(response.data);
      
      const data = response?.data;

      
      const candidateUrls: Array<string | undefined> = [
        data?.data?.audio_url,
        data?.data?.audio?.download_url,
        data?.audio_url,
        data?.audio?.download_url,
        data?.result?.audio_url,
        data?.audio?.url,
      ];

      const remoteUrl = candidateUrls.find((url) => typeof url === "string" && url.length > 0);
      if (remoteUrl) {
        return remoteUrl;
      }

      const hexCandidates: Array<string | undefined> = [
        data?.data?.audio,
        data?.data?.audio_data,
        data?.data?.audio_hex,
        data?.audio,
        data?.audio_hex,
        data?.result?.audio_hex,
      ];

      const hexAudio = hexCandidates.find((candidate) => {
        if (typeof candidate !== "string") return false;
        const trimmed = candidate.trim();
        return trimmed.length > 0 && /^[0-9a-fA-F]+$/.test(trimmed);
      });

      if (hexAudio) {
        return await this.saveAudio(Buffer.from(hexAudio.trim(), "hex"), audioFormat);
      }

      const base64Candidates: Array<string | undefined> = [
        data?.data?.audio_base64,
        data?.data?.audio?.base64,
        data?.audio_base64,
        data?.audio?.data,
        data?.result?.audio,
      ];

      const base64Audio = base64Candidates.find(
        (candidate) => typeof candidate === "string" && candidate.length > 0,
      );

      if (!base64Audio) {
        console.warn("[MiniMax] TTS response did not contain audio data.");
        return await this.createFallbackAudio();
      }

      return await this.saveAudio(Buffer.from(base64Audio, "base64"), audioFormat);
    } catch (error: any) {
      console.error("[MiniMax] Text-to-speech request failed:", error?.response?.data || error);

      if (
        error?.response?.status === 401 ||
        (typeof error?.message === "string" && error.message.includes("401"))
      ) {
        throw new Error("MiniMax authentication failed. Check your API key and group ID.");
      }

      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "MiniMax text-to-speech request failed.",
      );
    }
  }

  async createFallbackAudio(): Promise<string> {
    const fallbackFilename = `minimax_fallback_${Date.now()}.mp3`;
    const fallbackPath = path.join(this.audioDir, fallbackFilename);
    await writeFileAsync(fallbackPath, Buffer.from([0xFF, 0xFB, 0x90, 0x44, 0x00]));
    return `/audio/${fallbackFilename}`;
  }

  private normalizeModel(model?: string | null): string {
    const fallback = "speech-2.6-hd";
    if (!model) {
      return fallback;
    }
    const sanitized = model.trim().toLowerCase();
    if (!sanitized) {
      return fallback;
    }
    if (!SUPPORTED_TTS_MODELS.has(sanitized)) {
      console.warn(
        `[MiniMax] Model "${model}" is not supported by t2a_v2. Falling back to "${fallback}".`,
      );
      return fallback;
    }
    return sanitized;
  }

  private getAudioExtension(format?: string): string {
    const fallbackExt = "mp3";
    if (!format) {
      return fallbackExt;
    }
    const sanitized = format.toString().trim().toLowerCase();
    if (!sanitized) {
      return fallbackExt;
    }
    return sanitized.replace(/[^a-z0-9]/g, "") || fallbackExt;
  }

  private async saveAudio(buffer: Buffer, format?: string): Promise<string> {
    const extension = this.getAudioExtension(format);
    const filename = `minimax_${Date.now()}.${extension}`;
    const filePath = path.join(this.audioDir, filename);
    await writeFileAsync(filePath, buffer);
    return `/audio/${filename}`;
  }
}

export const minimax = new MinimaxService();
export { MinimaxService };
export type { TextToSpeechParams as MinimaxTextToSpeechParams };
