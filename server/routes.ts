import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { storySettingsSchema, insertStorySchema, insertCommentSchema } from "@shared/schema";
import { generateStory, continueStory, generateTitleSuggestions } from "./utils/openai";
import { elevenlabs } from "./utils/elevenlabs";
import path from "path";
import fs from "fs";
import { isAuthenticated } from "./middlewares/auth.middleware";
import authRoutes from "./routes/auth.route";
import { User } from "./models/user.model";
import { Story } from "./models/story.model";
import storyRoutes from "./routes/story.route";
import adminRoutes from "./routes/admin.route";
import userRoutes from "./routes/user.route";
import paymentRoutes from "./routes/payment.route";
import mongoose from "mongoose";
export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - all prefixed with /api
  
  // Auth routes
  app.use("/api/auth", authRoutes);
  app.use("/api/stories", storyRoutes);
  
  // User routes
  app.use("/api/user", userRoutes);
  
  // Admin routes
  app.use("/api/admin", adminRoutes);
  
  // Payment routes
  app.use("/api/payment", paymentRoutes);



  // Speech/Audio endpoints
  app.get("/api/speech/voices", async (req, res) => {
    try {
      const voices = await elevenlabs.getVoices();
      
      // Map to simpler format
      const mappedVoices = voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || 'unknown',
        style: voice.labels?.accent || 'neutral',
        isPremium: voice.category !== 'premade'
      }));
      
      res.json(mappedVoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voices" });
    }
  });
  
  // Debug endpoint to test audio generation and storage
  app.get("/api/speech/test", async (req, res) => {
    try {
      console.log("Testing audio generation...");
      
      // Generate a simple test audio
      const sampleText = "This is a test audio file to verify voice generation.";
      const voiceId = "EXAVITQu4vr4xnSDxMaL"; // Rachel voice ID
      
      // Generate speech
      const audioUrl = await elevenlabs.textToSpeech({
        text: sampleText,
        voiceId: voiceId
      });
      
      console.log(`Generated test audio URL: ${audioUrl}`);
      
      // Create a test story to store the audio URL
      const testStory = new Story({
        title: "Audio Test Story",
        content: sampleText,
        audioUrl: audioUrl,
        userId: "test_user",
        settings: { narrationVoice: "Rachel" },
        isPublic: true
      });
      
      // Save the test story
      await testStory.save();
      console.log(`Saved test story with ID: ${testStory._id}`);
      
      // Return success response
      res.json({
        success: true,
        message: "Test audio generated and saved to database",
        storyId: testStory._id,
        audioUrl: audioUrl
      });
    } catch (error) {
      console.error("Error in audio test endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate test audio",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // HTML test page for audio playback
  app.get("/audio-test", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Audio Playback Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .player { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          button { padding: 8px 16px; margin: 5px; cursor: pointer; }
          .status { margin: 10px 0; padding: 10px; border-radius: 4px; }
          .success { background-color: #d4edda; color: #155724; }
          .error { background-color: #f8d7da; color: #721c24; }
        </style>
      </head>
      <body>
        <h1>Audio Playback Test</h1>
        
        <div class="player">
          <h2>Test Generated Audio</h2>
          <div id="status"></div>
          <button id="fetch-btn">Fetch Latest Test Story</button>
          <div id="story-info"></div>
          <div id="player-container"></div>
        </div>
        
        <script>
          const fetchBtn = document.getElementById('fetch-btn');
          const statusDiv = document.getElementById('status');
          const storyInfoDiv = document.getElementById('story-info');
          const playerContainer = document.getElementById('player-container');
          
          fetchBtn.addEventListener('click', async () => {
            try {
              statusDiv.innerHTML = 'Fetching public stories...';
              statusDiv.className = 'status';
              
              // Fetch the latest public stories
              const response = await fetch('/api/stories/public');
              const stories = await response.json();
              
              if (stories && stories.length > 0) {
                // Use the latest story
                const story = stories[0];
                
                storyInfoDiv.innerHTML = \`
                  <h3>\${story.title}</h3>
                  <p>\${story.content}</p>
                  <p><strong>Story ID:</strong> \${story._id}</p>
                  <p><strong>Audio URL:</strong> \${story.audioUrl || 'None'}</p>
                \`;
                
                if (story.audioUrl) {
                  // Create audio player
                  playerContainer.innerHTML = \`
                    <h3>Audio Player</h3>
                    <audio controls src="\${story.audioUrl}" style="width: 100%"></audio>
                    <p>If audio doesn't play, <a href="\${story.audioUrl}" target="_blank">click here to download</a></p>
                  \`;
                  
                  statusDiv.innerHTML = 'Success! Story found with audio.';
                  statusDiv.className = 'status success';
                } else {
                  playerContainer.innerHTML = '<p>No audio available for this story</p>';
                  statusDiv.innerHTML = 'Story found but has no audio URL.';
                  statusDiv.className = 'status error';
                }
              } else {
                storyInfoDiv.innerHTML = '<p>No stories found</p>';
                playerContainer.innerHTML = '';
                statusDiv.innerHTML = 'No stories found in the database.';
                statusDiv.className = 'status error';
              }
            } catch (error) {
              console.error('Error fetching story:', error);
              statusDiv.innerHTML = \`Error: \${error.message}\`;
              statusDiv.className = 'status error';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  app.post("/api/speech/generate", async (req, res) => {
    try {
      const { text, voiceId, storyId } = z.object({
        text: z.string(),
        voiceId: z.string(),
        storyId: z.string().optional()
      }).parse(req.body);
      
      console.log(`Speech generation request received - Voice: ${voiceId}, Text length: ${text.length} chars, Story ID: ${storyId || 'none'}`);
      
      // Check if text is valid - it shouldn't be empty after stripping
      const strippedText = text.replace(/\s+/g, '');
      if (!strippedText || strippedText.length < 10) {
        return res.status(400).json({ 
          message: "Text content is too short or contains only whitespace", 
          error: "Invalid text content"
        });
      }
      
      // Get the actual ElevenLabs voice ID from the input
      const actualVoiceId = elevenlabs.getVoiceId(voiceId);
      console.log(`Using ElevenLabs voice ID: ${actualVoiceId}`);

      // Process the text for speech generation
      let processedText = text;
      
      // If text starts with "title:" or similar metadata patterns, clean it up
      if (text.match(/^\s*title:\s*[^,\n]+,\s*content:/i)) {
        // Extract just the content part if the text contains metadata
        const contentMatch = text.match(/content:\s*([\s\S]+)$/i);
        if (contentMatch && contentMatch[1]) {
          processedText = contentMatch[1].trim();
          console.log('Extracted content from metadata format');
        }
      }
      
      // Ensure we don't have any problematic characters that could cause API issues
      processedText = processedText
        .replace(/[\u2018\u2019]/g, "'")  // Replace smart quotes
        .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
        .replace(/\n{3,}/g, '\n\n')       // Normalize excessive line breaks
        .replace(/\s{3,}/g, ' ')          // Normalize excessive spaces
        .trim();

      console.log(`Processed text length: ${processedText.length} characters`);
      // For very long texts, log a warning (don't truncate here, the textToSpeech function will handle it)
      if (processedText.length > 4800) {
        console.log(`Warning: Text is very long (${processedText.length} chars), may be truncated by ElevenLabs API`);
      }

      try {
        // Check if we have an ElevenLabs API key configured
        if (!process.env.ELEVENLABS_API_KEY) {
          console.warn("No ElevenLabs API key provided. Will attempt to generate speech but may fail.");
          
          // Use askSecrets to request API key from user if needed
          return res.status(401).json({
            message: "ElevenLabs API key is required for voice generation",
            error: "No API key configured",
            apiKeyIssue: true
          });
        }
        
        // Generate speech using ElevenLabs API
        const audioUrl = await elevenlabs.textToSpeech({
          text: processedText,
          voiceId: actualVoiceId,
          model: 'eleven_monolingual_v1',
          stability: 0.5,
          similarityBoost: 0.75
        });

        console.log(`Generated audio URL: ${audioUrl}`);
        
        // Check if the audio file exists and get its size
        const filePath = path.join(process.cwd(), 'dist', 'public', audioUrl.replace(/^\//, ''));
        if (!fs.existsSync(filePath)) {
          console.error(`Generated audio file not found at path: ${filePath}`);
          return res.status(500).json({
            message: "Generated audio file not found",
            error: "File generation failed"
          });
        }
        
        const fileStats = fs.statSync(filePath);
        const fileSize = fileStats.size;
        console.log(`Generated audio file size: ${fileSize} bytes`);

        // If file is too small (less than 1KB), it's likely a fallback or error 
        // file is in bytes, so we need to convert it to kilobytes
        const fileSizeInKB = fileSize / 1024;
        const isFallback = fileSizeInKB < 1;
        console.log(`The file size is ${fileSizeInKB} KB`);
        console.log(`The isFallback is ${isFallback}`);
        
        // Only update the story if the audio file is valid
        if (storyId && !isFallback) {
          try {
            // Use the imported mongoose from the top of the file
            
            // Check if storyId is a valid MongoDB ObjectId
            if (mongoose.Types.ObjectId.isValid(storyId)) {
              // Update the story audio in the MongoDB database
              const story = await Story.findById(storyId);
              if (story) {
                story.audioUrl = audioUrl;
                await story.save();
                console.log(`Updated story ${storyId} with audio URL ${audioUrl} in MongoDB`);
              } else {
                console.log(`Story with ID ${storyId} not found in MongoDB`);
              }
              
              // Also update in storage (redundant but ensures compatibility)
              try {
                await storage.saveStoryAudio(storyId, audioUrl);
                console.log(`Saved audio URL to story ${storyId} in storage: ${audioUrl}`);
              } catch (storageError) {
                console.error(`Failed to save audio URL to storage: ${storageError}`);
              }
            } else {
              console.warn(`Invalid MongoDB ObjectId: "${storyId}". Not updating database.`);
            }
          } catch (dbError) {
            console.error(`Error updating story in database: ${dbError}`);
            // Non-critical error, continue with response
          }
        } else if (isFallback) {
          console.log(`Fallback audio file generated for story ${storyId}`);
        }
        
        // Return the audio URL and fallback status
        res.json({ 
          audioUrl,
          fallback: isFallback,
          message: isFallback ? "Generated a fallback audio file. The text may be too complex or long for the TTS service." : undefined
        });
      } catch (error) {
        console.error("ElevenLabs API error:", error);
        
        // Check if it's an API key issue
        if (error instanceof Error && 
            (error.message.includes('401') || 
             error.message.includes('Unauthorized') || 
             error.message.includes('api-key') ||
             error.message.includes('authentication'))) {
          return res.status(401).json({ 
            message: "Speech generation failed due to API authentication issues",
            error: "The ElevenLabs API key is invalid or has expired. Please update it with a valid key.",
            apiKeyIssue: true
          });
        }
        
        // If we reached here, it's a general API error
        res.status(500).json({ 
          message: "Speech generation failed",
          error: error instanceof Error ? error.message : "Unknown error",
          fallback: true
        });
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      
      // Send a more detailed error message
      if (error instanceof Error) {
        res.status(500).json({ 
          message: "Failed to generate speech", 
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          fallback: true
        });
      } else {
        res.status(500).json({ 
          message: "Failed to generate speech - unknown error",
          fallback: true
        });
      }
    }
  });
  
  // Simple test endpoint for audio generation without database interaction
  app.post('/api/speech/test', async (req, res) => {
    try {
      const { text, voiceId } = z.object({
        text: z.string(),
        voiceId: z.string()
      }).parse(req.body);
      
      console.log(`Test speech generation - Voice: ${voiceId}, Text length: ${text.length} chars`);
      
      // Get the actual ElevenLabs voice ID from the input
      const actualVoiceId = elevenlabs.getVoiceId(voiceId);
      console.log(`Using ElevenLabs voice ID: ${actualVoiceId}`);
      
      // Process text (simplified for testing)
      const processedText = text
        .replace(/[\u2018\u2019]/g, "'")  // Replace smart quotes
        .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
        .replace(/\n{3,}/g, '\n\n')       // Normalize excessive line breaks
        .replace(/\s{3,}/g, ' ')          // Normalize excessive spaces
        .trim();
      
      // Generate speech using ElevenLabs API
      const audioUrl = await elevenlabs.textToSpeech({
        text: processedText,
        voiceId: actualVoiceId,
        model: 'eleven_monolingual_v1',
        stability: 0.5,
        similarityBoost: 0.75
      });
      
      // Check if the audio file exists and get its size
      const filePath = path.join(process.cwd(), 'dist', 'public', audioUrl.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({
          message: "Generated audio file not found",
          error: "File generation failed"
        });
      }
      
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;
      const fileSizeInKB = fileSize / 1024;
      
      return res.status(200).json({
        message: "Speech generated successfully",
        audioUrl,
        fileSize: fileSizeInKB.toFixed(2) + " KB",
        success: true
      });
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      return res.status(500).json({
        message: "Speech generation failed",
        error: error.message || String(error),
        fallback: true
      });
    }
  });

  // app.get("/api/speech/:storyId", async (req, res) => {
  //   try {
  //     const storyId = req.params.storyId;
  //     // const audio = await storage.getStoryAudio(storyId);
  //     //we get audio from database
  //     const story = await Story.findById(storyId);
  //     const audio = story?.audioUrl;
  //     console.log(`The audio is ${audio}`);
      
  //     if (!audio) {
  //       return res.status(404).json({ message: "Audio not found" });
  //     }
      
  //     res.json({ audioUrl: audio });
  //   } catch (error) {
  //     res.status(500).json({ message: "Failed to fetch audio" });
  //   }
  // });
  
  // Community endpoints
  app.get("/api/community/discussions", async (req, res) => {
    try {
      const discussions = await storage.getDiscussions();
      res.json(discussions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  app.get("/api/community/popular-stories", async (req, res) => {
    try {
      const stories = await storage.getPopularStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular stories" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
