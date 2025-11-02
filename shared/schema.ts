import { z } from "zod";

// Story Settings Schema
export const storySettingsSchema = z.object({
  timePeriod: z.string(),
  location: z.string(),
  atmosphere: z.string(),
  protagonistGender: z.string(),
  partnerGender: z.string(),
  relationship: z.string(),
  writingTone: z.string(),
  length: z.number(),
  settingDescription: z.string().optional(),
  protagonistDescription: z.string().optional(),
  loveInterestDescription: z.string().optional(),
  explicitLevel: z.number().optional(),
  narrationVoice: z.string().optional(),
  narrationVoiceId: z.string().optional()
});

export type StorySettings = z.infer<typeof storySettingsSchema>;

// User Schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  role: z.enum(["admin", "user"]),
  isPremium: z.boolean().default(false),
  textCredits: z.number().default(2),
  audioCredits: z.number().default(1),
  stories: z.array(z.string()).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  subscription: z.enum(["free", "essentiel", "seduction", "intimacy"]).default("free"),
  authProvider: z.enum(["local", "google"]).default("local")
});

export type User = z.infer<typeof userSchema>;
export const insertUserSchema = userSchema.omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// Choice Schema
export const choiceSchema = z.object({
  text: z.string(),
  outcome: z.string().optional(), // Outcome can be a prompt for the next chapter or a reference
});

export type Choice = z.infer<typeof choiceSchema>;

// Chapter Schema
export const chapterSchema = z.object({
  number: z.number(),
  title: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  audioUrl: z.string().optional(),
  createdAt: z.date().optional(),
  wordCount: z.number().optional(),
  textCreditsCost: z.number().default(1),
  audioCreditsCost: z.number().default(2),
  choices: z.array(choiceSchema).optional() // Add choices to chapter schema
});

export type Chapter = z.infer<typeof chapterSchema>;

// Story Schema
export const storySchema = z.object({
  _id: z.string(),
  title: z.string(),
  content: z.string().optional(), // Keep for backward compatibility
  audioUrl: z.string().optional(),
  userId: z.string(),
  settings: z.object(storySettingsSchema.shape).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isPublic: z.boolean().default(true),
  imageUrl: z.string().optional(),
  likes: z.number().default(0),
  plays: z.number().default(0),
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  category: z.string().default("romance"),
  textCreditsCost: z.number().default(1),
  audioCreditsCost: z.number().default(2),
  chapters: z.array(chapterSchema).default([]),
  currentChapter: z.number().default(1),
  totalChapters: z.number().default(1),
  isChapterBased: z.boolean().default(false),
  isPremiumContent: z.boolean().default(false),
  accessType: z.enum(['public', 'private', 'premium_early_access', 'premium_exclusive']).default('public'),
  premiumAccessDate: z.date().optional(),
  publicReleaseDate: z.date().optional(),
  // User interaction state (populated at runtime)
  hasLiked: z.boolean().optional(),
  hasUpvoted: z.boolean().optional(),
  hasDownvoted: z.boolean().optional(),
  // Additional properties for community features
  userName: z.string().optional(),
  authorBadges: z.array(z.any()).optional()
});

export type Story = z.infer<typeof storySchema>;
export const insertStorySchema = storySchema.omit({ _id: true });
export type InsertStory = z.infer<typeof insertStorySchema>;

// Comment Schema
export const commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  userId: z.string(),
  storyId: z.string(),
  createdAt: z.date().optional(),
  userName: z.string().optional()
});

export type Comment = z.infer<typeof commentSchema>;
export const insertCommentSchema = commentSchema.omit({ id: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Voice Schema
export const voiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  gender: z.string().optional(),
  accent: z.string().optional(),
  previewUrl: z.string().optional(),
  category: z.string().default("standard")
});

export type Voice = z.infer<typeof voiceSchema>;
export const insertVoiceSchema = voiceSchema.omit({ id: true });
export type InsertVoice = z.infer<typeof insertVoiceSchema>;

// Export a dummy collections object for compatibility
export const users = {};
export const stories = {};
export const comments = {};
export const voices = {};
