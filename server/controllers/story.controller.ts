import { Request, Response } from "express";
import { storage } from "../storage";
import { getStory as getStoryService } from "../services/story.serverice";
import { getStoryAudio as getStoryAudioService } from "../services/story.serverice";
import { createStory as createStoryService } from "../services/story.serverice";
import { continueStoryService, deleteStory as deleteStoryService } from "../services/story.serverice";
import { storySettingsSchema } from "@shared/schema";
import { z } from "zod";
import { generateTitleSuggestions } from "server/utils/openai";
import path from "path";
import fs from "fs";
import { Story } from "../models/story.model";
import { User } from "../models/user.model";
import { 
  canPerformAction, 
  deductCredits, 
  trackStoryGeneration,
  trackChapterGeneration, 
  trackAudioGeneration 
} from "../services/subscription.service";





export const createStory = async (req: Request, res: Response) => {
  try {
    const settingsSchema = z.object({
      title: z.string().min(1, "Title is required"),
      settings: storySettingsSchema,
      maxTokens: z.number().optional(),
      isPublic: z.boolean().optional().default(false),
      category: z.string().optional().default("romance")
    });

    const { title, settings, maxTokens, isPublic, category } = settingsSchema.parse(req.body);
    const userId = req.session.userId;
    if (!userId) {
      throw new Error("User not found");
    }
    
    // Get user to check premium status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if non-premium user is trying to make public story
    // if (isPublic && !user.isPremium) {
    //   return res.status(403).json({
    //     message: "Only premium users can create public stories",
    //     code: "PREMIUM_REQUIRED",
    //     isPremiumRequired: true
    //   });
    // }
    
    // Check subscription limits and credit balance
    // Get the story length from settings to calculate the correct credit cost
    const storyLength = settings.length;
    const actionCheck = await canPerformAction(userId, 'generateStory', { storyLength });
    
    if (!actionCheck.canProceed) {
      return res.status(403).json({
        message: actionCheck.message || "You've reached your story generation limit",
        code: actionCheck.subscriptionLimitReached ? "SUBSCRIPTION_LIMIT_REACHED" : "INSUFFICIENT_CREDITS",
        requiredCredits: actionCheck.requiredCredits,
        currentCredits: actionCheck.currentCredits,
        isPremiumRequired: actionCheck.subscriptionLimitReached
      });
    }
    
    // If subscription limit reached but has credits, deduct them
    if (actionCheck.subscriptionLimitReached && actionCheck.requiredCredits) {
      const deducted = await deductCredits(userId, actionCheck.requiredCredits);
      if (!deducted) {
        return res.status(402).json({
          message: "Failed to deduct credits for story generation",
          code: "PAYMENT_REQUIRED"
        });
      }
    }
    
    console.log(`Attempting to generate story "${title}" for user ${userId}`);
    
    try {
      // Generate the story with detailed error handling
      const story = await createStoryService(title, settings, maxTokens, userId, isPublic, category);
      
      // Track story generation for subscription limits
      await trackStoryGeneration(userId);
      
      res.status(201).json(story);
    } catch (storyGenError) {
      console.error("Error in story generation service:", storyGenError);
      // Refund credits if story generation fails
      if (actionCheck.subscriptionLimitReached && actionCheck.requiredCredits) {
        await User.findByIdAndUpdate(userId, { $inc: { credits: actionCheck.requiredCredits } });
        console.log(`Refunded ${actionCheck.requiredCredits} credits to user ${userId} due to story generation failure`);
      }
      throw storyGenError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error("Error creating story:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors,
        code: "VALIDATION_ERROR"
      });
    }

    // Check for credit insufficient error
    if (error instanceof Error && error.message.includes("Insufficient credits")) {
      return res.status(402).json({
        message: error.message,
        code: "INSUFFICIENT_CREDITS",
        isPremiumRequired: false
      });
    }
    
    // Check for old story limit error (fallback for backward compatibility)
    if (error instanceof Error && error.message.includes("Free users can only create 3 stories")) {
      return res.status(403).json({
        message: "You don't have enough credits to generate this story. Please purchase additional credits or upgrade to premium.",
        code: "INSUFFICIENT_CREDITS",
        isPremiumRequired: false
      });
    }

    // Check for insufficient credits
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return res.status(402).json({
        message: "You don't have enough credits to generate a story. Please purchase more credits.",
        code: "INSUFFICIENT_CREDITS"
      });
    }
    
    // Check for API key related errors
    if (error instanceof Error && 
        (error.message.includes("API key") || 
         error.message.includes("api key") ||
         error.message.includes("check your API keys"))) {
      return res.status(503).json({ 
        message: "External content generation service unavailable. Please try again later.",
        code: "API_SERVICE_ERROR"
      });
    }

    // Generic error with additional context for debugging
    res.status(500).json({ 
      message: "Failed to create story", 
      details: error instanceof Error ? error.message : "Unknown error",
      code: "STORY_GENERATION_FAILED"
    });
  }
};


export const getStory = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const story = await getStoryService(id);
    
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Fix for existing stories with JSON formatting in content
    if (story.content && typeof story.content === 'string') {
      // Check if the content is a JSON string
      if (story.content.trim().startsWith('{') && story.content.includes('"content"')) {
        try {
          const contentObj = JSON.parse(story.content);
          if (contentObj.content) {
            // Update the story content with the extracted value
            story.content = contentObj.content;
            console.log(`Cleaned JSON formatted content for story ${id}`);
            
            // Save the updated content back to the database
            await Story.findByIdAndUpdate(id, { content: story.content });
          }
        } catch (e) {
          // If parsing fails, don't modify the content
          console.log(`Failed to parse JSON content for story ${id}`, e);
        }
      }
    }
    
    res.status(200).json(story);
  } catch (error) {
    console.error("Error getting story:", error);
    res.status(500).json({ message: "Failed to get story" });
  }
};

export const getStoryAudio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    
    if (!story) {
      return res.status(404).json({ 
        message: "Story not found", 
        audioUrl: null 
      });
    }
    
    if (!story.audioUrl) {
      return res.status(200).json({ 
        message: "No audio available for this story. Generate it first.", 
        audioUrl: null 
      });
    }
    
    // Verify the audio file exists
    const filePath = path.join(process.cwd(), 'dist', 'public', story.audioUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      console.error(`Audio file not found at path: ${filePath}`);
      return res.status(200).json({
        message: "Audio file not found. Try generating it again.",
        audioUrl: null
      });
    }
    
    // Return the audio URL
    res.status(200).json({ 
      audioUrl: story.audioUrl,
      message: "Audio URL retrieved successfully"
    });
  } catch (error) {
    console.error("Error retrieving story audio:", error);
    res.status(500).json({ 
      message: "Failed to retrieve audio URL", 
      audioUrl: null 
    });
  }
};

export const continueStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // First get the story to check its settings
    const existingStory = await Story.findById(id);
    if (!existingStory) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Extract length from story settings if available
    const storyLength = existingStory.settings?.length || 3; // Default to medium if not specified
    
    // Check subscription limits and credit balance for chapter generation
    const actionCheck = await canPerformAction(userId, 'generateChapter', { storyLength });
    
    if (!actionCheck.canProceed) {
      return res.status(403).json({
        message: actionCheck.message || "You've reached your chapter generation limit",
        code: actionCheck.subscriptionLimitReached ? "SUBSCRIPTION_LIMIT_REACHED" : "INSUFFICIENT_CREDITS",
        requiredCredits: actionCheck.requiredCredits,
        currentCredits: actionCheck.currentCredits,
        isPremiumRequired: actionCheck.subscriptionLimitReached
      });
    }
    
    // If subscription limit reached but has credits, deduct them
    if (actionCheck.subscriptionLimitReached && actionCheck.requiredCredits) {
      const deducted = await deductCredits(userId, actionCheck.requiredCredits);
      if (!deducted) {
        return res.status(402).json({
          message: "Failed to deduct credits for chapter generation",
          code: "PAYMENT_REQUIRED"
        });
      }
    }
    
    // Continue the story
    const continuedStory = await continueStoryService(id);
    
    // Track chapter generation for subscription limits
    await trackChapterGeneration(userId);
    
    res.status(200).json(continuedStory);
  } catch (error) {
    console.error("Error continuing story:", error);
    
    // Check for insufficient credits
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return res.status(402).json({
        message: "You don't have enough credits to continue this story. Please purchase more credits.",
        code: "INSUFFICIENT_CREDITS"
      });
    }
    
    if (error instanceof Error && error.message === "Story not found") {
      return res.status(404).json({ message: "Story not found" });
    }
    
    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(500).json({ message: "Failed to continue story" });
  }
};


export const updateStory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const story = await storage.updateStoryContent(id, content);
  res.status(200).json(story);
};


export const deleteStory = async (req: Request, res: Response) => {
  const { id } = req.params;
  // await storage.deleteStory(parseInt(id));
  const userId = req.session.userId;
  const story = deleteStoryService(id, userId);
  res.status(200).json({ message: "Story deleted successfully", story });
};


export const titleSuggestions = async (req: Request, res: Response) => {
  try {
    const { content } = z.object({ content: z.string() }).parse(req.body);
    const titles = await generateTitleSuggestions(content);
    res.json(titles);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate title suggestions" });
  }
};

// Get all chapters for a story
export const getStoryChapters = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Return chapters if story is chapter-based, otherwise convert legacy content
    if (story.isChapterBased && story.chapters.length > 0) {
      res.status(200).json({ chapters: story.chapters });
    } else if (story.content) {
      // Convert legacy story to chapter format
      const chapter = {
        number: 1,
        title: "Chapter 1",
        content: story.content,
        audioUrl: story.audioUrl,
        createdAt: story.createdAt,
        wordCount: story.content.split(' ').length,
        creditsCost: story.creditsCost
      };
      res.status(200).json({ chapters: [chapter] });
    } else {
      res.status(200).json({ chapters: [] });
    }
  } catch (error) {
    console.error("Error getting story chapters:", error);
    res.status(500).json({ message: "Failed to get story chapters" });
  }
};

// Get specific chapter
export const getStoryChapter = async (req: Request, res: Response) => {
  try {
    const { id, chapterNumber } = req.params;
    const story = await Story.findById(id);
    
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    const chapterNum = parseInt(chapterNumber);
    
    if (story.isChapterBased && story.chapters.length > 0) {
      const chapter = story.chapters.find(ch => ch.number === chapterNum);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.status(200).json({ chapter });
    } else if (chapterNum === 1 && story.content) {
      // Return legacy content as chapter 1
      const chapter = {
        number: 1,
        title: "Chapter 1",
        content: story.content,
        audioUrl: story.audioUrl,
        createdAt: story.createdAt,
        wordCount: story.content.split(' ').length,
        creditsCost: story.creditsCost
      };
      res.status(200).json({ chapter });
    } else {
      res.status(404).json({ message: "Chapter not found" });
    }
  } catch (error) {
    console.error("Error getting story chapter:", error);
    res.status(500).json({ message: "Failed to get story chapter" });
  }
};