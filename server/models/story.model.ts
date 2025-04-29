import { Schema, model } from "mongoose";

const storySchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  audioUrl: { type: String },
  userId: { type: String, required: true },
  settings: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isPublic: { type: Boolean, default: true },
  imageUrl: { type: String },
  likes: { type: Number, default: 0 },
  plays: { type: Number, default: 0 },
  category: { type: String, default: "romance" },
  creditsCost: { type: Number, default: 1 }  // Cost in credits to generate this story
}, { timestamps: true });

// Remove any existing indexes on the id field
storySchema.index({ id: 1 }, { unique: false });

export const Story = model("Story", storySchema);