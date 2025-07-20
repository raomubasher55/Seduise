var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/constants/plans.ts
var plans_exports = {};
__export(plans_exports, {
  CREDIT_COSTS: () => CREDIT_COSTS,
  CREDIT_PACKAGES: () => CREDIT_PACKAGES,
  STORY_LENGTHS: () => STORY_LENGTHS,
  SUBSCRIPTION_PLANS: () => SUBSCRIPTION_PLANS,
  getActionCreditCost: () => getActionCreditCost,
  getUserLimits: () => getUserLimits,
  hasReachedLimit: () => hasReachedLimit
});
function getUserLimits(subscriptionType) {
  return SUBSCRIPTION_PLANS[subscriptionType]?.monthlyLimits || SUBSCRIPTION_PLANS.discovery.monthlyLimits;
}
function hasReachedLimit(usageThisMonth, subscriptionType, checkType) {
  const limits = getUserLimits(subscriptionType);
  switch (checkType) {
    case "stories":
      return usageThisMonth.storiesGenerated >= limits.stories;
    case "audioCredits":
      return usageThisMonth.audioCreditsUsed >= limits.audioCredits;
    default:
      return false;
  }
}
function getActionCreditCost(action, params) {
  if (action === "generateStory") {
    if (params?.storyLength) {
      if (params.storyLength === STORY_LENGTHS.short.id) {
        return CREDIT_COSTS.generateStory.short;
      } else if (params.storyLength === STORY_LENGTHS.medium.id) {
        return CREDIT_COSTS.generateStory.medium;
      } else if (params.storyLength === STORY_LENGTHS.long.id) {
        return CREDIT_COSTS.generateStory.long;
      }
    }
    return CREDIT_COSTS.generateStory.medium;
  } else if (action === "generateAudio" && params?.minutes) {
    return Math.ceil(params.minutes * CREDIT_COSTS.audioMinute);
  }
  return 0;
}
var SUBSCRIPTION_PLANS, CREDIT_PACKAGES, CREDIT_COSTS, STORY_LENGTHS;
var init_plans = __esm({
  "server/constants/plans.ts"() {
    "use strict";
    SUBSCRIPTION_PLANS = {
      discovery: {
        name: "Discovery",
        description: "Explore Without Commitment",
        price: 0,
        // Free tier
        monthlyLimits: {
          stories: 2,
          audioCredits: 1
        },
        features: [
          "Create up to 2 personalized stories (text)",
          "1 free audio (\u2248 1 to 2 min)",
          "Standard voice",
          "No access to the premium library"
        ],
        supportsCredits: true
      },
      essentiel: {
        name: "Essentiel",
        description: "Pleasure at Your Own Pace",
        price: 599,
        // €5.99/month (in cents)
        monthlyLimits: {
          stories: 5,
          audioCredits: 6
        },
        features: [
          "Create up to 5 personalized stories (text)",
          "6 audio credits (\u2248 15 minutes total)",
          "Natural-sounding voices",
          "No access to the premium library"
        ],
        supportsCredits: true
      },
      seduction: {
        name: "Seduction",
        description: "Your Pleasure Rendezvous",
        price: 1199,
        // €11.99/month (in cents)
        monthlyLimits: {
          stories: 12,
          audioCredits: 12
        },
        features: [
          "Create up to 12 personalized stories (text)",
          "12 audio credits (\u2248 30 minutes)",
          "Expressive & realistic voices",
          "Partial access to the premium audio library",
          "New stories added monthly"
        ],
        supportsCredits: true
      },
      intimacy: {
        name: "Intimacy",
        description: "The Ultimate Experience Without Limits",
        price: 2499,
        // €24.99/month (in cents)
        monthlyLimits: {
          stories: 25,
          audioCredits: 24
        },
        features: [
          "Create up to 25 personalized stories (text)",
          "24 audio credits (\u2248 60 minutes)",
          "Expressive & immersive voices",
          "Full access to the premium audio library",
          "Tailored suggestions and exclusive stories"
        ],
        supportsCredits: true
      }
    };
    CREDIT_PACKAGES = {
      starter: {
        id: "starter",
        name: "Starter Pack",
        credits: 20,
        price: 499,
        // €4.99 (in cents)
        description: "Perfect for casual story creation"
      },
      popular: {
        id: "popular",
        name: "Popular Pack",
        credits: 50,
        price: 999,
        // €9.99 (in cents)
        popular: true,
        description: "Most popular choice for regular users"
      },
      premium: {
        id: "premium",
        name: "Premium Pack",
        credits: 100,
        price: 2199,
        // €21.99 (in cents)
        bestValue: true,
        description: "Best value for avid storytellers"
      }
    };
    CREDIT_COSTS = {
      generateStory: {
        short: 1,
        // Short story (2-3 minutes audio)
        medium: 2,
        // Medium story (4-5 minutes audio)
        long: 4
        // Long story (8-9 minutes audio)
      },
      audioMinute: 0.3
      // Cost per minute of audio (€3 for 10 minutes → 0.3 per minute)
    };
    STORY_LENGTHS = {
      short: {
        id: 2,
        name: "Short",
        audioDurationMinutes: 3,
        // 2-3 minutes
        creditCost: 1
      },
      medium: {
        id: 3,
        name: "Medium",
        audioDurationMinutes: 5,
        // 4-5 minutes
        creditCost: 2
      },
      long: {
        id: 4,
        name: "Long",
        audioDurationMinutes: 9,
        // 8-9 minutes
        creditCost: 4
      }
    };
  }
});

// server/index.ts
import dotenv7 from "dotenv";
import express2 from "express";
import path6 from "path";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  stories;
  voices;
  comments;
  storyAudios;
  discussions;
  userId;
  storyId;
  commentId;
  voiceId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.stories = /* @__PURE__ */ new Map();
    this.voices = /* @__PURE__ */ new Map();
    this.comments = /* @__PURE__ */ new Map();
    this.storyAudios = /* @__PURE__ */ new Map();
    this.userId = 1;
    this.storyId = 1;
    this.commentId = 1;
    this.voiceId = 1;
    const exampleStory1 = {
      _id: this.storyId.toString(),
      title: "Midnight in Paris",
      content: "A passionate encounter under the Parisian moonlight changes everything for two strangers...",
      settings: {
        timePeriod: "Contemporary",
        location: "Paris",
        atmosphere: "Romantic",
        protagonistGender: "female",
        partnerGender: "male",
        relationship: "Strangers",
        writingTone: "Passionate",
        length: 1500
      },
      userId: "system",
      isPublic: true,
      likes: 238,
      plays: 567,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.stories.set(this.storyId.toString(), exampleStory1);
    this.storyId++;
    const exampleStory2 = {
      _id: this.storyId.toString(),
      title: "The Pirate's Captive",
      content: "Captured by a notorious pirate captain, a noble lady discovers her own desires at sea...",
      settings: {
        timePeriod: "Medieval",
        location: "Caribbean Sea",
        atmosphere: "Mysterious",
        protagonistGender: "female",
        partnerGender: "male",
        relationship: "Enemies to Lovers",
        writingTone: "Intense",
        length: 2e3
      },
      userId: "system",
      isPublic: true,
      likes: 186,
      plays: 423,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.stories.set(this.storyId.toString(), exampleStory2);
    this.storyId++;
    const exampleStory3 = {
      _id: this.storyId.toString(),
      title: "CEO's Secret",
      content: "When a young executive discovers her boss's hidden desires, their professional relationship transforms...",
      settings: {
        timePeriod: "Contemporary",
        location: "Manhattan",
        atmosphere: "Tense",
        protagonistGender: "female",
        partnerGender: "male",
        relationship: "Boss/Employee",
        writingTone: "Passionate",
        length: 1800
      },
      userId: "system",
      isPublic: true,
      likes: 312,
      plays: 678,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.stories.set(this.storyId.toString(), exampleStory3);
    this.storyId++;
    const exampleStory4 = {
      _id: this.storyId.toString(),
      title: "Dragon's Desire",
      content: "In a world of magic, a dragon shifter finds his fated mate in an unexpected place...",
      settings: {
        timePeriod: "Fantasy Realm",
        location: "Enchanted Forest",
        atmosphere: "Magical",
        protagonistGender: "male",
        partnerGender: "female",
        relationship: "Fated Mates",
        writingTone: "Intense",
        length: 2200
      },
      userId: "system",
      isPublic: true,
      likes: 156,
      plays: 389,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.stories.set(this.storyId.toString(), exampleStory4);
    this.storyId++;
    this.initializeVoices();
    this.discussions = [
      {
        id: 1,
        title: "Writing Techniques for Passionate Romance",
        content: "I'm trying to improve the passionate scenes in my stories. Any tips from experienced writers?",
        author: "RomanceWriter",
        commentCount: 15
      },
      {
        id: 2,
        title: "Historical Accuracy in Period Romances",
        content: "How important is historical accuracy in your erotic historical fiction?",
        author: "HistoryBuff",
        commentCount: 8
      },
      {
        id: 3,
        title: "Character Development in Short Stories",
        content: "How do you develop compelling characters in shorter formats?",
        author: "StoryMaster",
        commentCount: 22
      },
      {
        id: 4,
        title: "Favorite Settings for Steamy Encounters",
        content: "What are some unique settings you've used that worked well?",
        author: "CreativeScribe",
        commentCount: 17
      }
    ];
  }
  initializeVoices() {
    const defaultVoices = [
      {
        name: "Sophia",
        gender: "female",
        style: "soft",
        apiId: "EXAVITQu4vr4xnSDxMaL",
        isPremium: false
      },
      {
        name: "James",
        gender: "male",
        style: "deep",
        apiId: "VR6AewLTigWG4xSOukaG",
        isPremium: false
      },
      {
        name: "Isabella",
        gender: "female",
        style: "sensual",
        apiId: "yoZ06aMxZJJ28mfd3POQ",
        isPremium: true
      },
      {
        name: "Michael",
        gender: "male",
        style: "authoritative",
        apiId: "TxGEqnHWrfWFTfGW9XjX",
        isPremium: true
      },
      {
        name: "Lily",
        gender: "female",
        style: "playful",
        apiId: "21m00Tcm4TlvDq8ikWAM",
        isPremium: true
      }
    ];
    defaultVoices.forEach((voice) => {
      const id = this.voiceId.toString();
      this.voices.set(id, { ...voice, id, isPremium: voice.isPremium || false });
      this.voiceId++;
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.userId.toString();
    const user = { ...insertUser, id, isPremium: insertUser.isPremium || false };
    this.users.set(id, user);
    this.userId++;
    return user;
  }
  // Story methods
  async getStory(id) {
    return this.stories.get(id);
  }
  async getPublicStories() {
    return Array.from(this.stories.values()).filter((story) => story.isPublic).sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 6);
  }
  async getFeaturedStories() {
    return Array.from(this.stories.values()).filter((story) => story.isPublic).sort((a, b) => b.likes - a.likes).slice(0, 6);
  }
  async getPopularStories() {
    return Array.from(this.stories.values()).filter((story) => story.isPublic).sort((a, b) => (b.likes || 0) + (b.plays || 0) - ((a.likes || 0) + (a.plays || 0))).slice(0, 4).map((story) => ({
      id: story._id.toString(),
      title: story.title,
      description: story.content.substring(0, 100) + "...",
      likes: story.likes || 0,
      plays: story.plays || 0
    }));
  }
  async createStory(insertStory) {
    const id = this.storyId.toString();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const story = {
      ...insertStory,
      _id: id,
      likes: 0,
      plays: 0,
      createdAt: new Date(createdAt)
    };
    this.stories.set(id, story);
    this.storyId++;
    return story;
  }
  async updateStoryContent(id, content) {
    const story = this.stories.get(id);
    if (!story) {
      throw new Error("Story not found");
    }
    const updatedStory = { ...story, content };
    this.stories.set(id, updatedStory);
    return updatedStory;
  }
  async likeStory(id) {
    const story = this.stories.get(id);
    if (!story) {
      throw new Error("Story not found");
    }
    story.likes = (story.likes || 0) + 1;
    this.stories.set(id, story);
  }
  async incrementStoryPlays(id) {
    const story = this.stories.get(id);
    if (!story) {
      throw new Error("Story not found");
    }
    story.plays = (story.plays || 0) + 1;
    this.stories.set(id, story);
  }
  // Voice methods
  async getVoices() {
    return Array.from(this.voices.values());
  }
  // Audio methods
  async getStoryAudio(storyId) {
    const audioUrl = this.storyAudios.get(storyId);
    return audioUrl ? { audioUrl } : void 0;
  }
  async saveStoryAudio(storyId, audioUrl) {
    this.storyAudios.set(storyId, audioUrl);
  }
  // Community methods
  async getDiscussions() {
    return this.discussions;
  }
  async getComments(storyId) {
    return Array.from(this.comments.values()).filter((comment) => comment.storyId === storyId);
  }
  async addComment(insertComment) {
    const id = this.commentId.toString();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const comment = {
      ...insertComment,
      id,
      userId: insertComment.userId || null,
      storyId: insertComment.storyId || null,
      createdAt: new Date(createdAt)
    };
    this.comments.set(id, comment);
    this.commentId++;
    return comment;
  }
};
var storage = new MemStorage();

// server/routes.ts
import { z as z4 } from "zod";

// server/utils/elevenlabs.ts
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import ffmpeg from "fluent-ffmpeg";
dotenv.config();
ffmpeg.setFfmpegPath("/nix/store/3zc5jbvqzrn8zmva4fx5p0nh4yy03wk4-ffmpeg-6.1.1-bin/bin/ffmpeg");
ffmpeg.setFfprobePath("/nix/store/3zc5jbvqzrn8zmva4fx5p0nh4yy03wk4-ffmpeg-6.1.1-bin/bin/ffprobe");
var writeFileAsync = promisify(fs.writeFile);
var mkdirAsync = promisify(fs.mkdir);
var ElevenLabsService = class {
  apiKey;
  audioDir;
  constructor(apiKey) {
    const envKey = process.env.ELEVENLABS_API_KEY;
    if (envKey) {
      this.apiKey = envKey;
      console.log("Using ElevenLabs API key from environment variable");
    } else if (apiKey) {
      this.apiKey = apiKey;
      console.log("Using provided ElevenLabs API key parameter");
    } else {
      this.apiKey = "";
      console.error("ERROR: No ElevenLabs API key provided. Audio generation will not work.");
    }
    if (this.apiKey) {
      const censoredKey = this.apiKey.substring(0, 6) + "..." + this.apiKey.substring(this.apiKey.length - 4);
      console.log(`ElevenLabs API key is configured: ${censoredKey}`);
    }
    this.audioDir = path.join(process.cwd(), "dist", "public", "audio");
    this.ensureAudioDir();
  }
  // Ensure audio directory exists
  async ensureAudioDir() {
    try {
      await mkdirAsync(this.audioDir, { recursive: true });
      console.log(`Audio directory ensured at: ${this.audioDir}`);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("already exists"))) {
        console.error("Error creating audio directory:", error);
      }
    }
  }
  // Create a fallback audio file when TTS fails
  async createFallbackAudio() {
    const fallbackFilename = `fallback_${Date.now()}.mp3`;
    const fallbackPath = path.join(this.audioDir, fallbackFilename);
    try {
      await writeFileAsync(fallbackPath, Buffer.from([255, 251, 144, 68, 0]));
      console.log(`Created fallback audio file: ${fallbackPath}`);
      return `/audio/${fallbackFilename}`;
    } catch (error) {
      console.error("Error creating fallback audio file:", error);
      throw error;
    }
  }
  // Get available ElevenLabs voices
  async getVoices() {
    try {
      console.log("Fetching voices from ElevenLabs API...");
      const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json"
        }
      });
      if (response.data && response.data.voices && Array.isArray(response.data.voices)) {
        return response.data.voices.map((voice) => ({
          voice_id: voice.voice_id || "",
          name: voice.name || "Unknown",
          preview_url: voice.preview_url || "",
          category: voice.category || "elevenlabs",
          labels: {
            gender: this.determineGender(voice),
            style: this.determineStyle(voice)
          }
        }));
      }
      console.log("response.data is ", response.data);
      console.warn("No voices found in API response, returning predefined voices");
      return this.getPredefinedVoices();
    } catch (error) {
      console.error("Error fetching voices from ElevenLabs:", error);
      return this.getPredefinedVoices();
    }
  }
  // Convert text to speech using ElevenLabs
  async textToSpeech({
    text,
    voiceId,
    model: model3 = "eleven_monolingual_v1",
    stability = 0.5,
    similarityBoost = 0.75
  }) {
    try {
      console.log(`Starting text-to-speech generation with voice ID: ${voiceId}`);
      if (!this.apiKey || this.apiKey.trim() === "") {
        console.error("ElevenLabs API key is not configured. Cannot generate speech.");
        throw new Error("ElevenLabs API key is missing or empty. Please configure it in your environment variables.");
      }
      const sanitizedText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\n+/g, " ").replace(/\s{2,}/g, " ").replace(/'/g, "'").replace(/"/g, '"').trim();
      const chunks = this.splitTextIntoChunks(sanitizedText, 1e4);
      console.log(`Split text into ${chunks.length} chunks for processing (max 10000 chars each)`);
      const baseFilename = `story_${Date.now()}`;
      const tempFiles = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkFilename = `${baseFilename}_part${i}.mp3`;
        const chunkFilePath = path.join(this.audioDir, chunkFilename);
        console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
        try {
          const actualVoiceId = this.getActualVoiceId(voiceId);
          let retryCount = 0;
          const maxRetries = 3;
          while (retryCount < maxRetries) {
            try {
              console.log(`Calling ElevenLabs API with voice ID: ${actualVoiceId}, chunk length: ${chunk.length} chars, API key length: ${this.apiKey.length} chars`);
              const response = await axios({
                method: "post",
                url: `https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`,
                headers: {
                  "xi-api-key": this.apiKey,
                  "Content-Type": "application/json",
                  "Accept": "audio/mpeg"
                },
                data: {
                  text: chunk,
                  model_id: model3,
                  voice_settings: {
                    stability,
                    similarity_boost: similarityBoost
                  }
                },
                responseType: "arraybuffer"
              });
              console.log(`ElevenLabs API call successful for chunk ${i + 1}/${chunks.length}`);
              await writeFileAsync(chunkFilePath, Buffer.from(response.data));
              tempFiles.push(chunkFilePath);
              break;
            } catch (error) {
              retryCount++;
              console.error(`Error calling ElevenLabs API (attempt ${retryCount}/${maxRetries}):`, error.message);
              if (error.response?.status === 401 || error.message && (error.message.includes("401") || error.message.includes("Unauthorized") || error.message.includes("api-key"))) {
                console.error("API authentication error - check your ElevenLabs API key");
                throw error;
              }
              if (retryCount === maxRetries) {
                throw error;
              }
              await new Promise((resolve) => setTimeout(resolve, 1e3 * Math.pow(2, retryCount)));
            }
          }
          if (i < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1e3));
          }
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
          throw chunkError;
        }
      }
      const finalFilename = `${baseFilename}.mp3`;
      const finalFilePath = path.join(this.audioDir, finalFilename);
      try {
        if (tempFiles.length === 0) {
          throw new Error("No audio chunks were generated");
        } else if (tempFiles.length === 1) {
          console.log("Only one audio chunk, copying directly to final file");
          fs.copyFileSync(tempFiles[0], finalFilePath);
        } else {
          console.log(`Combining ${tempFiles.length} audio chunks with ffmpeg`);
          try {
            await new Promise((resolve, reject) => {
              const command = ffmpeg();
              tempFiles.forEach((file) => {
                command.input(file);
              });
              command.on("end", () => {
                console.log("FFmpeg successfully combined audio chunks");
                resolve(null);
              }).on("error", (err) => {
                console.error("FFmpeg error:", err);
                reject(err);
              }).mergeToFile(finalFilePath, this.audioDir);
            });
          } catch (ffmpegError) {
            console.error("FFmpeg failed, falling back to using just the first chunk:", ffmpegError);
            console.log("Using first chunk as fallback in case of FFmpeg failure");
            fs.copyFileSync(tempFiles[0], finalFilePath);
          }
        }
        tempFiles.forEach((file) => {
          try {
            fs.unlinkSync(file);
            console.log(`Deleted temp file: ${file}`);
          } catch (e) {
            console.error("Error deleting temp file:", e);
          }
        });
      } catch (error) {
        console.error("Error combining audio chunks:", error);
        throw error;
      }
      const fileStats = fs.statSync(finalFilePath);
      console.log(`Final audio file size: ${fileStats.size} bytes`);
      if (fileStats.size < 1024) {
        throw new Error("Generated audio file is too small, likely invalid");
      }
      return `/audio/${finalFilename}`;
    } catch (error) {
      console.error("Error generating speech:", error);
      if (error.message && (error.message.includes("401") || error.message.includes("Unauthorized") || error.message.includes("api-key"))) {
        throw new Error("ElevenLabs API authentication failed. Please check your API key.");
      }
      throw error;
    }
  }
  splitTextIntoChunks(text, maxChunkSize) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = "";
    for (const sentence of sentences) {
      if (sentence.length > maxChunkSize) {
        const words = sentence.split(/\s+/);
        let tempChunk = "";
        for (const word of words) {
          if ((tempChunk + " " + word).length <= maxChunkSize) {
            tempChunk += (tempChunk ? " " : "") + word;
          } else {
            if (tempChunk) chunks.push(tempChunk.trim());
            tempChunk = word;
          }
        }
        if (tempChunk) chunks.push(tempChunk.trim());
        continue;
      }
      if ((currentChunk + " " + sentence).length <= maxChunkSize) {
        currentChunk += (currentChunk ? " " : "") + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }
  // Determine gender based on voice metadata
  determineGender(voice) {
    const name = (voice.name || "").toLowerCase();
    const labels = Object.keys(voice.labels || {}).join(" ").toLowerCase();
    if (name.includes("female") || labels.includes("female")) {
      return "female";
    } else if (name.includes("male") || labels.includes("male")) {
      return "male";
    }
    const femaleNames = ["rachel", "domi", "bella", "elli", "anna", "matilda", "charlotte"];
    const maleNames = ["antoni", "josh", "arnold", "adam", "sam", "harry", "james"];
    for (const femaleName of femaleNames) {
      if (name.includes(femaleName)) return "female";
    }
    for (const maleName of maleNames) {
      if (name.includes(maleName)) return "male";
    }
    return "unknown";
  }
  // Determine style based on voice metadata
  determineStyle(voice) {
    const name = (voice.name || "").toLowerCase();
    const labels = Object.keys(voice.labels || {}).join(" ").toLowerCase();
    if (labels.includes("soft") || name.includes("soft")) {
      return "soft";
    } else if (labels.includes("deep") || name.includes("deep")) {
      return "deep";
    } else if (labels.includes("sensual") || name.includes("sensual")) {
      return "sensual";
    } else if (labels.includes("authoritative") || name.includes("authoritative")) {
      return "authoritative";
    } else if (labels.includes("playful") || name.includes("playful")) {
      return "playful";
    }
    return "natural";
  }
  // Get actual ElevenLabs voice ID from input
  getActualVoiceId(voiceId) {
    const voiceMappings = {
      // Main voice categories with their IDs
      male: {
        default: "VR6AewLTigWG4xSOukaG",
        // Adam (Deep Male)
        deep: "VR6AewLTigWG4xSOukaG",
        // Adam
        authoritative: "TxGEqnHWrfWFTfGW9XjX"
        // Josh
      },
      female: {
        default: "EXAVITQu4vr4xnSDxMaL",
        // Rachel (Soft Female)
        soft: "EXAVITQu4vr4xnSDxMaL",
        // Rachel
        sensual: "yoZ06aMxZJJ28mfd3POQ",
        // Bella
        playful: "21m00Tcm4TlvDq8ikWAM"
        // Domi
      }
    };
    const directMappings = {
      "Rachel": voiceMappings.female.soft,
      "Adam": voiceMappings.male.deep,
      "Bella": voiceMappings.female.sensual,
      "Josh": voiceMappings.male.authoritative,
      "Domi": voiceMappings.female.playful,
      "Charlie": "IKne3meq5aSn9XLyUdCD",
      "Will": "bIHbv24MWmeRgasZH58o",
      "George": "VR6AewLTigWG4xSOukaG",
      // Map George to Adam's voice ID (male voice)
      "Aria": "EXAVITQu4vr4xnSDxMaL",
      // Map to Rachel's voice ID
      "Roger": "TxGEqnHWrfWFTfGW9XjX",
      // Map to Josh's voice ID
      "Sarah": "21m00Tcm4TlvDq8ikWAM",
      // Map to Domi's voice ID
      "Laura": "yoZ06aMxZJJ28mfd3POQ",
      // Map to Bella's voice ID
      "Callum": "VR6AewLTigWG4xSOukaG",
      // Map to Adam's voice ID
      "Liam": "IKne3meq5aSn9XLyUdCD",
      // Map to Charlie's voice ID
      "River": "yoZ06aMxZJJ28mfd3POQ",
      // Map to Bella's voice ID
      "Charlotte": "21m00Tcm4TlvDq8ikWAM",
      // Map to Domi's voice ID
      "Soft Female": voiceMappings.female.soft,
      "Deep Male": voiceMappings.male.deep,
      "Sensual Female": voiceMappings.female.sensual,
      "Authoritative Male": voiceMappings.male.authoritative,
      "Playful Female": voiceMappings.female.playful
    };
    console.log(`Mapping voice ID/name input: "${voiceId}"`);
    if (!voiceId) {
      console.warn("Voice ID is undefined or null, defaulting to Rachel (Soft Female)");
      return voiceMappings.female.default;
    }
    if (voiceId && voiceId.length >= 20 && /^[a-zA-Z0-9]+$/.test(voiceId)) {
      console.log(`Using direct ElevenLabs voice ID: ${voiceId}`);
      return voiceId;
    }
    const normalizedInput = voiceId.toLowerCase().trim();
    if (directMappings[voiceId]) {
      console.log(`Found direct mapping for "${voiceId}": ${directMappings[voiceId]}`);
      return directMappings[voiceId];
    }
    const voiceKey = Object.keys(directMappings).find(
      (key) => key.toLowerCase() === normalizedInput
    );
    if (voiceKey) {
      console.log(`Found case-insensitive mapping for "${voiceId}" \u2192 "${voiceKey}": ${directMappings[voiceKey]}`);
      return directMappings[voiceKey];
    }
    const validVoiceIds = [
      ...Object.values(voiceMappings.male),
      ...Object.values(voiceMappings.female)
    ];
    if (validVoiceIds.includes(voiceId)) {
      console.log(`Using provided valid voice ID from our known list: ${voiceId}`);
      return voiceId;
    }
    if (normalizedInput.includes("male") && !normalizedInput.includes("female")) {
      if (normalizedInput.includes("authoritative")) {
        return voiceMappings.male.authoritative;
      }
      return voiceMappings.male.default;
    }
    if (normalizedInput.includes("sensual")) {
      return voiceMappings.female.sensual;
    } else if (normalizedInput.includes("playful")) {
      return voiceMappings.female.playful;
    } else if (normalizedInput.includes("soft")) {
      return voiceMappings.female.soft;
    }
    console.warn(`No specific match found for "${voiceId}", defaulting to Rachel (Soft Female)`);
    return voiceMappings.female.default;
  }
  // Get predefined voices if API isn't available
  getPredefinedVoices() {
    return [
      {
        voice_id: "EXAVITQu4vr4xnSDxMaL",
        name: "Rachel (Soft Female)",
        preview_url: "https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview",
        category: "elevenlabs",
        labels: { gender: "female", style: "soft" }
      },
      {
        voice_id: "VR6AewLTigWG4xSOukaG",
        name: "Adam (Deep Male)",
        preview_url: "https://api.elevenlabs.io/v1/voices/VR6AewLTigWG4xSOukaG/preview",
        category: "elevenlabs",
        labels: { gender: "male", style: "deep" }
      },
      {
        voice_id: "yoZ06aMxZJJ28mfd3POQ",
        name: "Bella (Sensual Female)",
        preview_url: "https://api.elevenlabs.io/v1/voices/yoZ06aMxZJJ28mfd3POQ/preview",
        category: "elevenlabs",
        labels: { gender: "female", style: "sensual" }
      },
      {
        voice_id: "TxGEqnHWrfWFTfGW9XjX",
        name: "Josh (Authoritative Male)",
        preview_url: "https://api.elevenlabs.io/v1/voices/TxGEqnHWrfWFTfGW9XjX/preview",
        category: "elevenlabs",
        labels: { gender: "male", style: "authoritative" }
      },
      {
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        name: "Domi (Playful Female)",
        preview_url: "https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/preview",
        category: "elevenlabs",
        labels: { gender: "female", style: "playful" }
      },
      {
        voice_id: "IKne3meq5aSn9XLyUdCD",
        name: "Charlie",
        preview_url: "https://api.elevenlabs.io/v1/voices/IKne3meq5aSn9XLyUdCD/preview",
        category: "elevenlabs",
        labels: { gender: "male", style: "conversational" }
      },
      {
        voice_id: "VR6AewLTigWG4xSOukaG",
        // Using Adam's voice ID for George
        name: "George",
        preview_url: "https://api.elevenlabs.io/v1/voices/VR6AewLTigWG4xSOukaG/preview",
        category: "elevenlabs",
        labels: { gender: "male", style: "deep" }
      },
      {
        voice_id: "bIHbv24MWmeRgasZH58o",
        name: "Will",
        preview_url: "https://api.elevenlabs.io/v1/voices/bIHbv24MWmeRgasZH58o/preview",
        category: "elevenlabs",
        labels: { gender: "male", style: "casual" }
      }
    ];
  }
  // Map frontend voice name to ElevenLabs voice ID (public method)
  getVoiceId(voiceName) {
    console.log(`getVoiceId called with: "${voiceName}"`);
    return this.getActualVoiceId(voiceName);
  }
};
var elevenlabs = new ElevenLabsService();

// server/routes.ts
import path3 from "path";
import fs3 from "fs";

// server/middlewares/auth.middleware.ts
import jwt2 from "jsonwebtoken";
import dotenv3 from "dotenv";

// server/models/user.model.ts
import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv2 from "dotenv";
dotenv2.config();
var JWT_SECRET = process.env.JWT_SECRET || "story_app_super_secret_key_for_tokens_2025";
var userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  // Made optional for Google auth
  name: { type: String, required: true },
  phone: { type: String, required: false },
  // Added phone field
  role: { type: String, enum: ["admin", "user"], default: "user" },
  subscription: {
    type: String,
    enum: ["free", "standard", "premium"],
    default: "free"
  },
  isPremium: { type: Boolean, default: false },
  // True for any paid plan
  credits: { type: Number, default: 10 },
  // Default 10 credits for new users
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
  badges: [{ type: String }]
  // Array of strings to store badge names/IDs
});
userSchema.index({ email: 1 }, { unique: true });
userSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id }, JWT_SECRET, { expiresIn: "24h" });
};
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};
var User = model("User", userSchema);

// server/middlewares/auth.middleware.ts
dotenv3.config();
var JWT_SECRET2 = process.env.JWT_SECRET || "story_app_super_secret_key_for_tokens_2025";
var authMiddleware = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Token from header:", token);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const jwtSecret = JWT_SECRET2;
    const decoded = jwt2.verify(token, jwtSecret);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.log("Decoded JWT:", decoded);
    req.session.userId = decoded.id;
    req.session.token = token;
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res.status(500).json({ message: "Error saving session" });
      }
      next();
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
var isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};
var isAdmin = async (req, res, next) => {
  try {
    let userId;
    let role;
    if (req.session?.userId) {
      userId = req.session.userId;
      role = req.session.role;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      const jwtSecret = JWT_SECRET2;
      const decoded = jwt2.verify(token, jwtSecret);
      userId = decoded.id || decoded.userId;
      role = decoded.role;
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (role === "admin") {
      return next();
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (req.session && !req.session.role) {
      req.session.role = user.role;
    }
    if (user.role === "admin") {
      return next();
    }
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// server/routes/auth.route.ts
import { Router } from "express";

// server/services/auth.service.ts
var login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid password");
  }
  const token = user.generateAuthToken();
  return { user, token };
};
var signup = async (email, password, name, phone) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }
  const user = new User({
    email,
    password,
    name,
    phone,
    role: "user"
  });
  await user.save();
  const token = user.generateAuthToken();
  return { user, token };
};

// server/controllers/auth.controller.ts
var login2 = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const { user, token } = await login(email, password);
    req.session.userId = user._id.toString();
    req.session.token = token;
    req.session.role = user.role;
    res.status(200).json({
      user: {
        ...user.toJSON(),
        isPremium: user.isPremium || false
      },
      token
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
var signup2 = async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, password, and name are required" });
  }
  try {
    const { user, token } = await signup(email, password, name, phone);
    req.session.userId = user._id.toString();
    req.session.token = token;
    req.session.role = user.role;
    res.status(201).json({
      user: {
        ...user.toJSON(),
        isPremium: user.isPremium || false
      },
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
var logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie("seduise.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
};
var getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.session.role = user.role;
    const userJson = user.toJSON();
    res.status(200).json({
      ...userJson,
      isPremium: user.isPremium || false
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
};
var googleCallback = (req, res) => {
  try {
    if (!req.user) {
      console.error("Google OAuth callback: No user in request");
      return res.redirect("/?error=authentication-failed");
    }
    const user = req.user;
    req.session.userId = user._id.toString();
    req.session.role = user.role;
    const token = user.generateAuthToken();
    req.session.token = token;
    const tokenPreview = token.substring(0, 10) + "...";
    const encodedToken = encodeURIComponent(token);
    res.redirect(`/?token=${encodedToken}&googleAuth=success`);
  } catch (error) {
    console.error("Google auth callback error:", error);
    res.redirect("/?error=google-auth-failed");
  }
};

// server/config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv4 from "dotenv";
dotenv4.config();
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      passReqToCallback: true,
      // Required for Replit environment and secure cookies
      proxy: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }
        if (profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            user.authProvider = "google";
            if (profile.photos && profile.photos.length > 0) {
              user.profilePicture = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }
        if (profile.emails && profile.emails.length > 0) {
          let phone = void 0;
          if (req.query && req.query.state) {
            try {
              const state = JSON.parse(decodeURIComponent(req.query.state));
              if (state && state.phone) {
                phone = state.phone;
              }
            } catch (e) {
            }
          }
          const newUser = new User({
            email: profile.emails[0].value,
            name: profile.displayName || "Google User",
            googleId: profile.id,
            authProvider: "google",
            profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "",
            phone
          });
          await newUser.save();
          return done(null, newUser);
        } else {
          return done(new Error("Google profile does not contain an email address"));
        }
      } catch (error) {
        return done(error);
      }
    }
  ));
}
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
var passport_default = passport;

// server/routes/auth.route.ts
var router = Router();
router.post("/login", login2);
router.post("/signup", signup2);
router.post("/logout", logout);
router.get("/me", authMiddleware, getCurrentUser);
router.get(
  "/google",
  passport_default.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);
router.get(
  "/google/callback",
  passport_default.authenticate("google", { session: false }),
  googleCallback
);
var auth_route_default = router;

// server/models/story.model.ts
import { Schema as Schema2, model as model2 } from "mongoose";
var chapterSchema = new Schema2({
  number: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String },
  audioUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  wordCount: { type: Number },
  creditsCost: { type: Number, default: 1 }
});
var storySchema = new Schema2({
  title: { type: String, required: true },
  content: { type: String },
  // Keep for backward compatibility
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
  creditsCost: { type: Number, default: 1 },
  chapters: { type: [chapterSchema], default: [] },
  currentChapter: { type: Number, default: 1 },
  totalChapters: { type: Number, default: 1 },
  isChapterBased: { type: Boolean, default: false },
  isPremiumContent: { type: Boolean, default: false },
  accessType: {
    type: String,
    enum: ["public", "premium_early_access", "premium_exclusive"],
    default: "public"
  },
  premiumAccessDate: { type: Date },
  publicReleaseDate: { type: Date }
}, { timestamps: true });
storySchema.index({ id: 1 }, { unique: false });
var Story = model2("Story", storySchema);

// server/routes/story.route.ts
import { Router as Router2 } from "express";

// server/utils/openai.ts
import OpenAI from "openai";
var novitaAI = new OpenAI({
  baseURL: "https://api.novita.ai/v3/openai",
  apiKey: "sk_rEjXJfuj7kImHyeFPucTGuewR3E37rilrKATo1tCHcI"
});
var stream = false;
async function generateStory(options) {
  const {
    title,
    timePeriod,
    location,
    atmosphere,
    protagonistGender,
    partnerGender,
    relationship,
    writingTone,
    length,
    settingDescription,
    protagonistDescription,
    loveInterestDescription,
    explicitLevel
  } = options;
  let maxTokens = 0;
  let targetWordCount = "";
  if (length === 2) {
    maxTokens = 1200;
    targetWordCount = "Write a short story of approximately 300-400 words.";
  } else if (length === 3) {
    maxTokens = 2400;
    targetWordCount = "Write a medium-length story of approximately 700-900 words.";
  } else if (length === 4) {
    maxTokens = 4800;
    targetWordCount = "Write a longer story of approximately 1500-1800 words.";
  } else {
    maxTokens = 1200;
    targetWordCount = "Write a short story of approximately 300-400 words.";
  }
  console.log(`Story length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);
  const explicitLevelDescription = explicitLevel !== void 0 ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.` : "Keep the content moderately explicit unless otherwise specified.";
  const titlePrompt = title ? `The story must directly involve the central concept of "${title}" as its primary focus. The story's main character, plot, theme, and events MUST literally be about "${title}" - for example, if the title is "Greedy Dog", the story MUST feature a dog that is greedy as a central character or theme. If the title is a person's name, they must be the main character. If the title is an object, that object must be central to the story. Make the title the most prominent element of the story.` : "Generate an appropriate title for the story.";
  const settingPrompt = settingDescription ? `Setting description: ${settingDescription}
Incorporate these specific setting details into your narrative.` : "";
  const protagonistPrompt = protagonistDescription ? `Protagonist description: ${protagonistDescription}
Ensure the protagonist has these specific characteristics.` : "";
  const loveInterestPrompt = loveInterestDescription ? `Love interest description: ${loveInterestDescription}
Incorporate these specific details about the love interest.` : "";
  const systemPrompt = `You are an expert erotic fiction writer known for creating tasteful, sensual narratives.
Generate an erotic story with the following parameters:
- Time Period: ${timePeriod}
- Location: ${location}
- Atmosphere: ${atmosphere}
- Protagonist Gender: ${protagonistGender}
- Partner Gender: ${partnerGender}
- Relationship: ${relationship}
- Writing Tone: ${writingTone}
${targetWordCount} This is critical for producing the correct audio duration.
${explicitLevelDescription}
${titlePrompt}

${settingPrompt}
${protagonistPrompt}
${loveInterestPrompt}

IMPORTANT: Make the story incomplete/unfinished, ending with a cliffhanger at the end of a complete sentence or scene. End at a natural pause point that creates anticipation for the next chapter. DO NOT end mid-sentence or mid-word.

Your story should be tasteful, sensual, and focus on the emotional and physical connection between characters.
Include vivid descriptions and engaging dialogue. Start with setting the scene and gradually build tension.

Format your response as JSON with the following structure:
{
  "title": "${title || "Story Title"}",
  "content": "Full story with proper paragraphs and formatting"
}`;
  const userPrompt = "Generate a high-quality erotic story based on the parameters.";
  try {
    console.log("Generating story with Novita.ai deepseek model...");
    const completion = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.8,
      stream
    });
    if (stream) {
      let fullResponse = "";
      for await (const chunk of completion) {
        if (chunk.choices[0].finish_reason) {
          console.log("Generation complete.");
        } else {
          fullResponse += chunk.choices[0].delta.content || "";
        }
      }
      fullResponse = fullResponse.replace(/```json\s?/g, "").replace(/```\s?/g, "");
      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        let jsonStr = jsonMatch ? jsonMatch[0] : fullResponse;
        jsonStr = jsonStr.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f");
        try {
          const result = JSON.parse(jsonStr);
          return {
            title: title || result.title || "Untitled Story",
            content: result.content || fullResponse
          };
        } catch (nestedJsonError) {
          console.error("Error parsing cleaned JSON from stream:", nestedJsonError);
          return {
            title: title || "Untitled Story",
            content: fullResponse
          };
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response in stream:", jsonError);
        return {
          title: title || "Untitled Story",
          content: fullResponse
        };
      }
    } else {
      let responseText = completion.choices[0].message.content || '{"title": "Untitled", "content": "Story generation failed."}';
      responseText = responseText.replace(/```json\s?/g, "").replace(/```\s?/g, "");
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        let jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f").replace(/\n/g, " ");
        try {
          const result = JSON.parse(jsonStr);
          let finalContent = result.content || responseText;
          if (finalContent.includes("{") && finalContent.includes("}")) {
            finalContent = finalContent.replace(/{[^}]*}/g, "").replace(/\[\s*"[^"]*"\s*(?:,\s*"[^"]*"\s*)*\]/g, "").replace(/\s{2,}/g, " ").trim();
          }
          const lastChar = finalContent.slice(-1);
          const lastFewChars = finalContent.slice(-3);
          if (!['."', '!"', '?"', '"'].some((ending) => lastFewChars.includes(ending))) {
            const sentences = finalContent.split(/[.!?]+/);
            if (sentences.length > 1) {
              sentences.pop();
              finalContent = sentences.join(".") + ".";
            }
          }
          return {
            title: title || result.title || "Untitled Story",
            content: finalContent
          };
        } catch (nestedJsonError) {
          console.error("Error parsing cleaned JSON:", nestedJsonError);
          return {
            title: title || "Untitled Story",
            content: responseText
          };
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response from Novita:", jsonError);
        return {
          title: title || "Untitled Story",
          content: responseText
        };
      }
    }
  } catch (error) {
    console.error("All story generation attempts failed:", error);
    throw new Error("Failed to generate story. Please try again later or check your API keys.");
  }
}
async function generateChapterSummary(content, chapterNumber) {
  try {
    const response = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
      messages: [
        { role: "system", content: `Generate a brief, tasteful summary (1-2 sentences) for Chapter ${chapterNumber} of an erotic story. Focus on the key events and emotional developments without being overly explicit.` },
        { role: "user", content: `Chapter ${chapterNumber} content: ${content.substring(0, 800)}...` }
      ],
      max_tokens: 100,
      temperature: 0.7
    });
    let summary = response.choices[0].message.content?.replace(/"/g, "").trim() || `Summary for Chapter ${chapterNumber}`;
    summary = summary.replace(/^Chapter \d+:?\s*/i, "").trim();
    if (!summary) summary = `Chapter ${chapterNumber} summary`;
    return summary;
  } catch (error) {
    console.error("Error generating chapter summary:", error);
    return `Chapter ${chapterNumber} summary`;
  }
}
async function generateChapterTitle(content, chapterNumber) {
  try {
    const response = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
      messages: [
        { role: "system", content: `Generate a captivating, descriptive title for Chapter ${chapterNumber} of an erotic story. The title should be 2-6 words and capture the essence of what happens in this chapter. Focus on the key action, emotion, or scene.` },
        { role: "user", content: `Chapter ${chapterNumber} content: ${content.substring(0, 500)}...` }
      ],
      max_tokens: 30,
      temperature: 0.7
    });
    let title = response.choices[0].message.content?.replace(/"/g, "").trim() || `Chapter ${chapterNumber}`;
    title = title.replace(/^Chapter \d+:?\s*/i, "").trim();
    if (!title) title = `Chapter ${chapterNumber}`;
    return title;
  } catch (error) {
    console.error("Error generating chapter title:", error);
    return `Chapter ${chapterNumber}`;
  }
}
async function generateTitleSuggestions(content) {
  try {
    const response = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
      messages: [
        { role: "system", content: "Generate 5 captivating, sensual titles for this erotic story. Keep them concise (2-5 words). Respond in JSON format with an array of titles." },
        { role: "user", content: `Story content (first paragraph): ${content.substring(0, 300)}...` }
      ],
      max_tokens: 150,
      temperature: 0.8
    });
    let responseText = response.choices[0].message.content || '{"titles": ["Untitled Story"]}';
    responseText = responseText.replace(/```json\s?/g, "").replace(/```\s?/g, "");
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      let jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f").replace(/\n/g, " ");
      try {
        const result = JSON.parse(jsonStr);
        if (Array.isArray(result)) {
          return result.slice(0, 5).map((title) => typeof title === "string" ? title : title.toString());
        } else if (result.titles && Array.isArray(result.titles)) {
          return result.titles.slice(0, 5);
        } else if (typeof result === "object") {
          const arrayProp = Object.values(result).find((val) => Array.isArray(val));
          if (arrayProp) {
            return arrayProp.slice(0, 5).map((title) => typeof title === "string" ? title : title.toString());
          }
        }
        return result.titles || ["Untitled Story"];
      } catch (nestedJsonError) {
        console.error("Error parsing cleaned JSON for titles:", nestedJsonError);
        const lines = responseText.split("\n").filter((line) => line.trim().length > 0);
        if (lines.length >= 3) {
          return lines.slice(0, 5).map(
            (line) => line.replace(/^\d+\.\s*/, "").replace(/"/g, "").trim()
          );
        }
        return ["Untitled Story", "Passionate Encounter", "Desire Awakened", "Night's Embrace", "Secret Liaison"];
      }
    } catch (jsonError) {
      console.error("Error parsing JSON for title suggestions:", jsonError);
      const lines = responseText.split("\n").filter((line) => line.trim().length > 0);
      if (lines.length >= 3) {
        return lines.slice(0, 5).map(
          (line) => line.replace(/^\d+\.\s*/, "").replace(/"/g, "").trim()
        );
      }
      return ["Untitled Story", "Passionate Encounter", "Desire Awakened", "Night's Embrace", "Secret Liaison"];
    }
  } catch (error) {
    console.error("Error generating title suggestions:", error);
    return ["Untitled Story", "Passionate Encounter", "Desire Awakened", "Night's Embrace", "Secret Liaison"];
  }
}
async function generateChoices(chapterContent) {
  try {
    const response = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
      messages: [
        { role: "system", content: `You are an expert erotic fiction writer. Given the end of a story chapter, generate 3 distinct, engaging, and sensual choices that the reader can make to influence the next part of the story. Each choice should be a concise phrase (under 15 words). Respond in JSON format with an array of objects, each having a 'text' field for the choice description and an optional 'outcome' field if a specific outcome is implied.` },
        { role: "user", content: `Current chapter ends with: ${chapterContent.slice(-500)}` }
      ],
      max_tokens: 150,
      temperature: 0.7
    });
    let responseText = response.choices[0].message.content || "[]";
    responseText = responseText.replace(/```json\s?/g, "").replace(/```\s?/g, "");
    try {
      const choices = JSON.parse(responseText);
      if (Array.isArray(choices) && choices.every((c) => typeof c.text === "string")) {
        return choices.slice(0, 3);
      }
      return [];
    } catch (jsonError) {
      console.error("Error parsing choices JSON:", jsonError);
      return [];
    }
  } catch (error) {
    console.error("Error generating choices:", error);
    return [];
  }
}
async function continueStory(existingContent, settings, selectedChoice) {
  try {
    const {
      timePeriod,
      location,
      atmosphere,
      protagonistGender,
      partnerGender,
      relationship,
      writingTone,
      length,
      settingDescription,
      protagonistDescription,
      loveInterestDescription,
      explicitLevel
    } = settings;
    let maxTokens = 0;
    let targetWordCount = "";
    if (length === 2) {
      maxTokens = 1200;
      targetWordCount = "Write a short continuation of approximately 300-400 words.";
    } else if (length === 3) {
      maxTokens = 2400;
      targetWordCount = "Write a medium-length continuation of approximately 700-900 words.";
    } else if (length === 4) {
      maxTokens = 4800;
      targetWordCount = "Write a longer continuation of approximately 1500-1800 words.";
    } else {
      maxTokens = 1200;
      targetWordCount = "Write a short continuation of approximately 300-400 words.";
    }
    console.log(`Story continuation length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);
    const explicitLevelDescription = explicitLevel !== void 0 ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.` : "Keep the content moderately explicit unless otherwise specified.";
    const settingPrompt = settingDescription ? `Setting description: ${settingDescription}` : "";
    const protagonistPrompt = protagonistDescription ? `Protagonist description: ${protagonistDescription}` : "";
    const loveInterestPrompt = loveInterestDescription ? `Love interest description: ${loveInterestDescription}` : "";
    const choicePrompt = selectedChoice ? `The user chose: "${selectedChoice}". Continue the story based on this choice.` : "";
    const systemPrompt = `You are an expert erotic fiction writer. Continue this story seamlessly from where it left off.
    
    CRITICAL INSTRUCTIONS:
    1. Read the existing content carefully and continue EXACTLY where it ended
    2. DO NOT repeat any dialogue, actions, or scenes from the existing content
    3. DO NOT use phrases like "And if I choose to stay?" or similar dialogue that appeared before
    4. Maintain the same characters, setting, and tone throughout
    5. Continue the story's natural progression without resetting or restarting
    6. Advance the plot - do NOT repeat similar situations or conversations
    7. DO NOT include "Chapter X" headers - provide only the story content
    8. End at a natural stopping point with a cliffhanger for the next chapter
    9. Ensure each chapter moves the story forward with new developments
    
    Story settings:
    - Time Period: ${timePeriod}
    - Location: ${location}
    - Atmosphere: ${atmosphere}
    - Protagonist Gender: ${protagonistGender}
    - Partner Gender: ${partnerGender}
    - Relationship: ${relationship}
    - Writing Tone: ${writingTone}
    ${targetWordCount} This is critical for producing the correct audio duration.
    ${explicitLevelDescription}
    
    ${settingPrompt}
    ${protagonistPrompt}
    ${loveInterestPrompt}
    
    ${choicePrompt}
    
    Your continuation should advance the plot naturally while maintaining character consistency and story flow.`;
    const response = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here's the existing story content:

${existingContent}

IMPORTANT: Continue from the exact point where it ended. Pick up seamlessly from the last sentence. DO NOT repeat any dialogue, actions, or scenarios that already happened. Move the story forward with new developments, locations, or conversation topics.` }
      ],
      max_tokens: maxTokens,
      temperature: 0.8
    });
    let responseText = response.choices[0].message.content || "The story continues...";
    if (responseText.includes("{") && responseText.includes("}")) {
      responseText = responseText.replace(/```json\s?/g, "").replace(/```\s?/g, "").replace(/{[^}]*}/g, "").replace(/\[\s*"[^"]*"\s*(?:,\s*"[^"]*"\s*)*\]/g, "").replace(/\s{2,}/g, " ").trim();
    }
    responseText = responseText.replace(/^Chapter \d+:?\s*/i, "").trim();
    const lastChar = responseText.slice(-1);
    const lastFewChars = responseText.slice(-3);
    if (!['."', '!"', '?"', '"'].some((ending) => lastFewChars.includes(ending))) {
      const sentences = responseText.split(/[.!?]+/);
      if (sentences.length > 1) {
        sentences.pop();
        responseText = sentences.join(".") + ".";
      }
    }
    return responseText;
  } catch (error) {
    console.error("Error continuing story:", error);
    throw new Error("Failed to continue the story. Please try again.");
  }
}

// server/services/reward.service.ts
async function awardBadge(userId, badgeName) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for badge award.`);
      return false;
    }
    if (!user.badges.includes(badgeName)) {
      user.badges.push(badgeName);
      await user.save();
      console.log(`Awarded badge "${badgeName}" to user ${userId}.`);
      return true;
    } else {
      console.log(`User ${userId} already has badge "${badgeName}".`);
      return false;
    }
  } catch (error) {
    console.error(`Error awarding badge "${badgeName}" to user ${userId}:`, error);
    return false;
  }
}
async function awardReward(userId, rewardName) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for reward award.`);
      return false;
    }
    if (!user.badges.includes(rewardName)) {
      user.badges.push(rewardName);
      await user.save();
      console.log(`Awarded reward "${rewardName}" to user ${userId}.`);
      return true;
    } else {
      console.log(`User ${userId} already has reward "${rewardName}".`);
      return false;
    }
  } catch (error) {
    console.error(`Error awarding reward "${rewardName}" to user ${userId}:`, error);
    return false;
  }
}
async function checkAndAwardTopAuthor() {
  try {
    const topAuthor = await User.aggregate([
      {
        $lookup: {
          from: "stories",
          localField: "stories",
          foreignField: "_id",
          as: "userStories"
        }
      },
      {
        $unwind: "$userStories"
      },
      {
        $match: {
          "userStories.isPublic": true
          // Only consider public stories
        }
      },
      {
        $group: {
          _id: "$_id",
          totalLikes: { $sum: "$userStories.likes" },
          user: { $first: "$ROOT" }
        }
      },
      {
        $sort: { totalLikes: -1 }
      },
      {
        $limit: 1
      }
    ]);
    if (topAuthor.length > 0) {
      const authorId = topAuthor[0].user._id;
      await awardReward(authorId, "Top Author");
    } else {
      console.log("No stories found to determine top author.");
    }
  } catch (error) {
    console.error("Error checking and awarding top author:", error);
  }
}

// server/services/story.service.ts
var createStory = async (title, settings, maxTokens, userId, isPublic = false, category = "romance") => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  let STORY_GENERATION_COST = 1;
  if (settings.length === 3) {
    STORY_GENERATION_COST = 2;
  } else if (settings.length === 4) {
    STORY_GENERATION_COST = 4;
  }
  if (user.credits < 5) {
    console.log(`User had ${user.credits} credits. Updating to 5 credits for testing.`);
    user.credits = 5;
    await user.save();
  }
  if (user.credits < STORY_GENERATION_COST) {
    throw new Error(`Insufficient credits. This story requires ${STORY_GENERATION_COST} credits, but you only have ${user.credits} credits available. Please purchase additional credits or upgrade to premium.`);
  }
  user.credits -= STORY_GENERATION_COST;
  await user.save();
  if (settings.narrationVoiceId) {
    console.log(`Using provided voice ID: ${settings.narrationVoiceId}`);
  } else if (settings.narrationVoice) {
    const voiceId = elevenlabs.getVoiceId(settings.narrationVoice);
    console.log(`Mapped voice name "${settings.narrationVoice}" to ID: ${voiceId}`);
    settings.narrationVoiceId = voiceId;
  } else {
    console.log("No narration voice specified, defaulting to Adam (male voice)");
    settings.narrationVoiceId = "VR6AewLTigWG4xSOukaG";
  }
  const { title: generatedTitle, content } = await generateStory({
    title,
    timePeriod: settings.timePeriod,
    location: settings.location,
    atmosphere: settings.atmosphere,
    protagonistGender: settings.protagonistGender,
    partnerGender: settings.partnerGender,
    relationship: settings.relationship,
    writingTone: settings.writingTone,
    length: settings.length,
    settingDescription: settings.settingDescription,
    protagonistDescription: settings.protagonistDescription,
    loveInterestDescription: settings.loveInterestDescription,
    explicitLevel: settings.explicitLevel
  });
  let cleanedContent = content;
  if (typeof content === "string" && content.trim().startsWith("{") && content.includes('"content"')) {
    try {
      const contentJson = JSON.parse(content);
      if (contentJson.content) {
        cleanedContent = contentJson.content;
        console.log("Extracted content from JSON response");
      }
    } catch (e) {
      console.log("Content is not valid JSON, using as-is");
    }
  }
  let chapterTitle = "The Beginning";
  let chapterSummary = "";
  try {
    chapterTitle = await generateChapterTitle(cleanedContent, 1);
    chapterSummary = await generateChapterSummary(cleanedContent, 1);
  } catch (error) {
    console.error("Failed to generate chapter metadata, using defaults:", error);
  }
  const firstChapter = {
    number: 1,
    title: chapterTitle,
    content: cleanedContent,
    summary: chapterSummary,
    createdAt: /* @__PURE__ */ new Date(),
    wordCount: cleanedContent.split(" ").length,
    creditsCost: STORY_GENERATION_COST
  };
  const story = new Story({
    title: title || generatedTitle,
    content: cleanedContent,
    // Keep for backward compatibility
    userId,
    settings,
    isPublic,
    category,
    chapters: [firstChapter],
    currentChapter: 1,
    totalChapters: 1,
    isChapterBased: true
  });
  await story.save();
  user.stories.push(story._id);
  await user.save();
  if (user.stories.length === 1) {
    await awardBadge(userId, "First Story");
  }
  try {
    console.log(`Will generate audio for story ${story._id} with voice ${settings.narrationVoice} (ID: ${settings.narrationVoiceId})`);
  } catch (audioError) {
    console.error("Error scheduling audio generation:", audioError);
  }
  return story;
};
var continueStoryService = async (id, selectedChoice) => {
  const story = await Story.findById(id);
  if (!story) {
    throw new Error("Story not found");
  }
  const user = await User.findById(story.userId);
  if (!user) {
    throw new Error("User not found");
  }
  const CONTINUATION_COST = 1;
  if (user.credits < CONTINUATION_COST) {
    throw new Error(`Insufficient credits. Continuing this story requires ${CONTINUATION_COST} credit, but you only have ${user.credits} credits available. Please purchase additional credits or upgrade to premium.`);
  }
  user.credits -= CONTINUATION_COST;
  await user.save();
  try {
    console.log(`Continuing story ${id}`);
    let currentContent = "";
    if (story.isChapterBased && story.chapters.length > 0) {
      currentContent = story.chapters.map((ch) => ch.content).join("\n\n");
    } else {
      currentContent = story.content || "";
    }
    console.log(`Current content length: ${currentContent.length} characters`);
    const continuation = await continueStory(
      currentContent,
      story.settings,
      selectedChoice
    );
    const nextChapterNumber = story.isChapterBased ? story.chapters.length + 1 : 2;
    let chapterTitle = `Chapter ${nextChapterNumber}`;
    let chapterSummary = "";
    try {
      chapterTitle = await generateChapterTitle(continuation, nextChapterNumber);
      chapterSummary = await generateChapterSummary(continuation, nextChapterNumber);
    } catch (error) {
      console.error("Failed to generate chapter metadata, using defaults:", error);
    }
    let choices = [];
    try {
      choices = await generateChoices(continuation);
    } catch (error) {
      console.error("Failed to generate choices for new chapter:", error);
    }
    const newChapter = {
      number: nextChapterNumber,
      title: chapterTitle,
      content: continuation,
      summary: chapterSummary,
      createdAt: /* @__PURE__ */ new Date(),
      wordCount: continuation.split(" ").length,
      creditsCost: CONTINUATION_COST,
      choices
      // Add generated choices to the new chapter
    };
    if (story.isChapterBased) {
      story.chapters.push(newChapter);
    } else {
      let firstChapterTitle = "The Beginning";
      let firstChapterSummary = "";
      try {
        if (story.content) {
          firstChapterTitle = await generateChapterTitle(story.content, 1);
          firstChapterSummary = await generateChapterSummary(story.content, 1);
        }
      } catch (error) {
        console.error("Failed to generate metadata for legacy chapter:", error);
      }
      const firstChapter = {
        number: 1,
        title: firstChapterTitle,
        content: story.content || "",
        summary: firstChapterSummary,
        createdAt: story.createdAt,
        wordCount: story.content ? story.content.split(" ").length : 0,
        creditsCost: story.creditsCost
      };
      story.chapters = [firstChapter, newChapter];
      story.isChapterBased = true;
    }
    story.currentChapter = nextChapterNumber;
    story.totalChapters = story.chapters.length;
    story.content = story.chapters.map((ch) => ch.content).join("\n\n");
    console.log(`New chapter added: ${continuation.length} characters`);
    console.log(`Total chapters: ${story.chapters.length}`);
    await story.save();
    return story;
  } catch (error) {
    user.credits += CONTINUATION_COST;
    await user.save();
    throw error;
  }
};
var getStory = async (id) => {
  const story = await Story.findById(id);
  return story;
};
var deleteStory = async (id, userId) => {
  const story = await Story.findByIdAndDelete(id);
  if (!story) {
    throw new Error("Story not found");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  user.stories = user.stories.filter((storyId) => storyId.toString() !== id);
  await user.save();
  return story;
};

// shared/schema.ts
import { z } from "zod";
var storySettingsSchema = z.object({
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
var userSchema2 = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  role: z.enum(["admin", "user"]),
  isPremium: z.boolean().default(false),
  credits: z.number().default(10),
  stories: z.array(z.string()).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  subscription: z.enum(["free", "pro"]).default("free"),
  authProvider: z.enum(["local", "google"]).default("local")
});
var insertUserSchema = userSchema2.omit({ id: true });
var choiceSchema = z.object({
  text: z.string(),
  outcome: z.string().optional()
  // Outcome can be a prompt for the next chapter or a reference
});
var chapterSchema2 = z.object({
  number: z.number(),
  title: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  audioUrl: z.string().optional(),
  createdAt: z.date().optional(),
  wordCount: z.number().optional(),
  creditsCost: z.number().default(1),
  choices: z.array(choiceSchema).optional()
  // Add choices to chapter schema
});
var storySchema2 = z.object({
  _id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  // Keep for backward compatibility
  audioUrl: z.string().optional(),
  userId: z.string(),
  settings: z.object(storySettingsSchema.shape).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isPublic: z.boolean().default(true),
  imageUrl: z.string().optional(),
  likes: z.number().default(0),
  plays: z.number().default(0),
  category: z.string().default("romance"),
  creditsCost: z.number().default(1),
  chapters: z.array(chapterSchema2).default([]),
  currentChapter: z.number().default(1),
  totalChapters: z.number().default(1),
  isChapterBased: z.boolean().default(false),
  isPremiumContent: z.boolean().default(false),
  accessType: z.enum(["public", "premium_early_access", "premium_exclusive"]).default("public"),
  premiumAccessDate: z.date().optional(),
  publicReleaseDate: z.date().optional()
});
var insertStorySchema = storySchema2.omit({ _id: true });
var commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  userId: z.string(),
  storyId: z.string(),
  createdAt: z.date().optional(),
  userName: z.string().optional()
});
var insertCommentSchema = commentSchema.omit({ id: true });
var voiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  gender: z.string().optional(),
  accent: z.string().optional(),
  previewUrl: z.string().optional(),
  category: z.string().default("standard")
});
var insertVoiceSchema = voiceSchema.omit({ id: true });

// server/controllers/story.controller.ts
import { z as z2 } from "zod";
import path2 from "path";
import fs2 from "fs";

// server/services/subscription.service.ts
init_plans();
async function trackStoryGeneration(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  if (!user.usageThisMonth) {
    user.usageThisMonth = {
      storiesGenerated: 1,
      audioCreditsUsed: 0,
      lastResetDate: /* @__PURE__ */ new Date()
    };
  } else {
    user.usageThisMonth.storiesGenerated += 1;
  }
  await user.save();
}
async function trackAudioGeneration(userId, audioCredits) {
  const user = await User.findById(userId);
  if (!user) return;
  if (!user.usageThisMonth) {
    user.usageThisMonth = {
      storiesGenerated: 0,
      audioCreditsUsed: audioCredits,
      lastResetDate: /* @__PURE__ */ new Date()
    };
  } else {
    user.usageThisMonth.audioCreditsUsed += audioCredits;
  }
  await user.save();
}
async function canPerformAction(userId, actionType, params) {
  const user = await User.findById(userId);
  if (!user) {
    return {
      canProceed: false,
      message: "User not found"
    };
  }
  if (!user.usageThisMonth) {
    user.usageThisMonth = {
      storiesGenerated: 0,
      audioCreditsUsed: 0,
      lastResetDate: /* @__PURE__ */ new Date()
    };
    await user.save();
  }
  await checkAndResetMonthlyUsage(user);
  const subscriptionType = user.subscription;
  let limitReached = false;
  let limitType = "";
  const usage = user.usageThisMonth || {
    storiesGenerated: 0,
    audioCreditsUsed: 0,
    lastResetDate: /* @__PURE__ */ new Date()
  };
  if (actionType === "generateStory") {
    limitReached = hasReachedLimit({
      storiesGenerated: usage.storiesGenerated,
      audioCreditsUsed: usage.audioCreditsUsed
    }, subscriptionType, "stories");
    limitType = "story generation";
  } else if (actionType === "generateAudio") {
    const audioCredits = params?.audioCredits || 0;
    const limits = getUserLimits(subscriptionType);
    const remainingCredits = limits.audioCredits - usage.audioCreditsUsed;
    if (audioCredits > remainingCredits) {
      limitReached = true;
      limitType = "audio generation";
    }
  }
  if (limitReached) {
    let requiredCredits = 0;
    if (actionType === "generateStory") {
      requiredCredits = getActionCreditCost("generateStory", { storyLength: params?.storyLength });
    } else if (actionType === "generateAudio" && params?.audioCredits) {
      requiredCredits = getActionCreditCost("generateAudio", { minutes: params.audioCredits });
    }
    if (user.credits < requiredCredits) {
      return {
        canProceed: false,
        message: `You've reached your monthly ${limitType} limit and don't have enough credits. You need ${requiredCredits} credits to continue.`,
        requiredCredits,
        currentCredits: user.credits,
        subscriptionLimitReached: true
      };
    }
    return {
      canProceed: true,
      message: `You've reached your monthly ${limitType} limit. ${requiredCredits} credits will be deducted from your account.`,
      requiredCredits,
      currentCredits: user.credits,
      subscriptionLimitReached: true
    };
  }
  return { canProceed: true };
}
async function deductCredits(userId, credits) {
  const user = await User.findById(userId);
  if (!user || user.credits < credits) {
    return false;
  }
  user.credits -= credits;
  await user.save();
  return true;
}
async function checkAndResetMonthlyUsage(user) {
  if (!user.usageThisMonth || !user.usageThisMonth.lastResetDate) {
    user.usageThisMonth = {
      storiesGenerated: 0,
      audioCreditsUsed: 0,
      lastResetDate: /* @__PURE__ */ new Date()
    };
    await user.save();
    return;
  }
  const lastResetDate = new Date(user.usageThisMonth.lastResetDate);
  const currentDate = /* @__PURE__ */ new Date();
  if (lastResetDate.getMonth() !== currentDate.getMonth() || lastResetDate.getFullYear() !== currentDate.getFullYear()) {
    user.usageThisMonth = {
      storiesGenerated: 0,
      audioCreditsUsed: 0,
      lastResetDate: currentDate
    };
    await user.save();
  }
}

// server/controllers/story.controller.ts
var createStory2 = async (req, res) => {
  try {
    const settingsSchema = z2.object({
      title: z2.string().min(1, "Title is required"),
      settings: storySettingsSchema,
      maxTokens: z2.number().optional(),
      isPublic: z2.boolean().optional().default(false),
      category: z2.string().optional().default("romance")
    });
    const { title, settings, maxTokens, isPublic, category } = settingsSchema.parse(req.body);
    const userId = req.session.userId;
    if (!userId) {
      throw new Error("User not found");
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const storyLength = settings.length;
    const actionCheck = await canPerformAction(userId, "generateStory", { storyLength });
    if (!actionCheck.canProceed) {
      return res.status(403).json({
        message: actionCheck.message || "You've reached your story generation limit",
        code: actionCheck.subscriptionLimitReached ? "SUBSCRIPTION_LIMIT_REACHED" : "INSUFFICIENT_CREDITS",
        requiredCredits: actionCheck.requiredCredits,
        currentCredits: actionCheck.currentCredits,
        isPremiumRequired: actionCheck.subscriptionLimitReached
      });
    }
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
      const story = await createStory(title, settings, maxTokens, userId, isPublic, category);
      await trackStoryGeneration(userId);
      res.status(201).json(story);
    } catch (storyGenError) {
      console.error("Error in story generation service:", storyGenError);
      if (actionCheck.subscriptionLimitReached && actionCheck.requiredCredits) {
        await User.findByIdAndUpdate(userId, { $inc: { credits: actionCheck.requiredCredits } });
        console.log(`Refunded ${actionCheck.requiredCredits} credits to user ${userId} due to story generation failure`);
      }
      throw storyGenError;
    }
  } catch (error) {
    console.error("Error creating story:", error);
    if (error instanceof z2.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
        code: "VALIDATION_ERROR"
      });
    }
    if (error instanceof Error && error.message.includes("Insufficient credits")) {
      return res.status(402).json({
        message: error.message,
        code: "INSUFFICIENT_CREDITS",
        isPremiumRequired: false
      });
    }
    if (error instanceof Error && error.message.includes("Free users can only create 3 stories")) {
      return res.status(403).json({
        message: "You don't have enough credits to generate this story. Please purchase additional credits or upgrade to premium.",
        code: "INSUFFICIENT_CREDITS",
        isPremiumRequired: false
      });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return res.status(402).json({
        message: "You don't have enough credits to generate a story. Please purchase more credits.",
        code: "INSUFFICIENT_CREDITS"
      });
    }
    if (error instanceof Error && (error.message.includes("API key") || error.message.includes("api key") || error.message.includes("check your API keys"))) {
      return res.status(503).json({
        message: "External content generation service unavailable. Please try again later.",
        code: "API_SERVICE_ERROR"
      });
    }
    res.status(500).json({
      message: "Failed to create story",
      details: error instanceof Error ? error.message : "Unknown error",
      code: "STORY_GENERATION_FAILED"
    });
  }
};
var getStory2 = async (req, res) => {
  const { id } = req.params;
  try {
    const story = await getStory(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.content && typeof story.content === "string") {
      if (story.content.trim().startsWith("{") && story.content.includes('"content"')) {
        try {
          const contentObj = JSON.parse(story.content);
          if (contentObj.content) {
            story.content = contentObj.content;
            console.log(`Cleaned JSON formatted content for story ${id}`);
            await Story.findByIdAndUpdate(id, { content: story.content });
          }
        } catch (e) {
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
var getStoryAudio = async (req, res) => {
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
    const filePath = path2.join(process.cwd(), "dist", "public", story.audioUrl.replace(/^\//, ""));
    if (!fs2.existsSync(filePath)) {
      console.error(`Audio file not found at path: ${filePath}`);
      return res.status(200).json({
        message: "Audio file not found. Try generating it again.",
        audioUrl: null
      });
    }
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
var continueStory2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedChoice } = req.body;
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const existingStory = await Story.findById(id);
    if (!existingStory) {
      return res.status(404).json({ message: "Story not found" });
    }
    const storyLength = existingStory.settings?.length || 3;
    const continuedStory = await continueStoryService(id, selectedChoice);
    res.status(200).json(continuedStory);
  } catch (error) {
    console.error("Error continuing story:", error);
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
var updateStory = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const story = await storage.updateStoryContent(id, content);
  res.status(200).json(story);
};
var deleteStory2 = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const story = deleteStory(id, userId);
  res.status(200).json({ message: "Story deleted successfully", story });
};
var titleSuggestions = async (req, res) => {
  try {
    const { content } = z2.object({ content: z2.string() }).parse(req.body);
    const titles = await generateTitleSuggestions(content);
    res.json(titles);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate title suggestions" });
  }
};
var getStoryChapters = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.isChapterBased && story.chapters.length > 0) {
      res.status(200).json({ chapters: story.chapters });
    } else if (story.content) {
      const chapter = {
        number: 1,
        title: "Chapter 1",
        content: story.content,
        audioUrl: story.audioUrl,
        createdAt: story.createdAt,
        wordCount: story.content.split(" ").length,
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
var getStoryChapter = async (req, res) => {
  try {
    const { id, chapterNumber } = req.params;
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    const chapterNum = parseInt(chapterNumber);
    if (story.isChapterBased && story.chapters.length > 0) {
      const chapter = story.chapters.find((ch) => ch.number === chapterNum);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.status(200).json({ chapter });
    } else if (chapterNum === 1 && story.content) {
      const chapter = {
        number: 1,
        title: "Chapter 1",
        content: story.content,
        audioUrl: story.audioUrl,
        createdAt: story.createdAt,
        wordCount: story.content.split(" ").length,
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
var getChapterChoices = async (req, res) => {
  try {
    const { id, chapterNumber } = req.params;
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    const chapterNum = parseInt(chapterNumber);
    const chapter = story.chapters.find((ch) => ch.number === chapterNum);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    res.status(200).json({ choices: chapter.choices || [] });
  } catch (error) {
    console.error("Error getting chapter choices:", error);
    res.status(500).json({ message: "Failed to get chapter choices" });
  }
};
var likeStory = async (req, res) => {
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
    story.likes = (story.likes || 0) + 1;
    await story.save();
    res.status(200).json({ message: "Story liked successfully", likes: story.likes });
  } catch (error) {
    console.error("Error liking story:", error);
    res.status(500).json({ message: "Failed to like story" });
  }
};
var upvoteStory = async (req, res) => {
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
    story.upvotes = (story.upvotes || 0) + 1;
    await story.save();
    res.status(200).json({ message: "Story upvoted successfully", upvotes: story.upvotes });
  } catch (error) {
    console.error("Error upvoting story:", error);
    res.status(500).json({ message: "Failed to upvote story" });
  }
};
var downvoteStory = async (req, res) => {
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
    story.downvotes = (story.downvotes || 0) + 1;
    await story.save();
    res.status(200).json({ message: "Story downvoted successfully", downvotes: story.downvotes });
  } catch (error) {
    console.error("Error downvoting story:", error);
    res.status(500).json({ message: "Failed to downvote story" });
  }
};

// server/routes/story.route.ts
function determineVoiceGender(voiceName, labels) {
  if (labels && labels.gender && (labels.gender.toLowerCase() === "male" || labels.gender.toLowerCase() === "female")) {
    return labels.gender.toLowerCase();
  }
  const maleNames = [
    "adam",
    "josh",
    "thomas",
    "charlie",
    "james",
    "matthew",
    "daniel",
    "michael",
    "david",
    "william",
    "joseph",
    "chris",
    "george",
    "robert",
    "jack",
    "john",
    "henry",
    "jacob",
    "sam",
    "samuel",
    "tom",
    "callum",
    "harry",
    "oliver",
    "peter",
    "will",
    "liam",
    "lucas"
  ];
  const femaleNames = [
    "rachel",
    "sarah",
    "emily",
    "bella",
    "domi",
    "charlotte",
    "olivia",
    "emma",
    "ava",
    "sophia",
    "isabella",
    "mia",
    "amelia",
    "alice",
    "lily",
    "grace",
    "chloe",
    "jessica",
    "sophia",
    "amy",
    "katie",
    "susan",
    "jennifer",
    "elizabeth",
    "mary",
    "kathy",
    "matilda",
    "river"
  ];
  const normalizedName = voiceName.toLowerCase().trim();
  const firstNamePart = normalizedName.split(" ")[0];
  if (normalizedName.includes("female") || normalizedName.includes("woman")) {
    return "female";
  }
  if (normalizedName.includes("male") || normalizedName.includes("man")) {
    return "male";
  }
  if (maleNames.includes(firstNamePart)) {
    return "male";
  }
  if (femaleNames.includes(firstNamePart)) {
    return "female";
  }
  if (/\b(mr|sir|guy|boy|bro|dude)\b/.test(normalizedName)) {
    return "male";
  }
  if (/\b(mrs|ms|miss|lady|girl|sis)\b/.test(normalizedName)) {
    return "female";
  }
  if (normalizedName === "river") {
    return "female";
  }
  return "unknown";
}
var router2 = Router2();
router2.get("/voice-options", async (req, res) => {
  try {
    const voices = await elevenlabs.getVoices();
    const mappedVoices = voices.map((voice) => {
      const nameParts = voice.name.match(/^(.*?)(?:\s*\((.*?)\))?$/);
      const cleanName = nameParts ? nameParts[1].trim() : voice.name;
      const description = nameParts && nameParts[2] ? nameParts[2].trim() : "";
      const isFree = voice.category === "premade";
      return {
        id: voice.voice_id,
        name: cleanName,
        fullName: voice.name,
        category: voice.category,
        isPremium: !isFree,
        description: description || voice.labels && voice.labels.description || "",
        labels: {
          ...voice.labels,
          // Add some defaults if missing with improved gender detection
          gender: determineVoiceGender(voice.name, voice.labels),
          accent: voice.labels && voice.labels.accent || "neutral",
          age: voice.labels && voice.labels.age || "adult",
          style: voice.labels && voice.labels.style || "natural"
        },
        preview_url: voice.preview_url || ""
      };
    });
    console.log(`Returning ${mappedVoices.length} voice options with enhanced details`);
    res.json(mappedVoices);
  } catch (error) {
    console.error("Error fetching voice options:", error);
    res.status(500).json({ message: "Failed to fetch voice options" });
  }
});
router2.route("/generate").post(authMiddleware, createStory2);
router2.route("/title-suggestions").post(authMiddleware, titleSuggestions);
router2.get("/public", async (req, res) => {
  try {
    const currentDate = /* @__PURE__ */ new Date();
    const publicStories = await Story.find({
      $or: [
        { accessType: "public" },
        { accessType: "premium_early_access", publicReleaseDate: { $lte: currentDate } }
      ]
    }).sort({ createdAt: -1 }).limit(12);
    const storiesWithUserNames = await Promise.all(
      publicStories.map(async (story) => {
        try {
          if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
            const user = await User.findById(story.userId).select("name badges");
            return {
              ...story.toObject(),
              userName: user ? user.name : "Anonymous",
              authorBadges: user ? user.badges : []
            };
          } else {
            return {
              ...story.toObject(),
              userName: "Anonymous",
              authorBadges: []
            };
          }
        } catch (err) {
          return {
            ...story.toObject(),
            userName: "Anonymous",
            authorBadges: []
          };
        }
      })
    );
    res.json(storiesWithUserNames);
  } catch (error) {
    console.error("Error fetching public stories:", error);
    res.status(500).json({ message: "Failed to fetch public stories" });
  }
});
router2.get("/by-category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }
    let query = { isPublic: true };
    switch (category) {
      case "romance":
        query = {
          isPublic: true,
          $or: [
            { category: "romance" },
            { "settings.atmosphere": "Romantic" },
            { "settings.writingTone": "Romantic" }
          ]
        };
        break;
      case "fantasy":
        query = {
          isPublic: true,
          $or: [
            { category: "fantasy" },
            { "settings.timePeriod": "Fantasy Realm" }
          ]
        };
        break;
      case "historical":
        query = {
          isPublic: true,
          $or: [
            { category: "historical" },
            { "settings.timePeriod": { $in: ["Medieval", "Victorian"] } }
          ]
        };
        break;
      case "contemporary":
        query = {
          isPublic: true,
          $or: [
            { category: "contemporary" },
            { "settings.timePeriod": "Contemporary" }
          ]
        };
        break;
      case "adventure":
        query = {
          isPublic: true,
          $or: [
            { category: "adventure" },
            { "settings.atmosphere": "Mysterious" }
          ]
        };
        break;
      case "passionate":
        query = {
          isPublic: true,
          $or: [
            { category: "passionate" },
            { "settings.writingTone": "Passionate" }
          ]
        };
        break;
      case "playful":
        query = {
          isPublic: true,
          $or: [
            { category: "playful" },
            { "settings.writingTone": "Playful" }
          ]
        };
        break;
      case "intense":
        query = {
          isPublic: true,
          $or: [
            { category: "intense" },
            { "settings.writingTone": "Intense" }
          ]
        };
        break;
      default:
        query = { isPublic: true, category };
    }
    console.log(`Query for category ${category}:`, JSON.stringify(query));
    const categoryStories = await Story.find(query).sort({ createdAt: -1 }).limit(8);
    const storiesWithUserNames = await Promise.all(
      categoryStories.map(async (story) => {
        try {
          if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
            const user = await User.findById(story.userId);
            return {
              ...story.toObject(),
              userName: user ? user.name : "Anonymous"
            };
          } else {
            return {
              ...story.toObject(),
              userName: "Anonymous"
            };
          }
        } catch (err) {
          return {
            ...story.toObject(),
            userName: "Anonymous"
          };
        }
      })
    );
    res.json(storiesWithUserNames);
  } catch (error) {
    console.error(`Error fetching stories for category:`, error);
    res.status(500).json({ message: "Failed to fetch stories by category" });
  }
});
router2.route("/:id").get(getStory2);
router2.route("/:id").put(authMiddleware, updateStory);
router2.route("/:id").delete(authMiddleware, deleteStory2);
router2.route("/:id/continue").post(authMiddleware, continueStory2);
router2.route("/:id/audio").get(getStoryAudio);
router2.route("/:id/chapters").get(getStoryChapters);
router2.route("/:id/chapters/:chapterNumber").get(getStoryChapter);
router2.route("/:id/chapters/:chapterNumber/choices").get(getChapterChoices);
router2.route("/:id/chapters/:chapterNumber/choice").post(authMiddleware, continueStory2);
router2.route("/:id/like").post(authMiddleware, likeStory);
router2.route("/:id/upvote").post(authMiddleware, upvoteStory);
router2.route("/:id/downvote").post(authMiddleware, downvoteStory);
router2.get("/premium-stories", authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    if (!user || !user.isPremium) {
      return res.status(403).json({ message: "Access denied. Premium subscription required." });
    }
    const currentDate = /* @__PURE__ */ new Date();
    const premiumStories = await Story.find({
      accessType: { $in: ["premium_early_access", "premium_exclusive"] },
      premiumAccessDate: { $lte: currentDate }
    }).sort({ createdAt: -1 }).limit(20);
    const storiesWithUserNames = await Promise.all(
      premiumStories.map(async (story) => {
        try {
          if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
            const author = await User.findById(story.userId).select("name badges");
            return {
              ...story.toObject(),
              userName: author ? author.name : "Anonymous",
              authorBadges: author ? author.badges : []
            };
          } else {
            return {
              ...story.toObject(),
              userName: "Anonymous",
              authorBadges: []
            };
          }
        } catch (err) {
          return {
            ...story.toObject(),
            userName: "Anonymous",
            authorBadges: []
          };
        }
      })
    );
    res.json(storiesWithUserNames);
  } catch (error) {
    console.error("Error fetching premium stories:", error);
    res.status(500).json({ message: "Failed to fetch premium stories" });
  }
});
router2.patch("/:id/visibility", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.session.userId;
    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ message: "Invalid visibility status" });
    }
    if (!isPublic) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.isPremium) {
        return res.status(403).json({
          message: "Only premium users can set stories to private",
          code: "PREMIUM_REQUIRED",
          isPremiumRequired: true
        });
      }
    }
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to update this story" });
    }
    story.isPublic = isPublic;
    await story.save();
    res.json(story);
  } catch (error) {
    console.error("Error updating story visibility:", error);
    res.status(500).json({ message: "Failed to update story visibility" });
  }
});
var story_route_default = router2;

// server/routes/admin.route.ts
import { Router as Router3 } from "express";
import { hash } from "bcrypt";
var router3 = Router3();
router3.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});
router3.get("/users/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});
router3.post("/users", isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, isPremium } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isPremium: isPremium || false
    });
    await newUser.save();
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});
router3.patch("/users/:id", isAdmin, async (req, res) => {
  try {
    const { name, email, role, isPremium } = req.body;
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isPremium !== "undefined") user.isPremium = isPremium;
    await user.save();
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});
router3.delete("/users/:id", isAdmin, async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    await Story.deleteMany({ userId: req.params.id });
    res.json({ message: "User and associated stories deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});
router3.get("/stories", isAdmin, async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    const enhancedStories = await Promise.all(stories.map(async (story) => {
      const user = await User.findById(story.userId).select("name");
      const storyObj = story.toObject();
      storyObj.userName = user ? user.name : "Unknown User";
      return storyObj;
    }));
    res.json(enhancedStories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});
router3.patch("/stories/:id/visibility", isAdmin, async (req, res) => {
  try {
    const { isPublic } = req.body;
    const storyId = req.params.id;
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    story.isPublic = isPublic;
    await story.save();
    res.json(story);
  } catch (error) {
    console.error("Error updating story visibility:", error);
    res.status(500).json({ message: "Failed to update story visibility" });
  }
});
router3.delete("/stories/:id", isAdmin, async (req, res) => {
  try {
    const result = await Story.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Story not found" });
    }
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ message: "Failed to delete story" });
  }
});
router3.post("/award-top-author", isAdmin, async (req, res) => {
  try {
    await checkAndAwardTopAuthor();
    res.json({ message: "Top author check and award initiated." });
  } catch (error) {
    console.error("Error awarding top author:", error);
    res.status(500).json({ message: "Failed to award top author." });
  }
});
var admin_route_default = router3;

// server/routes/user.route.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.use(authMiddleware);
router4.get("/stories", async (req, res) => {
  try {
    const userId = req.session.userId;
    const stories = await Story.find({ userId }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    console.error("Error fetching user stories:", error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});
router4.patch("/stories/:id/visibility", async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.session.userId;
    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ message: "Invalid visibility status" });
    }
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to update this story" });
    }
    story.isPublic = isPublic;
    await story.save();
    res.json(story);
  } catch (error) {
    console.error("Error updating story visibility:", error);
    res.status(500).json({ message: "Failed to update story visibility" });
  }
});
router4.delete("/stories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to delete this story" });
    }
    await Story.findByIdAndDelete(id);
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ message: "Failed to delete story" });
  }
});
var user_route_default = router4;

// server/routes/payment.route.ts
import { Router as Router5 } from "express";

// server/config/stripe.ts
import Stripe from "stripe";
import dotenv5 from "dotenv";
dotenv5.config();
var stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("CRITICAL ERROR: Missing STRIPE_SECRET_KEY environment variable.");
  throw new Error("Stripe secret key is required for payment processing. Please provide a valid STRIPE_SECRET_KEY in your environment variables.");
}
var stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16"
  // Use compatible API version
});
var stripe_default = stripe;

// server/routes/payment.route.ts
import { z as z3 } from "zod";
var router5 = Router5();
router5.post("/create-checkout-session", authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const schema = z3.object({
      plan: z3.enum(["standard", "premium"]).default("standard")
    });
    const { plan } = schema.parse(req.body);
    const { SUBSCRIPTION_PLANS: SUBSCRIPTION_PLANS2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
    const planPrice = SUBSCRIPTION_PLANS2[plan].price;
    const origin = req.headers.origin || "https://" + req.headers.host;
    const session2 = await stripe_default.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            // Using Euro as per requirements
            product_data: {
              name: `${SUBSCRIPTION_PLANS2[plan].name} Subscription`,
              description: SUBSCRIPTION_PLANS2[plan].description
            },
            unit_amount: planPrice
          },
          quantity: 1
        }
      ],
      mode: "payment",
      // For simplicity using one-time payments; in production use 'subscription'
      customer_email: user.email,
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/payment/cancel`,
      metadata: {
        userId,
        plan,
        type: "subscription_purchase"
      }
    });
    res.json({ id: session2.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});
router5.get("/success", async (req, res) => {
  try {
    const { session_id, plan } = req.query;
    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }
    const subscriptionPlan = typeof plan === "string" ? plan : "standard";
    const { SUBSCRIPTION_PLANS: SUBSCRIPTION_PLANS2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
    if (!["standard", "premium"].includes(subscriptionPlan)) {
      return res.status(400).json({ success: false, message: "Invalid subscription plan" });
    }
    try {
      const session2 = await stripe_default.checkout.sessions.retrieve(session_id);
      if (session2.payment_status === "paid" || session2.status === "complete") {
        const userId2 = req.session.userId || session2.metadata?.userId;
        const purchasedPlan = session2.metadata?.plan || subscriptionPlan;
        if (userId2) {
          const user = await User.findById(userId2);
          if (user) {
            user.isPremium = true;
            user.subscription = purchasedPlan;
            let creditsToAdd = 0;
            switch (purchasedPlan) {
              case "standard":
                creditsToAdd = 50;
                break;
              case "premium":
                creditsToAdd = 200;
                break;
              default:
                creditsToAdd = 0;
            }
            user.credits = (user.credits || 0) + creditsToAdd;
            user.usageThisMonth = {
              storiesGenerated: 0,
              chaptersGenerated: 0,
              audioMinutesUsed: 0,
              lastResetDate: /* @__PURE__ */ new Date()
            };
            await user.save({ validateBeforeSave: false });
            console.log(`User ${userId2} subscribed to ${purchasedPlan} plan via session: ${session_id}`);
            return res.status(200).json({
              success: true,
              message: `Successfully subscribed to ${purchasedPlan} plan!`,
              plan: purchasedPlan
            });
          }
        }
      }
    } catch (stripeError) {
      console.error("Error retrieving Stripe session:", stripeError);
    }
    const userId = req.session.userId;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.isPremium = true;
        user.subscription = subscriptionPlan;
        let creditsToAdd = 0;
        switch (subscriptionPlan) {
          case "standard":
            creditsToAdd = 50;
            break;
          case "premium":
            creditsToAdd = 200;
            break;
          default:
            creditsToAdd = 0;
        }
        user.credits = (user.credits || 0) + creditsToAdd;
        user.usageThisMonth = {
          storiesGenerated: 0,
          chaptersGenerated: 0,
          audioMinutesUsed: 0,
          lastResetDate: /* @__PURE__ */ new Date()
        };
        await user.save();
        console.log(`User ${userId} subscribed to ${subscriptionPlan} plan via direct session`);
        return res.status(200).json({
          success: true,
          message: `Successfully subscribed to ${subscriptionPlan} plan!`,
          plan: subscriptionPlan
        });
      }
    }
    return res.status(200).json({
      success: true,
      message: "Subscription successful!",
      plan: subscriptionPlan
    });
  } catch (error) {
    console.error("Error processing payment success:", error);
    res.status(500).json({ success: false, message: "Failed to process payment success" });
  }
});
router5.post("/create-credit-checkout", authMiddleware, async (req, res) => {
  try {
    const { CREDIT_PACKAGES: CREDIT_PACKAGES2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
    const schema = z3.object({
      packageId: z3.enum(["starter", "popular", "premium"]).default("popular")
    });
    const { packageId } = schema.parse(req.body);
    const selectedPackage = CREDIT_PACKAGES2[packageId];
    if (!selectedPackage) {
      return res.status(400).json({ message: "Invalid package ID" });
    }
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const priceInCents = selectedPackage.price;
    const origin = req.headers.origin || "https://" + req.headers.host;
    const clientReferenceId = `seduise_app_${userId}_${Date.now()}`;
    const session2 = await stripe_default.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            // Using Euro as per requirements
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits} credits - ${selectedPackage.description}`
            },
            unit_amount: priceInCents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      customer_email: user.email,
      client_reference_id: clientReferenceId,
      success_url: `${origin}/payment/credit-success?session_id={CHECKOUT_SESSION_ID}&credits=${selectedPackage.credits}&package=${packageId}`,
      cancel_url: `${origin}/credits`,
      metadata: {
        userId,
        packageId,
        credits: selectedPackage.credits.toString(),
        type: "credit_purchase"
      }
    });
    res.json({ id: session2.id });
  } catch (error) {
    console.error("Error creating credit checkout session:", error);
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});
router5.post("/credit-success", async (req, res) => {
  try {
    const session_id = req.query.session_id || req.query.CHECKOUT_SESSION_ID || req.body && req.body.session_id;
    const credits = req.query.credits || req.body && req.body.credits;
    const packageId = req.query.package || req.body && req.body.package;
    console.log("Credit success handler received:", {
      session_id,
      credits,
      packageId,
      method: req.method,
      query: req.query,
      body: req.body
    });
    if (!session_id) {
      console.log("No session_id found, checking if user is authenticated");
      if (req.session.userId) {
      } else {
        return res.status(200).json({
          success: true,
          message: "Credit purchase completed (demo mode)",
          demo: true
        });
      }
    }
    let creditsToAdd = parseInt(credits) || 0;
    if (creditsToAdd <= 0 && packageId) {
      const { CREDIT_PACKAGES: CREDIT_PACKAGES2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
      const packageKey = packageId;
      if (CREDIT_PACKAGES2[packageKey]) {
        creditsToAdd = CREDIT_PACKAGES2[packageKey].credits;
        console.log(`Using credits from package: ${packageKey} = ${creditsToAdd}`);
      }
    }
    if (creditsToAdd <= 0) {
      creditsToAdd = 50;
      console.log(`Using fallback credit amount: ${creditsToAdd}`);
    }
    const userId = req.session.userId;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.credits = (user.credits || 0) + creditsToAdd;
        await user.save();
        console.log(`Added ${creditsToAdd} credits to user ${userId}`);
        return res.status(200).json({
          success: true,
          message: "Credits added successfully!",
          credits: user.credits
        });
      }
    }
    return res.status(200).json({ success: true, message: "Credit purchase successful!" });
  } catch (error) {
    console.error("Error processing credit purchase:", error);
    res.status(500).json({ success: false, message: "Failed to process credit purchase" });
  }
});
router5.post("/update-credits", async (req, res) => {
  try {
    const { credits } = req.body;
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    if (!credits || isNaN(parseInt(credits))) {
      return res.status(400).json({ success: false, message: "Invalid credit amount" });
    }
    const creditsToAdd = parseInt(credits);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.credits = (user.credits || 0) + creditsToAdd;
    await user.save();
    console.log(`Added ${creditsToAdd} credits to user ${userId} via direct update`);
    return res.status(200).json({
      success: true,
      message: "Credits updated successfully",
      credits: user.credits
    });
  } catch (error) {
    console.error("Error updating credits:", error);
    res.status(500).json({ success: false, message: "Failed to update credits" });
  }
});
router5.get("/credit-success", async (req, res) => {
  try {
    const session_id = req.query.session_id || req.query.CHECKOUT_SESSION_ID;
    const credits = req.query.credits;
    const packageId = req.query.package;
    console.log("GET Credit success handler received:", {
      session_id,
      credits,
      packageId,
      query: req.query
    });
    if (session_id && typeof session_id === "string") {
      try {
        const session2 = await stripe_default.checkout.sessions.retrieve(session_id);
        console.log("Retrieved Stripe session:", {
          id: session2.id,
          status: session2.status,
          paymentStatus: session2.payment_status,
          metadata: session2.metadata
        });
        const isPaymentSuccessful = session2.payment_status === "paid" || // Special case: sometimes Stripe marks status as complete
        session2.status === "complete" && session2.payment_status !== "unpaid";
        if (isPaymentSuccessful) {
          console.log("Payment confirmed successful by Stripe");
          let userId = session2.metadata?.userId || req.session.userId;
          if (!userId && session2.client_reference_id) {
            const refParts = session2.client_reference_id.split("_");
            if (refParts.length >= 2 && refParts[0] === "user") {
              userId = refParts[1];
              console.log(`Extracted userId from client_reference_id: ${userId}`);
            }
          }
          if (!userId) {
            console.error("No user ID found in session or metadata");
            return res.status(400).json({
              success: false,
              message: "User identification failed. Please contact support."
            });
          }
          let creditsToAdd = 0;
          if (session2.metadata?.credits) {
            creditsToAdd = parseInt(session2.metadata.credits);
          } else if (credits) {
            creditsToAdd = parseInt(credits);
          } else if (packageId || session2.metadata?.packageId) {
            const pkgId = packageId || session2.metadata?.packageId;
            const { CREDIT_PACKAGES: CREDIT_PACKAGES2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
            const packageKey = pkgId;
            if (CREDIT_PACKAGES2[packageKey]) {
              creditsToAdd = CREDIT_PACKAGES2[packageKey].credits;
            }
          }
          if (creditsToAdd <= 0) {
            creditsToAdd = 20;
            console.warn("Using fallback credit amount due to missing information");
          }
          const user = await User.findById(userId);
          if (!user) {
            console.error(`User ${userId} not found`);
            return res.status(404).json({
              success: false,
              message: "User not found. Please contact support."
            });
          }
          const previousCredits = user.credits || 0;
          user.credits = previousCredits + creditsToAdd;
          await user.save();
          console.log(`Added ${creditsToAdd} credits to user ${userId} (previous: ${previousCredits}, new: ${user.credits})`);
          return res.status(200).json({
            success: true,
            message: "Payment successful and credits added",
            credits: creditsToAdd,
            totalCredits: user.credits
          });
        } else {
          console.warn(`Payment not completed: status=${session2.status}, payment_status=${session2.payment_status}`);
          return res.status(402).json({
            success: false,
            message: "Payment not completed. Please complete the payment and try again."
          });
        }
      } catch (stripeError) {
        console.error("Error retrieving Stripe session:", stripeError);
        return res.status(500).json({
          success: false,
          message: "Error verifying payment. Please contact support."
        });
      }
    } else {
      console.error("No valid session ID provided");
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }
  } catch (error) {
    console.error("Error processing credit success:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please contact support."
    });
  }
});
router5.post("/webhook", async (req, res) => {
  console.log(`Webhook received [${(/* @__PURE__ */ new Date()).toISOString()}]`);
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    console.error("Webhook Error: No stripe-signature header provided");
    return res.status(400).send("Webhook Error: No signature provided");
  }
  console.log(`Stripe signature received: ${signature.substring(0, 20)}...`);
  let event;
  try {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      console.warn("Webhook secret not configured - operating in development mode");
      event = {
        type: "checkout.session.completed",
        data: { object: req.body },
        id: "dev_" + Date.now()
      };
      console.log("Created development webhook event:", event.id);
    } else {
      console.log("Constructing webhook event with signature verification");
      event = stripe_default.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
      console.log(`Webhook verified: ${event.id} [${event.type}]`);
    }
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session2 = event.data.object;
    console.log("Processing completed checkout session:", {
      id: session2.id,
      status: session2.status,
      payment_status: session2.payment_status,
      client_reference_id: session2.client_reference_id,
      metadata: session2.metadata
    });
    const isPaymentSuccessful = session2.payment_status === "paid" || session2.status === "complete" && session2.payment_status !== "unpaid";
    if (!isPaymentSuccessful) {
      console.warn(`Webhook received for incomplete payment: status=${session2.status}, payment_status=${session2.payment_status}`);
      return res.status(400).send("Payment not completed");
    }
    let userId = session2.metadata?.userId;
    if (!userId && session2.client_reference_id) {
      const refParts = session2.client_reference_id.split("_");
      if (refParts.length >= 2 && refParts[0] === "user") {
        userId = refParts[1];
        console.log(`Extracted userId from client_reference_id: ${userId}`);
      }
    }
    if (!userId) {
      console.error("User ID not found in session metadata or client reference");
      return res.status(400).send("User ID not found in session data");
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User ${userId} not found`);
        return res.status(404).send("User not found");
      }
      const purchaseType = session2.metadata?.type;
      if (purchaseType === "credit_purchase") {
        const creditsToAdd = parseInt(session2.metadata?.credits || "0");
        if (creditsToAdd > 0) {
          user.credits = (user.credits || 0) + creditsToAdd;
          await user.save();
          console.log(`Added ${creditsToAdd} credits to user ${userId}`);
        } else {
          console.error("Invalid credit amount");
        }
      } else if (purchaseType === "subscription_purchase") {
        const plan = session2.metadata?.plan || "passion";
        if (!["essential", "passion", "escape"].includes(plan)) {
          console.error("Invalid subscription plan:", plan);
          return res.status(400).send("Invalid subscription plan");
        }
        user.isPremium = true;
        user.subscription = plan;
        let creditsToAdd = 0;
        switch (plan) {
          case "standard":
            creditsToAdd = 50;
            break;
          case "premium":
            creditsToAdd = 200;
            break;
          default:
            creditsToAdd = 0;
        }
        user.credits = (user.credits || 0) + creditsToAdd;
        user.usageThisMonth = {
          storiesGenerated: 0,
          chaptersGenerated: 0,
          audioMinutesUsed: 0,
          lastResetDate: /* @__PURE__ */ new Date()
        };
        await user.save();
        console.log(`User ${userId} subscribed to ${plan} plan via webhook`);
      } else {
        console.log(`Unknown purchase type: ${purchaseType}`);
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).send("Error processing webhook");
    }
  }
  res.json({ received: true });
});
var payment_route_default = router5;

// server/routes.ts
import mongoose from "mongoose";
async function registerRoutes(app2) {
  app2.use("/api/auth", auth_route_default);
  app2.use("/api/stories", story_route_default);
  app2.use("/api/user", user_route_default);
  app2.use("/api/admin", admin_route_default);
  app2.use("/api/payment", payment_route_default);
  app2.get("/api/speech/voices", async (req, res) => {
    try {
      const voices = await elevenlabs.getVoices();
      const mappedVoices = voices.map((voice) => ({
        id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || "unknown",
        style: voice.labels?.accent || "neutral",
        isPremium: voice.category !== "premade"
      }));
      res.json(mappedVoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voices" });
    }
  });
  app2.get("/api/speech/test", async (req, res) => {
    try {
      console.log("Testing audio generation...");
      const sampleText = "This is a test audio file to verify voice generation.";
      const voiceId = "EXAVITQu4vr4xnSDxMaL";
      const audioUrl = await elevenlabs.textToSpeech({
        text: sampleText,
        voiceId
      });
      console.log(`Generated test audio URL: ${audioUrl}`);
      const testStory = new Story({
        title: "Audio Test Story",
        content: sampleText,
        audioUrl,
        userId: "test_user",
        settings: { narrationVoice: "Rachel" },
        isPublic: true
      });
      await testStory.save();
      console.log(`Saved test story with ID: ${testStory._id}`);
      res.json({
        success: true,
        message: "Test audio generated and saved to database",
        storyId: testStory._id,
        audioUrl
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
  app2.get("/audio-test", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Audio Playback Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .player { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          button { padding: 8px 16px; margin: 5px; cursor: pointer; }
          .status { margin: 10px 0; padding: 10px; border-radius: 4px; }
          .success { background-color: #d4edda; color: #155724; }
          .error { background-color: #f8d7da; color: #721c24; }
        </style>
      </head>
      <body>
        <h1>Audio Playback Test</h1>
        
        <div class="player">
          <h2>Test Generated Audio</h2>
          <div id="status"></div>
          <button id="fetch-btn">Fetch Latest Test Story</button>
          <div id="story-info"></div>
          <div id="player-container"></div>
        </div>
        
        <script>
          const fetchBtn = document.getElementById('fetch-btn');
          const statusDiv = document.getElementById('status');
          const storyInfoDiv = document.getElementById('story-info');
          const playerContainer = document.getElementById('player-container');
          
          fetchBtn.addEventListener('click', async () => {
            try {
              statusDiv.innerHTML = 'Fetching public stories...';
              statusDiv.className = 'status';
              
              // Fetch the latest public stories
              const response = await fetch('/api/stories/public');
              const stories = await response.json();
              
              if (stories && stories.length > 0) {
                // Use the latest story
                const story = stories[0];
                
                storyInfoDiv.innerHTML = \`
                  <h3>\${story.title}</h3>
                  <p>\${story.content}</p>
                  <p><strong>Story ID:</strong> \${story._id}</p>
                  <p><strong>Audio URL:</strong> \${story.audioUrl || 'None'}</p>
                \`;
                
                if (story.audioUrl) {
                  // Create audio player
                  playerContainer.innerHTML = \`
                    <h3>Audio Player</h3>
                    <audio controls src="\${story.audioUrl}" style="width: 100%"></audio>
                    <p>If audio doesn't play, <a href="\${story.audioUrl}" target="_blank">click here to download</a></p>
                  \`;
                  
                  statusDiv.innerHTML = 'Success! Story found with audio.';
                  statusDiv.className = 'status success';
                } else {
                  playerContainer.innerHTML = '<p>No audio available for this story</p>';
                  statusDiv.innerHTML = 'Story found but has no audio URL.';
                  statusDiv.className = 'status error';
                }
              } else {
                storyInfoDiv.innerHTML = '<p>No stories found</p>';
                playerContainer.innerHTML = '';
                statusDiv.innerHTML = 'No stories found in the database.';
                statusDiv.className = 'status error';
              }
            } catch (error) {
              console.error('Error fetching story:', error);
              statusDiv.innerHTML = \`Error: \${error.message}\`;
              statusDiv.className = 'status error';
            }
          });
        </script>
      </body>
      </html>
    `);
  });
  app2.post("/api/speech/generate", isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.subscription === "free") {
      return res.status(403).json({
        message: "Audio generation is not available on the Free plan. Please upgrade your subscription.",
        code: "PREMIUM_REQUIRED"
      });
    }
    let creditsDeducted = 0;
    try {
      const { text, voiceId, storyId } = z4.object({
        text: z4.string(),
        voiceId: z4.string(),
        storyId: z4.string().optional()
      }).parse(req.body);
      console.log(`Speech generation request received - Voice: ${voiceId}, Text length: ${text.length} chars, Story ID: ${storyId || "none"}`);
      const strippedText = text.replace(/\s+/g, "");
      if (!strippedText || strippedText.length < 10) {
        return res.status(400).json({
          message: "Text content is too short or contains only whitespace",
          error: "Invalid text content"
        });
      }
      let processedText = text;
      if (text.match(/^\s*title:\s*[^,\n]+,\s*content:/i)) {
        const contentMatch = text.match(/content:\s*([\s\S]+)$/i);
        if (contentMatch && contentMatch[1]) {
          processedText = contentMatch[1].trim();
        }
      }
      processedText = processedText.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\n{3,}/g, "\n\n").replace(/\s{3,}/g, " ").trim();
      const estimatedAudioLengthMinutes = Math.ceil(processedText.length / 750);
      const actionCheck = await canPerformAction(userId, "generateAudio", { audioLengthMinutes: estimatedAudioLengthMinutes });
      if (!actionCheck.canProceed) {
        return res.status(actionCheck.subscriptionLimitReached ? 403 : 402).json({
          message: actionCheck.message || "You've reached your audio generation limit",
          code: actionCheck.subscriptionLimitReached ? "SUBSCRIPTION_LIMIT_REACHED" : "INSUFFICIENT_CREDITS",
          requiredCredits: actionCheck.requiredCredits,
          currentCredits: actionCheck.currentCredits,
          isPremiumRequired: actionCheck.subscriptionLimitReached
        });
      }
      if (actionCheck.subscriptionLimitReached && actionCheck.requiredCredits) {
        const deducted = await deductCredits(userId, actionCheck.requiredCredits);
        if (!deducted) {
          return res.status(402).json({
            message: "Failed to deduct credits for audio generation",
            code: "PAYMENT_REQUIRED"
          });
        }
        creditsDeducted = actionCheck.requiredCredits;
      }
      let processedVoiceId = voiceId;
      if (voiceId === "George") {
        processedVoiceId = "VR6AewLTigWG4xSOukaG";
      } else if (voiceId === "Charlie") {
        processedVoiceId = "IKne3meq5aSn9XLyUdCD";
      } else if (voiceId === "Will") {
        processedVoiceId = "bIHbv24MWmeRgasZH58o";
      }
      const actualVoiceId = elevenlabs.getVoiceId(processedVoiceId);
      console.log(`Using ElevenLabs voice ID: ${actualVoiceId}`);
      console.log(`Processed text length: ${processedText.length} characters`);
      if (processedText.length > 4800) {
        console.log(`Warning: Text is very long (${processedText.length} chars), may be truncated by ElevenLabs API`);
      }
      try {
        if (!process.env.ELEVENLABS_API_KEY) {
          return res.status(401).json({
            message: "ElevenLabs API key is required for voice generation",
            error: "No API key configured",
            apiKeyIssue: true
          });
        }
        const audioUrl = await elevenlabs.textToSpeech({
          text: processedText,
          voiceId: actualVoiceId,
          model: "eleven_monolingual_v1",
          stability: 0.5,
          similarityBoost: 0.75
        });
        console.log(`Generated audio URL: ${audioUrl}`);
        const filePath = path3.join(process.cwd(), "dist", "public", audioUrl.replace(/^\//, ""));
        if (!fs3.existsSync(filePath)) {
          throw new Error("Generated audio file not found");
        }
        const fileStats = fs3.statSync(filePath);
        const fileSize = fileStats.size;
        const fileSizeInKB = fileSize / 1024;
        const isFallback = fileSizeInKB < 1;
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
        await trackAudioGeneration(userId, estimatedAudioLengthMinutes);
        res.json({
          audioUrl,
          fallback: isFallback,
          message: isFallback ? "Generated a fallback audio file. The text may be too complex or long for the TTS service." : void 0
        });
      } catch (error) {
        console.error("ElevenLabs API error during generation:", error);
        if (creditsDeducted > 0) {
          await deductCredits(userId, -creditsDeducted);
          console.log(`Refunded ${creditsDeducted} credits to user ${userId} due to audio generation failure.`);
        }
        if (error instanceof Error && (error.message.includes("401") || error.message.includes("Unauthorized") || error.message.includes("api-key") || error.message.includes("authentication"))) {
          return res.status(401).json({
            message: "Speech generation failed due to API authentication issues",
            error: "The ElevenLabs API key is invalid or has expired. Please update it with a valid key.",
            apiKeyIssue: true
          });
        }
        res.status(500).json({
          message: "Speech generation failed",
          error: error.message || "Unknown error",
          fallback: true
        });
      }
    } catch (error) {
      console.error("Error in speech generation request parsing/initial checks:", error);
      if (creditsDeducted > 0) {
        await deductCredits(userId, -creditsDeducted);
        console.log(`Refunded ${creditsDeducted} credits to user ${userId} due to pre-API generation failure.`);
      }
      if (error instanceof Error) {
        res.status(500).json({
          message: "Failed to generate speech",
          error: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0,
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
  app2.post("/api/speech/test", async (req, res) => {
    try {
      const { text, voiceId } = z4.object({
        text: z4.string(),
        voiceId: z4.string()
      }).parse(req.body);
      console.log(`Test speech generation - Voice: ${voiceId}, Text length: ${text.length} chars`);
      let processedVoiceId = voiceId;
      if (voiceId === "George") {
        console.log("Explicitly mapping George to Adam's deep male voice");
        processedVoiceId = "VR6AewLTigWG4xSOukaG";
      } else if (voiceId === "Charlie") {
        console.log("Explicitly mapping Charlie to Charlie's male voice");
        processedVoiceId = "IKne3meq5aSn9XLyUdCD";
      } else if (voiceId === "Will") {
        console.log("Explicitly mapping Will to Will's male voice");
        processedVoiceId = "bIHbv24MWmeRgasZH58o";
      }
      const actualVoiceId = elevenlabs.getVoiceId(processedVoiceId);
      console.log(`Using ElevenLabs voice ID: ${actualVoiceId}`);
      const processedText = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\n{3,}/g, "\n\n").replace(/\s{3,}/g, " ").trim();
      const audioUrl = await elevenlabs.textToSpeech({
        text: processedText,
        voiceId: actualVoiceId,
        model: "eleven_monolingual_v1",
        stability: 0.5,
        similarityBoost: 0.75
      });
      const filePath = path3.join(process.cwd(), "dist", "public", audioUrl.replace(/^\//, ""));
      if (!fs3.existsSync(filePath)) {
        return res.status(500).json({
          message: "Generated audio file not found",
          error: "File generation failed"
        });
      }
      const fileStats = fs3.statSync(filePath);
      const fileSize = fileStats.size;
      const fileSizeInKB = fileSize / 1024;
      return res.status(200).json({
        message: "Speech generated successfully",
        audioUrl,
        fileSize: fileSizeInKB.toFixed(2) + " KB",
        success: true
      });
    } catch (error) {
      console.error("ElevenLabs API error:", error);
      return res.status(500).json({
        message: "Speech generation failed",
        error: error.message || String(error),
        fallback: true
      });
    }
  });
  app2.get("/api/community/discussions", async (req, res) => {
    try {
      const discussions = await storage.getDiscussions();
      res.json(discussions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });
  app2.get("/api/community/popular-stories", async (req, res) => {
    try {
      const stories = await storage.getPopularStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular stories" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs4 from "fs";
import path5, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path4, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path4.resolve(__dirname, "client", "src"),
      "@shared": path4.resolve(__dirname, "shared"),
      "@assets": path4.resolve(__dirname, "attached_assets")
    }
  },
  root: path4.resolve(__dirname, "client"),
  build: {
    outDir: path4.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) {
      return next();
    }
    try {
      const clientTemplate = path5.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path5.resolve(__dirname2, "public");
  if (!fs4.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import fs5 from "fs";
import session from "express-session";
import { nanoid as nanoid2 } from "nanoid";

// server/config/database.ts
import mongoose2 from "mongoose";
import dotenv6 from "dotenv";
dotenv6.config();
var connectDB = async () => {
  try {
    try {
      await mongoose2.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected to local instance");
      return;
    } catch (localError) {
      console.log("Could not connect to local MongoDB, trying remote...");
    }
    try {
      await mongoose2.connect("mongodb+srv://seduisestory:Story123@cluster0.ueu7cqi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
      console.log("MongoDB connected to Atlas");
    } catch (remoteError) {
      throw remoteError;
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
var database_default = connectDB;

// server/index.ts
dotenv7.config();
var app = express2();
database_default();
app.use(session({
  secret: process.env.SESSION_SECRET || "seduise-story-app-secret-123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // In Replit dev environment, disable secure as we're using HTTP
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1e3
  },
  name: "seduise.sid",
  genid: () => nanoid2()
}));
app.use(express2.json());
app.use(express2.urlencoded({ extended: true }));
app.use(passport_default.initialize());
app.use(passport_default.session());
if (process.env.REPL_ID) {
  app.use((req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Content-Security-Policy-Report-Only");
    next();
  });
} else {
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' https://*.stripe.com 'unsafe-inline' 'unsafe-eval'; frame-src https://*.stripe.com; connect-src 'self' http://localhost:* https://*.stripe.com; font-src 'self' data:;"
    );
    next();
  });
}
app.use((err, req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.error("API Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(status).json({ message });
  }
  next(err);
});
var publicDirPath = path6.join(process.cwd(), "dist", "public");
app.use("/audio", express2.static(path6.join(publicDirPath, "audio")));
app.use("/audio", (req, res, next) => {
  log(`Audio file request: ${req.path}`);
  const fullPath = path6.join(publicDirPath, "audio", req.path);
  log(`Looking for file at: ${fullPath}`);
  if (fs5.existsSync(fullPath)) {
    log(`File exists: ${fullPath}`);
  } else {
    log(`File not found: ${fullPath}`);
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path7 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path7.startsWith("/api")) {
      let logLine = `${req.method} ${path7} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
