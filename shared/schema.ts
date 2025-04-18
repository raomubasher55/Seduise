import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"),
  password: text("password").notNull(),
  isPremium: boolean("is_premium").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isPremium: true,
});

// Story schema
export const stories = pgTable("stories", {
  _id: serial("id").primaryKey(), 
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id),
  imageUrl: text("image_url"),
  settings: jsonb("settings").notNull(),
  likes: integer("likes").default(0),
  plays: integer("plays").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  isPublic: boolean("is_public").default(false),
  category: text("category").default("romance"),
});

export const insertStorySchema = createInsertSchema(stories).omit({
  _id: true,
  likes: true,
  plays: true,
  createdAt: true,
});

// Voice schema
export const voices = pgTable("voices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  style: text("style").notNull(),
  apiId: text("api_id").notNull(),
  isPremium: boolean("is_premium").default(false),
});

export const insertVoiceSchema = createInsertSchema(voices).omit({
  id: true,
});

// Settings schema (used for story generation)
export const storySettingsSchema = z.object({
  timePeriod: z.string(),
  location: z.string(),
  atmosphere: z.string(),
  protagonistGender: z.string(),
  partnerGender: z.string(),
  relationship: z.string(),
  writingTone: z.string(),
  narrationVoice: z.string(),
  length: z.number().min(1).max(5),
  // New fields from the tabbed UI
  settingDescription: z.string().optional(),
  protagonistDescription: z.string().optional(),
  loveInterestDescription: z.string().optional(),
  explicitLevel: z.number().min(0).max(100).optional(),
});

// Voice narration schema
export const voiceNarrationSchema = z.object({
  storyId: z.number(),
  voiceId: z.string(),
  audioUrl: z.string().optional(),
});

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").references(() => stories.id),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

export type InsertVoice = z.infer<typeof insertVoiceSchema>;
export type Voice = typeof voices.$inferSelect;

export type StorySettings = z.infer<typeof storySettingsSchema>;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
