import { Schema, model } from "mongoose";

const chapterSchema = new Schema({
  number: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String },
  audioUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  wordCount: { type: Number },
  textCreditsCost: { type: Number, default: 1 },
  audioCreditsCost: { type: Number, default: 2 }
});

const storySchema = new Schema({
  title: { type: String, required: true },
  content: { type: String }, // Keep for backward compatibility
  audioUrl: { type: String },
  userId: { type: String, required: true },
  settings: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isPublic: { type: Boolean, default: true },
  imageUrl: { type: String },
  likes: { type: Number, default: 0 },
  plays: { type: Number, default: 0 },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  category: { type: String, default: "romance" },
  textCreditsCost: { type: Number, default: 1 },
  audioCreditsCost: { type: Number, default: 2 },
  chapters: { type: [chapterSchema], default: [] },
  currentChapter: { type: Number, default: 1 },
  totalChapters: { type: Number, default: 1 },
  isChapterBased: { type: Boolean, default: false },
  isPremiumContent: { type: Boolean, default: false },
  accessType: {
    type: String,
    enum: ['public', 'premium_early_access', 'premium_exclusive'],
    default: 'public'
  },
  premiumAccessDate: { type: Date },
  publicReleaseDate: { type: Date },
  // Track user interactions to prevent duplicate votes
  likedBy: [{ type: String }], // Array of user IDs who liked this story
  upvotedBy: [{ type: String }], // Array of user IDs who upvoted this story
  downvotedBy: [{ type: String }] // Array of user IDs who downvoted this story
}, { timestamps: true });

// Remove any existing indexes on the id field
storySchema.index({ id: 1 }, { unique: false });

export const Story = model("Story", storySchema);