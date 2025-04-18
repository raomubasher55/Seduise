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
  role: { type: String, enum: ["admin", "user"], default: "user" },
  subscription: { type: String, enum: ["free", "pro"], default: "free" },
  isPremium: { type: Boolean, default: false },
  credits: { type: Number, default: 10 }, // Default 10 credits for new users
  stories: { type: [Schema.Types.ObjectId], ref: "Story", default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Google OAuth Fields
  googleId: { type: String, sparse: true, unique: true },
  profilePicture: { type: String },
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
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
