import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const copyFileAsync = promisify(fs.copyFile);

// Voice interface to maintain compatibility
interface MurfVoice {
  voice_id: string;
  name: string;
  preview_url: string;
  category: string;
  labels: Record<string, string>;
}

// Text-to-Speech parameters interface
interface TextToSpeechParams {
  text: string;
  voiceId: string;
  model?: string;
  style?: string;
  stability?: number;
  similarityBoost?: number;
}

class MurfTextToSpeech {
  private apiKey: string;
  private audioDir: string;
  private baseApiUrl: string;

  constructor(apiKey?: string) {
    // Use provided API key or fallback to environment variable
    this.apiKey = apiKey || process.env.MURF_API_KEY || "ap2_ad133540-b826-4871-92a4-0a4a5da76cd8";
    
    if (!this.apiKey) {
      console.error('WARNING: No Murf.ai API key provided. Audio generation will not work.');
    } else {
      console.log('Murf.ai API key is configured');
    }
    
    this.baseApiUrl = 'https://api.murf.ai/v1/speech/generate';
    
    // Set up audio directory
    this.audioDir = path.join(process.cwd(), 'dist', 'public', 'audio');
    
    // Ensure audio directory exists
    this.ensureAudioDir();
  }

  // Ensure audio directory exists
  private async ensureAudioDir(): Promise<void> {
    try {
      await mkdirAsync(this.audioDir, { recursive: true });
      console.log(`Audio directory ensured at: ${this.audioDir}`);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('already exists'))) {
        console.error('Error creating audio directory:', error);
      }
    }
  }

  // Get available Murf.ai voices
  async getVoices(): Promise<MurfVoice[]> {
    return [
      // US English voices
      {
        voice_id: "en-US-natalie",
        name: "Natalie (US)",
        preview_url: "",
        category: "murf",
        labels: { gender: "female", style: "natural" }
      },
      {
        voice_id: "en-US-mike",
        name: "Mike (US)",
        preview_url: "",
        category: "murf",
        labels: { gender: "male", style: "natural" }
      },
      {
        voice_id: "en-US-leah",
        name: "Leah (US)",
        preview_url: "",
        category: "murf",
        labels: { gender: "female", style: "conversational" }
      },
      {
        voice_id: "en-US-ken",
        name: "Ken (US)",
        preview_url: "",
        category: "murf",
        labels: { gender: "male", style: "deep" }
      },
      {
        voice_id: "en-US-amy",
        name: "Amy (US)",
        preview_url: "",
        category: "murf",
        labels: { gender: "female", style: "professional" }
      },
      {
        voice_id: "en-US-brian",
        name: "Brian (US)",
        preview_url: "",
        category: "murf",
        labels: { gender: "male", style: "casual" }
      },
      
      // UK English voices
      {
        voice_id: "en-GB-emma",
        name: "Emma (UK)",
        preview_url: "",
        category: "murf",
        labels: { gender: "female", style: "british" }
      },
      {
        voice_id: "en-GB-james",
        name: "James (UK)",
        preview_url: "",
        category: "murf",
        labels: { gender: "male", style: "british" }
      }
    ];
  }

  // Convert text to speech
  async textToSpeech({
    text,
    voiceId,
    style = 'Neutral',
    model = 'murf_standard',
    stability = 0.5,
    similarityBoost = 0.75
  }: TextToSpeechParams): Promise<string> {
    try {
      // Log inputs for debugging
      console.log(`Starting text-to-speech generation with voice ID: ${voiceId}`);
      console.log(`Text length: ${text.length} characters`);
      
      // Sanitize the text
      const sanitizedText = text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Remove control characters
        .replace(/\n+/g, ' ')                           // Replace newlines with spaces
        .replace(/\s{2,}/g, ' ')                        // Normalize excessive spaces
        .replace(/'/g, "'")                             // Replace smart quotes
        .replace(/"/g, '"')                             // Replace smart double quotes
        .trim();                                        // Remove leading/trailing whitespace
      
      // Limit text length to avoid API errors
      const limitedText = sanitizedText.substring(0, 2000);
      if (limitedText.length < sanitizedText.length) {
        console.log(`Text truncated from ${sanitizedText.length} to ${limitedText.length} characters to avoid API limits`);
      }
      
      // Generate unique filename
      const filename = `story_${Date.now()}.mp3`;
      const filePath = path.join(this.audioDir, filename);
      
      // Ensure directory exists
      await this.ensureAudioDir();
      
      // Prepare request data
      const data = {
        text: limitedText,
        voiceId: this.getNormalizedVoiceId(voiceId),
        style: style
      };
      
      console.log(`Sending request to Murf.ai with voice: ${data.voiceId}`);
      
      try {
        // Make API request
        const response = await axios.post(this.baseApiUrl, data, {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "api-key": this.apiKey,
          },
          timeout: 30000 // 30 second timeout
        });
        
        console.log("Murf API response status:", response.status);
        
        // Validate response
        if (!response.data.audioFile) {
          console.error("No audio file found in the API response:", response.data);
          throw new Error("No audio file found in the response");
        }
        
        // Get the audio file URL
        const audioFileUrl = response.data.audioFile;
        console.log(`Received audio file URL: ${audioFileUrl}`);
        console.log(`Audio length: ${response.data.audioLengthInSeconds || "unknown"} seconds`);
        
        // Download the audio file
        const downloadResponse = await axios({
          method: 'get',
          url: audioFileUrl,
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        // Write the response data to a file
        await writeFileAsync(filePath, Buffer.from(downloadResponse.data));
        console.log(`Audio saved to ${filePath}`);
        
        // Return the URL path to the audio file
        const audioPath = `/audio/${filename}`;
        
        // Verify file size
        const fileStats = fs.statSync(filePath);
        console.log(`Downloaded file size: ${fileStats.size} bytes`);
        
        if (fileStats.size < 1024) {
          console.warn(`WARNING: Downloaded file size is suspiciously small (${fileStats.size} bytes)`);
          throw new Error("Downloaded audio file is too small, likely invalid");
        }
        
        return audioPath;
      } catch (apiError: any) {
        console.error('Error with API call:', apiError.message);
        
        if (apiError.response) {
          console.error("API response error:", {
            status: apiError.response.status,
            data: apiError.response.data
          });
        }
        
        throw apiError; // Re-throw to be handled by outer catch
      }
    } catch (error: any) {
      console.error('Error generating speech:', error);
      
      // Handle specific API authentication errors
      if (error.message && (
          error.message.includes('401') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('api-key')
      )) {
        console.error("API authentication error - check your API key");
      }
      
      // Fallback audio handling
      try {
        const filename = `fallback_${Date.now()}.mp3`;
        const filePath = path.join(this.audioDir, filename);
        
        // Create a minimal silent MP3 file
        const silentMp3 = Buffer.from([
          0xFF, 0xFB, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0xFF, 0xFB, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await writeFileAsync(filePath, silentMp3);
        console.log(`Created fallback audio file: ${filePath}`);
        
        return `/audio/${filename}`;
      } catch (fallbackError) {
        console.error('Fallback audio creation failed:', fallbackError);
        throw error; // Rethrow original error
      }
    }
  }

  // Normalize voice ID for Murf.ai
  private getNormalizedVoiceId(voiceId: string): string {
    // Voice mapping for different input types
    const voiceMap: Record<string, string> = {
      // ElevenLabs to Murf mapping
      'EXAVITQu4vr4xnSDxMaL': 'en-US-natalie', // Soft Female
      'VR6AewLTigWG4xSOukaG': 'en-US-ken',     // Deep Male
      'yoZ06aMxZJJ28mfd3POQ': 'en-US-natalie', // Sensual Female
      'TxGEqnHWrfWFTfGW9XjX': 'en-US-mike',    // Authoritative Male
      '21m00Tcm4TlvDq8ikWAM': 'en-US-leah',    // Playful Female

      // Story voice names mapping
      'Soft Female': 'en-US-natalie',
      'Deep Male': 'en-US-ken',
      'Sensual Female': 'en-US-natalie',
      'Authoritative Male': 'en-US-mike',
      'Playful Female': 'en-US-leah'
    };

    // Available Murf voices
    const murfVoices: Record<string, string> = {
      'en-US-natalie': 'en-US-natalie',
      'en-US-mike': 'en-US-mike',
      'en-US-leah': 'en-US-leah',
      'en-US-ken': 'en-US-ken',
      'en-US-amy': 'en-US-amy',
      'en-US-brian': 'en-US-brian',
      'en-GB-emma': 'en-GB-emma',
      'en-GB-james': 'en-GB-james'
    };

    // Check if input is already a valid Murf voice ID
    if (murfVoices[voiceId]) return voiceId;

    // Check mapped voices
    const mappedVoice = voiceMap[voiceId];
    if (mappedVoice) return mappedVoice;

    // Default to Natalie if no match found
    console.warn(`Voice ID ${voiceId} not found, defaulting to en-US-natalie`);
    return 'en-US-natalie';
  }

  // Map to ElevenLabs-like voice selection
  getVoiceId(voiceName: string): string {
    const voiceMap: Record<string, string> = {
      'Soft Female': 'en-US-natalie',
      'Deep Male': 'en-US-ken',
      'Sensual Female': 'en-US-natalie',
      'Authoritative Male': 'en-US-mike',
      'Playful Female': 'en-US-leah'
    };
    
    return voiceMap[voiceName] || 'en-US-natalie';
  }
}

// Create a singleton instance
export const elevenlabs = new MurfTextToSpeech();

// Export the class for advanced usage or testing
export { MurfTextToSpeech };