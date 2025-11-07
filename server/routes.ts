import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { storySettingsSchema, insertStorySchema, insertCommentSchema } from "@shared/schema";
import { generateStory, continueStory, generateTitleSuggestions } from "./utils/openai";
import { minimax } from "./utils/minimax";
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
  // Debug endpoint to test audio generation and storage
  app.get("/api/speech/test", async (_req, res) => {
    try {
      console.log("Testing audio generation...");
      
      // Generate a simple test audio
      const sampleText = "This is a test audio file to verify voice generation.";
      const voiceId = process.env.MINIMAX_DEFAULT_VOICE_ID || "minimax_female_soft";
      
      // Generate speech
      const audioUrl = await minimax.textToSpeech({
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
    // if (user.subscription === 'free') {
    //   return res.status(403).json({
    //     message: "Audio generation is not available on the Free plan. Please upgrade your subscription.",
    //     code: "PREMIUM_REQUIRED"
    //   });
    // }

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

      console.log(`Processed text length: ${processedText.length} characters`);
      if (processedText.length > 4800) {
        console.log(
          `Warning: Text is very long (${processedText.length} chars), may be truncated by the TTS service`,
        );
      }

      if (!process.env.MINIMAX_API_KEY) {
        return res.status(401).json({
          message: "MiniMax API key is required for voice generation",
          error: "No API key configured",
          apiKeyIssue: true,
        });
      }

      let audioUrl: string;
      let isFallback = false;
      const targetVoiceId = voiceId || process.env.MINIMAX_DEFAULT_VOICE_ID || "minimax_female_soft";

      try {
        const generatedUrl = await minimax.textToSpeech({
          text: processedText,
          voiceId: targetVoiceId,
        });

        if (generatedUrl.startsWith("/audio/")) {
          const filePath = path.join(process.cwd(), "dist", "public", generatedUrl.replace(/^\//, ""));
          if (!fs.existsSync(filePath)) {
            throw new Error("Generated audio file not found");
          }
          const fileStats = fs.statSync(filePath);
          const fileSizeInKB = fileStats.size / 1024;
          isFallback = fileSizeInKB < 1;
        }

        audioUrl = generatedUrl;
      } catch (error: any) {
        console.error("MiniMax API error during generation:", error);
        return res.status(500).json({
          message: "Speech generation failed",
          error: error?.message || "Unknown error",
          fallback: true,
        });
      }

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
        provider: "minimax",
        message: isFallback
          ? "Generated a fallback audio file. The text may be too complex or long for the TTS service."
          : undefined,
      });
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

      // Process text (simplified for testing)
      const processedText = text
        .replace(/[\u2018\u2019]/g, "'")  // Replace smart quotes
        .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
        .replace(/\n{3,}/g, '\n\n')       // Normalize excessive line breaks
        .replace(/\s{3,}/g, ' ')          // Normalize excessive spaces
        .trim();

      const audioUrl = await minimax.textToSpeech({
        text: processedText,
        voiceId: voiceId,
      });

      let fileSizeInKB = 0;
      if (audioUrl.startsWith("/audio/")) {
        const filePath = path.join(process.cwd(), 'dist', 'public', audioUrl.replace(/^\//, ''));
        if (!fs.existsSync(filePath)) {
          return res.status(500).json({
            message: "Generated audio file not found",
            error: "File generation failed"
          });
        }
        const fileStats = fs.statSync(filePath);
        fileSizeInKB = fileStats.size / 1024;
      }

      return res.status(200).json({
        message: "Speech generated successfully",
        audioUrl,
        fileSize: fileSizeInKB ? fileSizeInKB.toFixed(2) + " KB" : undefined,
        success: true
      });
    } catch (error: any) {
      console.error('Speech test generation error:', error);
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
