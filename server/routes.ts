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
      
      // Convert the voice name to a voice ID if needed
      const actualVoiceId = elevenlabs.getVoiceId(voiceId);
      console.log(`Using voice ID: ${actualVoiceId}`);

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
      if (processedText.length > 2000) {
        console.log(`Warning: Text is very long (${processedText.length} chars), may be truncated`);
      }

      try {
        // Generate speech using the Murf.ai API
        const audioUrl = await elevenlabs.textToSpeech({
          text: processedText,
          voiceId: actualVoiceId,
          style: "Neutral" // You can make this configurable if needed
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
          // Update the story audio in the MongoDB database
          const story = await Story.findById(storyId);
          if (story) {
            story.audioUrl = audioUrl;
            await story.save();
            console.log(`Updated story ${storyId} with audio URL ${audioUrl} in MongoDB`);
          }
          
          // Also update in storage (redundant but ensures compatibility)
          try {
            await storage.saveStoryAudio(storyId, audioUrl);
            console.log(`Saved audio URL to story ${storyId} in storage: ${audioUrl}`);
          } catch (storageError) {
            console.error(`Failed to save audio URL to storage: ${storageError}`);
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
        console.error("Speech API error:", error);
        
        // Check if it's an API key issue
        if (error instanceof Error && 
            (error.message.includes('API key') || 
             error.message.includes('authentication') || 
             error.message.includes('Unauthorized'))) {
          return res.status(401).json({ 
            message: "Speech generation failed due to API authentication issues",
            error: "The API key is invalid or has expired. Please update it with a valid key.",
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
