import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Get the JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'story_app_super_secret_key_for_tokens_2025';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Made optional for Google auth
  name: { type: String, required: true },
  phone: { type: String, required: false }, // Added phone field
  role: { type: String, enum: ["admin", "user"], default: "user" },
  subscription: { 
    type: String, 
    enum: ["free", "standard", "premium"], 
    default: "free" 
  },
  isPremium: { type: Boolean, default: false }, // True for any paid plan
  credits: { type: Number, default: 10 }, // Default 10 credits for new users
  // Subscription usage tracking
  usageThisMonth: {
    storiesGenerated: { type: Number, default: 0 },
    chaptersGenerated: { type: Number, default: 0 },
    audioMinutesUsed: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },
  // For Stripe integration
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  stories: { type: [Schema.Types.ObjectId], ref: "Story", default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Google OAuth Fields
  googleId: { type: String, sparse: true, unique: true },
  profilePicture: { type: String },
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  badges: [{ type: String }] // Array of strings to store badge names/IDs
});

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre("save", async function (next: any) {
  // Only hash the password if it exists and was modified
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  // If user doesn't have a password (Google auth user), always fail local password comparison
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id }, JWT_SECRET, { expiresIn: "24h" });
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = model("User", userSchema);
