import { Request, Response } from "express";
import { storage } from "../storage";
import { getStory as getStoryService } from "../services/story.serverice";
import { getStoryAudio as getStoryAudioService } from "../services/story.serverice";
import { createStory as createStoryService } from "../services/story.serverice";
import { continueStoryService, deleteStory as deleteStoryService } from "../services/story.serverice";
import { storySettingsSchema } from "@shared/schema";
import { z } from "zod";
import { generateTitleSuggestions } from "server/utils/openai";





export const createStory = async (req: Request, res: Response) => {
  try {
    const settingsSchema = z.object({
      title: z.string().min(1, "Title is required"),
      settings: storySettingsSchema,
      maxTokens: z.number().optional(),
      isPublic: z.boolean().optional().default(false)
    });

    const { title, settings, maxTokens, isPublic } = settingsSchema.parse(req.body);
    const userId = req.session.userId;
    if (!userId) {
      throw new Error("User not found");
    }
    
    // Check if non-premium user is trying to make public story
    if (isPublic && req.session.role !== 'premium') {
      return res.status(403).json({
        message: "Only premium users can create public stories",
        code: "PREMIUM_REQUIRED",
        isPremiumRequired: true
      });
    }
    
    const story = await createStoryService(title, settings, maxTokens, userId, isPublic);
    res.status(201).json(story);
  } catch (error) {
    console.error("Error creating story:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }

    // Check for story limit error
    if (error instanceof Error && error.message.includes("Free users can only create 3 stories")) {
      return res.status(403).json({
        message: error.message,
        code: "STORY_LIMIT_REACHED",
        isPremiumRequired: true
      });
    }

    // Check for insufficient credits
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return res.status(402).json({
        message: "You don't have enough credits to generate a story. Please purchase more credits.",
        code: "INSUFFICIENT_CREDITS"
      });
    }

    res.status(500).json({ message: "Failed to create story" });
  }
};


export const getStory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = await getStoryService(id);
  res.status(200).json(story);
};

export const getStoryAudio = async (req: Request, res: Response) => {
  const { id } = req.params;
  const audio = await getStoryAudioService(id);
  res.status(200).json({ audioUrl: audio });
};

export const continueStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const story = await continueStoryService(id);
    res.status(200).json(story);
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
}