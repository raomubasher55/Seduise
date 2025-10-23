import { Request, Response } from "express";
import { storage } from "../storage";
import { getStory as getStoryService } from "../services/story.service";
import { getStoryAudio as getStoryAudioService } from "../services/story.service";
import { createStory as createStoryService } from "../services/story.service";
import { continueStoryService, deleteStory as deleteStoryService, setStoryVisibility, getVoiceOptionsService, getPublicStoriesService, getStoriesByCategoryService, getPremiumStoriesService } from "../services/story.service";
import { storySettingsSchema } from "@shared/schema";
import { z } from "zod";
import { generateTitleSuggestions } from "server/utils/openai";
import path from "path";
import fs from "fs";
import { Story } from "../models/story.model";
import { User } from "../models/user.model";
import { trackStoryInteraction } from "../middlewares/engagement.middleware";

// Function to track story generation for subscription limits
const trackStoryGeneration = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for tracking story generation');
      return;
    }

    // Initialize usage tracking if it doesn't exist
    if (!user.usageThisMonth) {
      user.usageThisMonth = {
        storiesGenerated: 0,
        chaptersGenerated: 0,
        audioMinutesUsed: 0,
        lastResetDate: new Date()
      };
    }

    // Check if we need to reset monthly usage (if it's a new month)
    const now = new Date();
    const lastReset = new Date(user.usageThisMonth.lastResetDate);
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      user.usageThisMonth = {
        storiesGenerated: 1,
        chaptersGenerated: 0,
        audioMinutesUsed: 0,
        lastResetDate: now
      };
    } else {
      // Increment story count
      user.usageThisMonth.storiesGenerated += 1;
    }

    await user.save();
    console.log(`Tracked story generation for user ${userId}. Total this month: ${user.usageThisMonth.storiesGenerated}`);
  } catch (error) {
    console.error('Error tracking story generation:', error);
  }
};

export const createStory = async (req: Request, res: Response) => {
  try {
    const settingsSchema = z.object({
      title: z.string().min(1, "Title is required"),
      settings: storySettingsSchema,
      maxTokens: z.number().optional(),
      isPublic: z.boolean().optional().default(false),
      accessType: z.enum(['public', 'private', 'premium_exclusive']).optional().default('public'),
      category: z.string().optional().default("romance")
    });

    const { title, settings, maxTokens, isPublic, accessType, category } = settingsSchema.parse(req.body);
    const userId = req.session.userId;
    if (!userId) {
      throw new Error("User not found");
    }
    
    // Get user to check premium status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check premium story creation permissions based on subscription tier
    if (accessType === 'premium_exclusive') {
      // Only seduction and intimacy subscribers can create premium_exclusive stories
      if (user.subscription !== 'seduction' && user.subscription !== 'intimacy') {
        return res.status(403).json({
          message: "Exclusive premium story creation is only available for Seduction and Intimacy subscribers",
          code: "PREMIUM_EXCLUSIVE_REQUIRED",
          isPremiumRequired: true,
          requiredPlans: ['seduction', 'intimacy'],
          currentPlan: user.subscription,
          upgradeMessage: "Upgrade to Seduction or Intimacy plan to create exclusive premium stories"
        });
      }
    }
    
    if (accessType === 'premium_early_access') {
      // All premium subscribers (essentiel, seduction, intimacy) can create early access stories
      const allowedPlans = ['essentiel', 'seduction', 'intimacy'];
      if (!allowedPlans.includes(user.subscription)) {
        return res.status(403).json({
          message: "Premium story creation requires a premium subscription",
          code: "PREMIUM_REQUIRED", 
          isPremiumRequired: true,
          requiredPlans: allowedPlans,
          currentPlan: user.subscription,
          upgradeMessage: "Upgrade to any premium plan to create premium stories"
        });
      }
    }
    
    // Check subscription limits and text credit balance
    // Get the story length from settings to calculate the correct text credit cost
    const storyLength = settings.length;
    
    // Calculate text credit cost based on story length
    let textCreditCost = 1; // Default cost
    if (storyLength === 2) textCreditCost = 1; // Short story
    else if (storyLength === 3) textCreditCost = 2; // Medium story  
    else if (storyLength === 4) textCreditCost = 4; // Long story
    
    // Check if user has enough text credits
    if (user.textCredits < textCreditCost) {
      return res.status(402).json({
        message: `Insufficient text credits. You need ${textCreditCost} text credits but only have ${user.textCredits}.`,
        code: "INSUFFICIENT_TEXT_CREDITS",
        required: textCreditCost,
        available: user.textCredits
      });
    }
    
    
    
    try {
      // Generate the story with detailed error handling, passing text credit cost
      const story = await createStoryService(title, settings, maxTokens, userId, isPublic, category, accessType, textCreditCost);
      
      // Track story generation for subscription limits
      await trackStoryGeneration(userId);
      
      res.status(201).json(story);
    } catch (storyGenError) {
      console.error("Error in story generation service:", storyGenError);
    
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

    // Check for text credit insufficient error
    if (error instanceof Error && error.message.includes("Insufficient text credits")) {
      return res.status(402).json({
        message: error.message,
        code: "INSUFFICIENT_TEXT_CREDITS",
        isPremiumRequired: false
      });
    }
    
    // Check for audio credit insufficient error
    if (error instanceof Error && error.message.includes("Insufficient audio credits")) {
      return res.status(402).json({
        message: error.message,
        code: "INSUFFICIENT_AUDIO_CREDITS",
        isPremiumRequired: false
      });
    }

    // Legacy credit error handling
    if (error instanceof Error && (error.message === "INSUFFICIENT_CREDITS" || error.message.includes("Insufficient credits"))) {
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
    
    // Add user interaction states if user is authenticated
    const userId = req.session?.userId;
    let storyWithInteractions = story.toObject();
    
    if (userId) {
      // Initialize interaction arrays if they don't exist
      const likedBy = story.likedBy || [];
      const upvotedBy = story.upvotedBy || [];
      const downvotedBy = story.downvotedBy || [];
      
      // Add user interaction state
      storyWithInteractions = {
        ...storyWithInteractions,
        hasLiked: likedBy.includes(userId),
        hasUpvoted: upvotedBy.includes(userId),
        hasDownvoted: downvotedBy.includes(userId)
      };
    } else {
      // Add default interaction states for non-authenticated users
      storyWithInteractions = {
        ...storyWithInteractions,
        hasLiked: false,
        hasUpvoted: false,
        hasDownvoted: false
      };
    }
    
    // Populate author information if available
    if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
      try {
        const author = await User.findById(story.userId).select("name badges");
        if (author) {
          storyWithInteractions.userName = author.name;
          storyWithInteractions.authorBadges = author.badges || [];
        }
      } catch (err) {
        console.error("Error fetching author info:", err);
      }
    }
    
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).json(storyWithInteractions);
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
    const { selectedChoice, choice, conclude } = req.body; // Get selectedChoice, choice, and conclude flag from request body
    const finalChoice = selectedChoice || choice;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
   
    
    // Continue the story, passing the selectedChoice
    const continuedStory = await continueStoryService(id, finalChoice, conclude);
    
    
    res.status(200).json(continuedStory);
  } catch (error) {
    console.error("Error continuing story:", error);
    
    // Check for insufficient text credits
    if (error instanceof Error && (error.message === "INSUFFICIENT_TEXT_CREDITS" || error.message.includes("Insufficient text credits"))) {
      return res.status(402).json({
        message: "You don't have enough text credits to continue this story. Please purchase more text credits.",
        code: "INSUFFICIENT_TEXT_CREDITS"
      });
    }
    
    if (error instanceof Error && error.message === "Story not found") {
      return res.status(404).json({ message: "Story not found" });
    }
    
    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(500).json({ message: "Failed to continue story", error: error instanceof Error ? error.message : error });
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
      res.setHeader('Cache-Control', 'no-cache');
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
      res.setHeader('Cache-Control', 'no-cache');
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

export const getChapterChoices = async (req: Request, res: Response) => {
  try {
    const { id, chapterNumber } = req.params;
    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    const chapterNum = parseInt(chapterNumber);
    const chapter = story.chapters.find(ch => ch.number === chapterNum);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    res.status(200).json({ choices: chapter.choices || [] });
  } catch (error) {
    console.error("Error getting chapter choices:", error);
    res.status(500).json({ message: "Failed to get chapter choices" });
  }
};

export const unlockChapter = async (req: Request, res: Response) => {
  try {
    const { id, chapterNumber } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    const chapterNum = parseInt(chapterNumber);
    const chapter = story.chapters.find(ch => ch.number === chapterNum);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // Check if the user has enough text credits (chapters are text content)
    const textCreditCost = chapter.textCreditsCost || chapter.creditsCost || 1; // Fallback for legacy data
    if (user.textCredits < textCreditCost) {
      return res.status(402).json({ 
        message: `Insufficient text credits to unlock this chapter. Required: ${textCreditCost}, Available: ${user.textCredits}`,
        code: "INSUFFICIENT_TEXT_CREDITS",
        required: textCreditCost,
        available: user.textCredits
      });
    }

    // Deduct text credits and add the chapter to the user's unlocked chapters
    user.textCredits -= textCreditCost;
    user.unlockedChapters.push({ storyId: story._id, chapterNumber: chapterNum });
    await user.save();

    res.status(200).json({ message: "Chapter unlocked successfully" });
  } catch (error) {
    console.error("Error unlocking chapter:", error);
    res.status(500).json({ message: "Failed to unlock chapter" });
  }
};

export const likeStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Initialize arrays if they don't exist
    if (!story.likedBy) story.likedBy = [];

    // Check if user has already liked this story
    const hasLiked = story.likedBy.includes(userId);

    if (hasLiked) {
      // Remove like (toggle off)
      story.likedBy = story.likedBy.filter(uid => uid !== userId);
      story.likes = Math.max(0, (story.likes || 0) - 1);
    } else {
      // Add like (toggle on)
      story.likedBy.push(userId);
      story.likes = (story.likes || 0) + 1;
      
      // Track engagement for badge system only when adding like
      await trackStoryInteraction(id, 'like');
    }

    await story.save();

    res.status(200).json({ 
      message: hasLiked ? "Story unliked successfully" : "Story liked successfully", 
      likes: story.likes,
      hasLiked: !hasLiked
    });
  } catch (error) {
    console.error("Error liking story:", error);
    res.status(500).json({ message: "Failed to like story" });
  }
};

export const upvoteStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Initialize arrays if they don't exist
    if (!story.upvotedBy) story.upvotedBy = [];
    if (!story.downvotedBy) story.downvotedBy = [];

    // Check if user has already upvoted or downvoted this story
    const hasUpvoted = story.upvotedBy.includes(userId);
    const hasDownvoted = story.downvotedBy.includes(userId);

    if (hasUpvoted) {
      // Remove upvote (toggle off)
      story.upvotedBy = story.upvotedBy.filter(uid => uid !== userId);
      story.upvotes = Math.max(0, (story.upvotes || 0) - 1);
    } else {
      // Add upvote (toggle on)
      story.upvotedBy.push(userId);
      story.upvotes = (story.upvotes || 0) + 1;
      
      // If user had downvoted, remove the downvote
      if (hasDownvoted) {
        story.downvotedBy = story.downvotedBy.filter(uid => uid !== userId);
        story.downvotes = Math.max(0, (story.downvotes || 0) - 1);
      }
      
      // Track engagement for badge system only when adding upvote
      await trackStoryInteraction(id, 'upvote');
    }

    await story.save();

    res.status(200).json({ 
      message: hasUpvoted ? "Story upvote removed successfully" : "Story upvoted successfully", 
      upvotes: story.upvotes,
      downvotes: story.downvotes,
      hasUpvoted: !hasUpvoted,
      hasDownvoted: hasDownvoted && !hasUpvoted ? false : story.downvotedBy.includes(userId)
    });
  } catch (error) {
    console.error("Error upvoting story:", error);
    res.status(500).json({ message: "Failed to upvote story" });
  }
};

export const downvoteStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Initialize arrays if they don't exist
    if (!story.upvotedBy) story.upvotedBy = [];
    if (!story.downvotedBy) story.downvotedBy = [];

    // Check if user has already upvoted or downvoted this story
    const hasUpvoted = story.upvotedBy.includes(userId);
    const hasDownvoted = story.downvotedBy.includes(userId);

    if (hasDownvoted) {
      // Remove downvote (toggle off)
      story.downvotedBy = story.downvotedBy.filter(uid => uid !== userId);
      story.downvotes = Math.max(0, (story.downvotes || 0) - 1);
    } else {
      // Add downvote (toggle on)
      story.downvotedBy.push(userId);
      story.downvotes = (story.downvotes || 0) + 1;
      
      // If user had upvoted, remove the upvote
      if (hasUpvoted) {
        story.upvotedBy = story.upvotedBy.filter(uid => uid !== userId);
        story.upvotes = Math.max(0, (story.upvotes || 0) - 1);
      }
      
      // Track engagement for badge system only when adding downvote
      await trackStoryInteraction(id, 'downvote');
    }

    await story.save();

    res.status(200).json({ 
      message: hasDownvoted ? "Story downvote removed successfully" : "Story downvoted successfully", 
      upvotes: story.upvotes,
      downvotes: story.downvotes,
      hasUpvoted: hasUpvoted && !hasDownvoted ? false : story.upvotedBy.includes(userId),
      hasDownvoted: !hasDownvoted
    });
  } catch (error) {
    console.error("Error downvoting story:", error);
    res.status(500).json({ message: "Failed to downvote story" });
  }
};

export const updateVisibility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body as { isPublic: boolean };
    const userId = req.session?.userId;

    const updated = await setStoryVisibility(userId, id, isPublic);
    return res.json(updated);
  } catch (error: any) {
    console.error('Error updating story visibility:', error);
    const status = error?.status || 500;
    const body: any = { message: error?.message || 'Failed to update story visibility' };
    if (error?.code) {
      body.code = error.code;
      if (error.code === 'PREMIUM_REQUIRED') body.isPremiumRequired = true;
    }
    return res.status(status).json(body);
  }
};

export const voiceOptions = async (_req: Request, res: Response) => {
  try {
    const voices = await getVoiceOptionsService();
    res.json(voices);
  } catch (error) {
    console.error('Error fetching voice options:', error);
    res.status(500).json({ message: 'Failed to fetch voice options' });
  }
};

export const getPublicStoriesList = async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    const stories = await getPublicStoriesService(userId);
    res.json(stories);
  } catch (error) {
    console.error('Error fetching public stories:', error);
    res.status(500).json({ message: 'Failed to fetch public stories' });
  }
};

export const getStoriesByCategoryController = async (req: Request, res: Response) => {
  try {
    const { category } = req.params as { category: string };
    const stories = await getStoriesByCategoryService(category);
    res.json(stories);
  } catch (error: any) {
    const status = error?.status || 500;
    const msg = error?.message || 'Failed to fetch stories by category';
    console.error('Error fetching stories for category:', error);
    res.status(status).json({ message: msg });
  }
};

export const getPremiumStoriesController = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const stories = await getPremiumStoriesService(userId);
    res.json(stories);
  } catch (error: any) {
    const status = error?.status || 500;
    const body: any = { message: error?.message || 'Failed to fetch premium stories' };
    if (error?.code === 'PREMIUM_REQUIRED') {
      body.currentSubscription = error.currentSubscription;
      body.requiredSubscriptions = error.requiredSubscriptions;
    }
    console.error('Error fetching premium stories:', error);
    res.status(status).json(body);
  }
};
