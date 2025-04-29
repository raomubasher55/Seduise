import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string;
  category: string;
  labels: Record<string, string>;
}

interface TextToSpeechParams {
  text: string;
  voiceId: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
}

class ElevenLabs {
  private client: ElevenLabsClient;
  private audioDir: string;

  constructor() {
    // Initialize the official ElevenLabs client
    this.client = new ElevenLabsClient({
      apiKey: "sk_ef5e267d5cae4920d118ea0d57eea2d13f566a5d093d2c88"
    });

    this.audioDir = path.join(process.cwd(), 'dist', 'public', 'audio');
    
    // Ensure audio directory exists
    this.ensureAudioDir();
  }

  private async ensureAudioDir() {
    try {
      // Added recursive mkdir regardless of existence check to ensure all parent directories are created
      await mkdirAsync(this.audioDir, { recursive: true });
      console.log(`Audio directory ensured at: ${this.audioDir}`);
    } catch (error) {
      // Only log if it's not a "directory already exists" error
      if (!(error instanceof Error && error.message.includes('already exists'))) {
        console.error('Error creating audio directory:', error);
      }
    }
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      console.log("Fetching voices from ElevenLabs...");
      const response = await this.client.voices.getAll();
      
      // Map the response to our interface with proper null/undefined checks
      const voices = response.voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name || 'Unknown Voice',
        preview_url: voice.preview_url || '',
        category: voice.category || 'general',
        labels: voice.labels || {}
      }));
      
      console.log(`Retrieved ${voices.length} voices from ElevenLabs`);
      return voices;
    } catch (error) {
      console.error('Error getting voices:', error);
      return [];
    }
  }

  async textToSpeech({
    text,
    voiceId,
    model = 'eleven_multilingual_v2',
    stability = 0.5,
    similarityBoost = 0.75
  }: TextToSpeechParams): Promise<string> {
    try {
      // Log inputs for debugging
      console.log(`Starting text-to-speech generation with voice ID: ${voiceId}`);
      console.log(`Text length: ${text.length} characters`);
      
      // Sanitize the text to remove any potential problematic characters
      // Remove any non-printable characters and normalize whitespace
      const sanitizedText = text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Remove control characters
        .replace(/\n+/g, '\n')                          // Normalize line breaks
        .trim();                                        // Remove leading/trailing whitespace
      
      console.log(`Sanitized text length: ${sanitizedText.length} characters`);
      
      // Generate speech using the official package
      // This returns a Readable stream, not a Buffer
      const audioStream = await this.client.textToSpeech.convert(
        voiceId,
        {
          text: sanitizedText,
          model_id: model,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost
          },
          output_format: "mp3_44100_128" // High quality MP3 format
        }
      );
      
      // Ensure directory exists right before saving
      await this.ensureAudioDir();
      
      // Save audio to file
      const filename = `story_${Date.now()}.mp3`;
      const filePath = path.join(this.audioDir, filename);
      
      console.log(`Saving audio file to: ${filePath}`);
      
      // Create a write stream to the file
      const fileWriteStream = fs.createWriteStream(filePath);
      
      // Pipe the audio stream to the file
      await pipeline(audioStream, fileWriteStream);
      
      console.log(`Audio file saved successfully to: ${filePath}`);

      // Return the URL path to the audio file
      const audioPath = `/audio/${filename}`;
      console.log(`Audio URL path set to: ${audioPath}`);
      return audioPath;
    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Provide better error message for common issues
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error(
            "ElevenLabs API authentication failed. This is likely due to an invalid or expired API key. " +
            "Please update your API key or check your ElevenLabs account for quota limits."
          );
        }
      }
      
      throw error; // Throw the original error to preserve the stack trace
    }
  }

  // Map voice names from story settings to ElevenLabs voice IDs
  getVoiceId(voiceName: string): string {
    // Default voice mapping - in a real implementation, this would be more comprehensive
    const voiceMap: Record<string, string> = {
      'Soft Female': 'EXAVITQu4vr4xnSDxMaL',
      'Deep Male': 'VR6AewLTigWG4xSOukaG',
      'Sensual Female': 'yoZ06aMxZJJ28mfd3POQ',
      'Authoritative Male': 'TxGEqnHWrfWFTfGW9XjX',
      'Playful Female': '21m00Tcm4TlvDq8ikWAM'
    };
    
    return voiceMap[voiceName] || 'EXAVITQu4vr4xnSDxMaL'; // Default to 'Soft Female' if voice not found
  }
}

export const elevenlabs = new ElevenLabs();
