import dotenv from 'dotenv'
dotenv.config();
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';


// Set ffmpeg and ffprobe paths explicitly
ffmpeg.setFfmpegPath('/nix/store/3zc5jbvqzrn8zmva4fx5p0nh4yy03wk4-ffmpeg-6.1.1-bin/bin/ffmpeg');
ffmpeg.setFfprobePath('/nix/store/3zc5jbvqzrn8zmva4fx5p0nh4yy03wk4-ffmpeg-6.1.1-bin/bin/ffprobe');

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Voice interface
interface ElevenLabsVoice {
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
  stability?: number;
  similarityBoost?: number;
}

class ElevenLabsService {
  private apiKey: string;
  private audioDir: string;

  constructor(apiKey?: string) {
    // Prioritize environment variable, then fall back to provided key or empty string
    const envKey = process.env.ELEVENLABS_API_KEY;
    
    if (envKey) {
      this.apiKey = envKey;
      console.log('Using ElevenLabs API key from environment variable');
    } else if (apiKey) {
      this.apiKey = apiKey;
      console.log('Using provided ElevenLabs API key parameter');
    } else {
      this.apiKey = "";
      console.error('ERROR: No ElevenLabs API key provided. Audio generation will not work.');
    }
    
    if (this.apiKey) {
      // Log a censored version of the API key for debugging
      const censoredKey = this.apiKey.substring(0, 6) + '...' + this.apiKey.substring(this.apiKey.length - 4);
      console.log(`ElevenLabs API key is configured: ${censoredKey}`);
    }
    
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

  // Create a fallback audio file when TTS fails
  async createFallbackAudio(): Promise<string> {
    const fallbackFilename = `fallback_${Date.now()}.mp3`;
    const fallbackPath = path.join(this.audioDir, fallbackFilename);
    
    try {
      // Create a minimal valid MP3 file (mostly silent)
      await writeFileAsync(fallbackPath, Buffer.from([0xFF, 0xFB, 0x90, 0x44, 0x00]));
      console.log(`Created fallback audio file: ${fallbackPath}`);
      return `/audio/${fallbackFilename}`;
    } catch (error) {
      console.error('Error creating fallback audio file:', error);
      throw error;
    }
  }

  // Get available ElevenLabs voices
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      console.log('Fetching voices from ElevenLabs API...');
      
      // Direct API call instead of using the client
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      // Check if the response contains voices
      if (response.data && response.data.voices && Array.isArray(response.data.voices)) {
        // Map response to our voice format
        return response.data.voices.map((voice: any) => ({
          voice_id: voice.voice_id || '',
          name: voice.name || 'Unknown',
          preview_url: voice.preview_url || '',
          category: voice.category || 'elevenlabs',
          labels: {
            gender: this.determineGender(voice),
            style: this.determineStyle(voice)
          }
        }));
      }

      console.log('response.data is ' , response.data);
      
      console.warn('No voices found in API response, returning predefined voices');
      return this.getPredefinedVoices();
    } catch (error) {
      console.error('Error fetching voices from ElevenLabs:', error);
      
      // Return predefined voices if API call fails
      return this.getPredefinedVoices();
    }
  }

  // Convert text to speech using ElevenLabs
  async textToSpeech({
    text,
    voiceId,
    model = 'eleven_monolingual_v1',
    stability = 0.5,
    similarityBoost = 0.75
  }: TextToSpeechParams): Promise<string> {
    try {
      console.log(`Starting text-to-speech generation with voice ID: ${voiceId}`);
      
      // Verify API key is set
      if (!this.apiKey || this.apiKey.trim() === "") {
        console.error("ElevenLabs API key is not configured. Cannot generate speech.");
        throw new Error("ElevenLabs API key is missing or empty. Please configure it in your environment variables.");
      }
      
      // Sanitize the text
      const sanitizedText = text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Remove control characters
        .replace(/\n+/g, ' ')                           // Replace newlines with spaces
        .replace(/\s{2,}/g, ' ')                        // Normalize excessive spaces
        .replace(/'/g, "'")                             // Replace smart quotes
        .replace(/"/g, '"')                             // Replace smart double quotes
        .trim();                                        // Remove leading/trailing whitespace
      
      // Split text into chunks of 10000 characters, keeping sentences intact
      // This allows for longer audio generation, approximately 10 minutes per chunk
      const chunks = this.splitTextIntoChunks(sanitizedText, 10000);
      console.log(`Split text into ${chunks.length} chunks for processing (max 10000 chars each)`);
      
      // Generate unique base filename
      const baseFilename = `story_${Date.now()}`;
      
      // Process each chunk and get temporary files
      const tempFiles: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkFilename = `${baseFilename}_part${i}.mp3`;
        const chunkFilePath = path.join(this.audioDir, chunkFilename);
        
        console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
        
        try {
          // Get the actual voice ID
          const actualVoiceId = this.getActualVoiceId(voiceId);
          
          // Generate audio for chunk with retry logic
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              console.log(`Calling ElevenLabs API with voice ID: ${actualVoiceId}, chunk length: ${chunk.length} chars, API key length: ${this.apiKey.length} chars`);
              
              const response = await axios({
                method: 'post',
                url: `https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`,
                headers: {
                  'xi-api-key': this.apiKey,
                  'Content-Type': 'application/json',
                  'Accept': 'audio/mpeg'
                },
                data: {
                  text: chunk,
                  model_id: model,
                  voice_settings: {
                    stability,
                    similarity_boost: similarityBoost
                  }
                },
                responseType: 'arraybuffer'
              });
              
              // Log successful API call
              console.log(`ElevenLabs API call successful for chunk ${i + 1}/${chunks.length}`);
              
              // Write chunk to temporary file
              await writeFileAsync(chunkFilePath, Buffer.from(response.data));
              tempFiles.push(chunkFilePath);
              
              // Successful response, break the retry loop
              break;
            } catch (error: any) {
              retryCount++;
              console.error(`Error calling ElevenLabs API (attempt ${retryCount}/${maxRetries}):`, error.message);
              
              // If this is an API key error, don't retry
              if (error.response?.status === 401 || 
                  (error.message && (
                    error.message.includes('401') || 
                    error.message.includes('Unauthorized') ||
                    error.message.includes('api-key')
                  ))) {
                console.error("API authentication error - check your ElevenLabs API key");
                throw error;
              }
              
              if (retryCount === maxRetries) {
                throw error;
              }
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
            }
          }
          
          // Add delay between chunks to avoid rate limiting
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
          throw chunkError;
        }
      }
      
      // Combine all chunks into final audio file
      const finalFilename = `${baseFilename}.mp3`;
      const finalFilePath = path.join(this.audioDir, finalFilename);
      
      try {
        if (tempFiles.length === 0) {
          throw new Error("No audio chunks were generated");
        } else if (tempFiles.length === 1) {
          // If only one chunk, just rename/copy the file
          console.log("Only one audio chunk, copying directly to final file");
          fs.copyFileSync(tempFiles[0], finalFilePath);
        } else {
          // Combine multiple chunks using ffmpeg
          console.log(`Combining ${tempFiles.length} audio chunks with ffmpeg`);
          try {
            await new Promise((resolve, reject) => {
              const command = ffmpeg();
              tempFiles.forEach(file => {
                command.input(file);
              });
              command
                .on('end', () => {
                  console.log("FFmpeg successfully combined audio chunks");
                  resolve(null);
                })
                .on('error', (err) => {
                  console.error("FFmpeg error:", err);
                  reject(err);
                })
                .mergeToFile(finalFilePath, this.audioDir);
            });
          } catch (ffmpegError) {
            console.error("FFmpeg failed, falling back to using just the first chunk:", ffmpegError);
            // Fallback to just using the first chunk if ffmpeg fails
            console.log("Using first chunk as fallback in case of FFmpeg failure");
            fs.copyFileSync(tempFiles[0], finalFilePath);
          }
        }
        
        // Clean up temp files regardless of method used
        tempFiles.forEach(file => {
          try { 
            fs.unlinkSync(file); 
            console.log(`Deleted temp file: ${file}`);
          } catch (e) { 
            console.error('Error deleting temp file:', e); 
          }
        });
      } catch (error) {
        console.error("Error combining audio chunks:", error);
        throw error;
      }
      
      // Verify final file
      const fileStats = fs.statSync(finalFilePath);
      console.log(`Final audio file size: ${fileStats.size} bytes`);
      
      if (fileStats.size < 1024) {
        throw new Error("Generated audio file is too small, likely invalid");
      }
      
      return `/audio/${finalFilename}`;
    } catch (error: any) {
      console.error('Error generating speech:', error);
      
      // Handle API authentication errors
      if (error.message && (
          error.message.includes('401') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('api-key')
      )) {
        throw new Error("ElevenLabs API authentication failed. Please check your API key.");
      }
      
      throw error;
    }
  }

  private splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      // If a single sentence is longer than maxChunkSize, split it by words
      if (sentence.length > maxChunkSize) {
        const words = sentence.split(/\s+/);
        let tempChunk = '';
        
        for (const word of words) {
          if ((tempChunk + ' ' + word).length <= maxChunkSize) {
            tempChunk += (tempChunk ? ' ' : '') + word;
          } else {
            if (tempChunk) chunks.push(tempChunk.trim());
            tempChunk = word;
          }
        }
        if (tempChunk) chunks.push(tempChunk.trim());
        continue;
      }
      
      // For normal sentences
      if ((currentChunk + ' ' + sentence).length <= maxChunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }
    
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  // Determine gender based on voice metadata
  private determineGender(voice: any): string {
    const name = (voice.name || '').toLowerCase();
    const labels = Object.keys(voice.labels || {}).join(' ').toLowerCase();
    
    if (name.includes('female') || labels.includes('female')) {
      return 'female';
    } else if (name.includes('male') || labels.includes('male')) {
      return 'male';
    }
    
    // Default gender based on voice name patterns
    const femaleNames = ['rachel', 'domi', 'bella', 'elli', 'anna', 'matilda', 'charlotte'];
    const maleNames = ['antoni', 'josh', 'arnold', 'adam', 'sam', 'harry', 'james'];
    
    for (const femaleName of femaleNames) {
      if (name.includes(femaleName)) return 'female';
    }
    
    for (const maleName of maleNames) {
      if (name.includes(maleName)) return 'male';
    }
    
    // Default
    return 'unknown';
  }
  
  // Determine style based on voice metadata
  private determineStyle(voice: any): string {
    const name = (voice.name || '').toLowerCase();
    const labels = Object.keys(voice.labels || {}).join(' ').toLowerCase();
    
    if (labels.includes('soft') || name.includes('soft')) {
      return 'soft';
    } else if (labels.includes('deep') || name.includes('deep')) {
      return 'deep';
    } else if (labels.includes('sensual') || name.includes('sensual')) {
      return 'sensual';
    } else if (labels.includes('authoritative') || name.includes('authoritative')) {
      return 'authoritative';
    } else if (labels.includes('playful') || name.includes('playful')) {
      return 'playful';
    }
    
    // Default
    return 'natural';
  }

  // Get actual ElevenLabs voice ID from input
  private getActualVoiceId(voiceId: string): string {
    // Define voice mappings with all possible variations
    const voiceMappings = {
      // Main voice categories with their IDs
      male: {
        default: 'VR6AewLTigWG4xSOukaG',    // Adam (Deep Male)
        deep: 'VR6AewLTigWG4xSOukaG',       // Adam
        authoritative: 'TxGEqnHWrfWFTfGW9XjX' // Josh
      },
      female: {
        default: 'EXAVITQu4vr4xnSDxMaL',    // Rachel (Soft Female)
        soft: 'EXAVITQu4vr4xnSDxMaL',       // Rachel
        sensual: 'yoZ06aMxZJJ28mfd3POQ',    // Bella
        playful: '21m00Tcm4TlvDq8ikWAM'     // Domi
      }
    };

    // Direct ID mappings for exact matches
    const directMappings: Record<string, string> = {
      'Rachel': voiceMappings.female.soft,
      'Adam': voiceMappings.male.deep,
      'Bella': voiceMappings.female.sensual,
      'Josh': voiceMappings.male.authoritative,
      'Domi': voiceMappings.female.playful,
      'Charlie': 'IKne3meq5aSn9XLyUdCD',
      'Will': 'bIHbv24MWmeRgasZH58o',  // Add Will's voice ID from logs
      'Soft Female': voiceMappings.female.soft,
      'Deep Male': voiceMappings.male.deep,
      'Sensual Female': voiceMappings.female.sensual,
      'Authoritative Male': voiceMappings.male.authoritative,
      'Playful Female': voiceMappings.female.playful
    };

    // Log input for debugging
    console.log(`Mapping voice ID/name input: "${voiceId}"`);

    // Handle undefined/null input
    if (!voiceId) {
      console.warn('Voice ID is undefined or null, defaulting to Rachel (Soft Female)');
      return voiceMappings.female.default;
    }

    // The important fix: if the input is an ElevenLabs voice ID format (typically a 21-character alphanumeric string),
    // use it directly without trying to map it
    if (voiceId && voiceId.length >= 20 && /^[a-zA-Z0-9]+$/.test(voiceId)) {
      console.log(`Using direct ElevenLabs voice ID: ${voiceId}`);
      return voiceId;
    }

    // Normalize input for text-based matching
    const normalizedInput = voiceId.toLowerCase().trim();

    // Check for direct mapping first
    if (directMappings[voiceId]) {
      console.log(`Found direct mapping for "${voiceId}": ${directMappings[voiceId]}`);
      return directMappings[voiceId];
    }

    // Check if it's a valid ElevenLabs voice ID in our known list
    const validVoiceIds = [
      ...Object.values(voiceMappings.male),
      ...Object.values(voiceMappings.female)
    ];
    if (validVoiceIds.includes(voiceId)) {
      console.log(`Using provided valid voice ID from our known list: ${voiceId}`);
      return voiceId;
    }

    // Determine gender and style from input
    if (normalizedInput.includes('male') && !normalizedInput.includes('female')) {
      // Handle male voices
      if (normalizedInput.includes('authoritative')) {
        return voiceMappings.male.authoritative;
      }
      return voiceMappings.male.default;
    }

    // Handle female voices or default case
    if (normalizedInput.includes('sensual')) {
      return voiceMappings.female.sensual;
    } else if (normalizedInput.includes('playful')) {
      return voiceMappings.female.playful;
    } else if (normalizedInput.includes('soft')) {
      return voiceMappings.female.soft;
    }

    // Default to soft female voice if no specific match found
    console.warn(`No specific match found for "${voiceId}", defaulting to Rachel (Soft Female)`);
    return voiceMappings.female.default;
  }

  // Get predefined voices if API isn't available
  private getPredefinedVoices(): ElevenLabsVoice[] {
    return [
      {
        voice_id: "EXAVITQu4vr4xnSDxMaL",
        name: "Rachel (Soft Female)",
        preview_url: "https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview",
        category: "elevenlabs",
        labels: { gender: "female", style: "soft" }
      },
      {
        voice_id: "VR6AewLTigWG4xSOukaG",
        name: "Adam (Deep Male)",
        preview_url: "https://api.elevenlabs.io/v1/voices/VR6AewLTigWG4xSOukaG/preview",
        category: "elevenlabs",
        labels: { gender: "male", style: "deep" }
      },
      {
        voice_id: "yoZ06aMxZJJ28mfd3POQ",
        name: "Bella (Sensual Female)",
        preview_url: "https://api.elevenlabs.io/v1/voices/yoZ06aMxZJJ28mfd3POQ/preview",
        category: "elevenlabs",
        labels: { gender: "female", style: "sensual" }
      },
      {
        voice_id: "TxGEqnHWrfWFTfGW9XjX",
        name: "Josh (Authoritative Male)",
        preview_url: "https://api.elevenlabs.io/v1/voices/TxGEqnHWrfWFTfGW9XjX/preview",
        category: "elevenlabs",
        labels: { gender: "male", style: "authoritative" }
      },
      {
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        name: "Domi (Playful Female)",
        preview_url: "https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/preview",
        category: "elevenlabs",
        labels: { gender: "female", style: "playful" }
      },
      {
        voice_id: "IKne3meq5aSn9XLyUdCD",
        name: "Charlie",
        preview_url: "https://api.elevenlabs.io/v1/voices/IKne3meq5aSn9XLyUdCD/preview",
        category: "elevenlabs",
        labels: { gender: "male", style: "conversational" }
      }
    ];
  }

  // Map frontend voice name to ElevenLabs voice ID (public method)
  getVoiceId(voiceName: string): string {
    // Log input for debugging
    console.log(`getVoiceId called with: "${voiceName}"`);
    
    // This is the publicly accessible method that the routes use
    // Just delegate to the more detailed internal implementation
    return this.getActualVoiceId(voiceName);
  }
}

// Create a singleton instance
export const elevenlabs = new ElevenLabsService();

// Export the class for advanced usage or testing
export { ElevenLabsService };