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
import badgeRoutes from "./routes/badge.route";
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
  
  // Badge routes
  app.use("/api/badges", badgeRoutes);



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

  app.post("/api/speech/generate", isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch user to check subscription plan
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Explicitly block audio generation for free users
    if (user.subscription === 'free') {
      return res.status(403).json({
        message: "Audio generation is not available on the Free plan. Please upgrade your subscription.",
        code: "PREMIUM_REQUIRED"
      });
    }

    let creditsDeducted = 0; // Track credits deducted for potential refund

    try {
      const { text, voiceId, storyId } = z.object({
        text: z.string(),
        voiceId: z.string(),
        storyId: z.string().optional()
      }).parse(req.body);

      console.log(`Speech generation request received - Voice: ${voiceId}, Text length: ${text.length} chars, Story ID: ${storyId || 'none'}`);

      const strippedText = text.replace(/\s+/g, '');
      if (!strippedText || strippedText.length < 10) {
        return res.status(400).json({
          message: "Text content is too short or contains only whitespace",
          error: "Invalid text content"
        });
      }

      // Process the text for speech generation to get accurate length for credit calculation
      let processedText = text;
      if (text.match(/^\s*title:\s*[^,\n]+,\s*content:/i)) {
        const contentMatch = text.match(/content:\s*([\s\S]+)$/i);
        if (contentMatch && contentMatch[1]) {
          processedText = contentMatch[1].trim();
        }
      }
      processedText = processedText
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s{3,}/g, ' ')
        .trim();

      // Calculate estimated audio length in minutes (rough estimate: 150 words/minute, 5 chars/word) -> 750 chars/minute
      const estimatedAudioLengthMinutes = Math.ceil(processedText.length / 750);

     

      let processedVoiceId = voiceId;
      if (voiceId === "George") {
        processedVoiceId = "VR6AewLTigWG4xSOukaG";
      } else if (voiceId === "Charlie") {
        processedVoiceId = "IKne3meq5aSn9XLyUdCD";
      } else if (voiceId === "Will") {
        processedVoiceId = "bIHbv24MWmeRgasZH58o";
      }

      const actualVoiceId = elevenlabs.getVoiceId(processedVoiceId);
      console.log(`Using ElevenLabs voice ID: ${actualVoiceId}`);

      console.log(`Processed text length: ${processedText.length} characters`);
      if (processedText.length > 4800) {
        console.log(`Warning: Text is very long (${processedText.length} chars), may be truncated by ElevenLabs API`);
      }

      try {
        if (!process.env.ELEVENLABS_API_KEY) {
          return res.status(401).json({
            message: "ElevenLabs API key is required for voice generation",
            error: "No API key configured",
            apiKeyIssue: true
          });
        }

        const audioUrl = await elevenlabs.textToSpeech({
          text: processedText,
          voiceId: actualVoiceId,
          model: 'eleven_monolingual_v1',
          stability: 0.5,
          similarityBoost: 0.75
        });

        console.log(`Generated audio URL: ${audioUrl}`);

        const filePath = path.join(process.cwd(), 'dist', 'public', audioUrl.replace(/^\//, ''));
        if (!fs.existsSync(filePath)) {
          throw new Error("Generated audio file not found");
        }

        const fileStats = fs.statSync(filePath);
        const fileSize = fileStats.size;
        const fileSizeInKB = fileSize / 1024;
        const isFallback = fileSizeInKB < 1; // Assuming very small files are fallbacks

        if (storyId && !isFallback) {
          if (mongoose.Types.ObjectId.isValid(storyId)) {
            const story = await Story.findById(storyId);
            if (story) {
              story.audioUrl = audioUrl;
              await story.save();
              console.log(`Updated story ${storyId} with audio URL ${audioUrl} in MongoDB`);
            } else {
              console.log(`Story with ID ${storyId} not found in MongoDB`);
            }
          }
        }


        res.json({
          audioUrl,
          fallback: isFallback,
          message: isFallback ? "Generated a fallback audio file. The text may be too complex or long for the TTS service." : undefined
        });
      } catch (error: any) {
        console.error("ElevenLabs API error during generation:", error);

      

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

        res.status(500).json({
          message: "Speech generation failed",
          error: error.message || "Unknown error",
          fallback: true
        });
      }
    } catch (error: any) {
      console.error("Error in speech generation request parsing/initial checks:", error);

      // Refund credits if an error occurred before API call but after deduction
    

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
      
      // Handle specific voice name cases before conversion
      let processedVoiceId = voiceId;
      
      // Check if we're receiving a UI name like "George" and map it directly
      if (voiceId === "George") {
        console.log("Explicitly mapping George to Adam's deep male voice");
        processedVoiceId = "VR6AewLTigWG4xSOukaG"; // Adam's voice ID
      } else if (voiceId === "Charlie") {
        console.log("Explicitly mapping Charlie to Charlie's male voice");
        processedVoiceId = "IKne3meq5aSn9XLyUdCD"; // Charlie's voice ID
      } else if (voiceId === "Will") {
        console.log("Explicitly mapping Will to Will's male voice");
        processedVoiceId = "bIHbv24MWmeRgasZH58o"; // Will's voice ID
      }
      
      // Get the actual ElevenLabs voice ID from the processed input
      const actualVoiceId = elevenlabs.getVoiceId(processedVoiceId);
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
    } catch (error: any) {
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
