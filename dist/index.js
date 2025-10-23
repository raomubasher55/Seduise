var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/models/user.model.ts
var user_model_exports = {};
__export(user_model_exports, {
  User: () => User
});
import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv2 from "dotenv";
var JWT_SECRET, userSchema, User;
var init_user_model = __esm({
  "server/models/user.model.ts"() {
    "use strict";
    dotenv2.config();
    JWT_SECRET = process.env.JWT_SECRET || "story_app_super_secret_key_for_tokens_2025";
    userSchema = new Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: false },
      // Made optional for Google auth
      name: { type: String, required: true },
      phone: { type: String, required: false },
      // Added phone field
      role: { type: String, enum: ["admin", "user"], default: "user" },
      subscription: {
        type: String,
        enum: ["free", "essentiel", "seduction", "intimacy"],
        default: "free"
      },
      isPremium: { type: Boolean, default: false },
      // True for any paid plan
      // Separate credit system
      textCredits: { type: Number, default: 2 },
      // Credits for text generation
      audioCredits: { type: Number, default: 1 },
      // Credits for audio generation
      // Subscription usage tracking
      usageThisMonth: {
        storiesGenerated: { type: Number, default: 0 },
        chaptersGenerated: { type: Number, default: 0 },
        textCreditsUsed: { type: Number, default: 0 },
        audioCreditsUsed: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now }
      },
      // For Stripe integration
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      processedSessions: [{ type: String }],
      // Track processed Stripe session IDs
      stories: { type: [Schema.Types.ObjectId], ref: "Story", default: [] },
      unlockedChapters: [{
        storyId: { type: Schema.Types.ObjectId, ref: "Story" },
        chapterNumber: { type: Number }
      }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      // Google OAuth Fields
      googleId: { type: String, sparse: true, unique: true },
      profilePicture: { type: String },
      authProvider: { type: String, enum: ["local", "google"], default: "local" },
      badges: [{
        id: String,
        name: String,
        description: String,
        icon: String,
        color: String,
        rarity: { type: String, enum: ["common", "rare", "epic", "legendary"] },
        awardedAt: { type: Date, default: Date.now }
      }]
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
    User = model("User", userSchema);
  }
});

// server/models/story.model.ts
var story_model_exports = {};
__export(story_model_exports, {
  Story: () => Story
});
import { Schema as Schema2, model as model2 } from "mongoose";
var chapterSchema, storySchema, Story;
var init_story_model = __esm({
  "server/models/story.model.ts"() {
    "use strict";
    chapterSchema = new Schema2({
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
    storySchema = new Schema2({
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
      textCreditsCost: { type: Number, default: 1 },
      audioCreditsCost: { type: Number, default: 2 },
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
      publicReleaseDate: { type: Date },
      // Track user interactions to prevent duplicate votes
      likedBy: [{ type: String }],
      // Array of user IDs who liked this story
      upvotedBy: [{ type: String }],
      // Array of user IDs who upvoted this story
      downvotedBy: [{ type: String }]
      // Array of user IDs who downvoted this story
    }, { timestamps: true });
    storySchema.index({ id: 1 }, { unique: false });
    Story = model2("Story", storySchema);
  }
});

// server/constants/badges.ts
var BADGE_DEFINITIONS, getBadgesByCategory, getBadgesByRarity, getBadgeById, BADGE_CHECK_ORDER;
var init_badges = __esm({
  "server/constants/badges.ts"() {
    "use strict";
    BADGE_DEFINITIONS = {
      // ==================== ENGAGEMENT BADGES ====================
      "first_like": {
        id: "first_like",
        name: "First Heart",
        description: "Received your first like on a story",
        icon: "\u{1F49D}",
        color: "#FFB6C1",
        category: "engagement",
        rarity: "common",
        criteria: {
          type: "likes",
          threshold: 1,
          timeframe: "all_time"
        },
        rewards: {
          credits: 5
        }
      },
      "popular_author": {
        id: "popular_author",
        name: "Popular Author",
        description: "Received 50+ likes across all stories",
        icon: "\u2B50",
        color: "#FFD700",
        category: "engagement",
        rarity: "rare",
        criteria: {
          type: "likes",
          threshold: 50,
          timeframe: "all_time"
        },
        rewards: {
          credits: 25
        }
      },
      "viral_storyteller": {
        id: "viral_storyteller",
        name: "Viral Storyteller",
        description: "Received 200+ likes across all stories",
        icon: "\u{1F525}",
        color: "#FF4500",
        category: "engagement",
        rarity: "epic",
        criteria: {
          type: "likes",
          threshold: 200,
          timeframe: "all_time"
        },
        rewards: {
          credits: 100,
          premium_days: 3
        }
      },
      "legend_author": {
        id: "legend_author",
        name: "Legend Author",
        description: "Received 1000+ likes across all stories",
        icon: "\u{1F451}",
        color: "#8A2BE2",
        category: "engagement",
        rarity: "legendary",
        criteria: {
          type: "likes",
          threshold: 1e3,
          timeframe: "all_time"
        },
        rewards: {
          credits: 500,
          premium_days: 30
        }
      },
      // ==================== QUALITY BADGES ====================
      "quality_writer": {
        id: "quality_writer",
        name: "Quality Writer",
        description: "High engagement ratio (likes/plays > 0.3)",
        icon: "\u2728",
        color: "#4169E1",
        category: "quality",
        rarity: "rare",
        criteria: {
          type: "engagement_ratio",
          threshold: 0.3,
          timeframe: "all_time",
          additional_conditions: {
            min_plays: 20
            // Must have at least 20 plays to qualify
          }
        },
        rewards: {
          credits: 30
        }
      },
      "masterpiece_creator": {
        id: "masterpiece_creator",
        name: "Masterpiece Creator",
        description: "Exceptional engagement ratio (likes/plays > 0.5)",
        icon: "\u{1F3A8}",
        color: "#9932CC",
        category: "quality",
        rarity: "epic",
        criteria: {
          type: "engagement_ratio",
          threshold: 0.5,
          timeframe: "all_time",
          additional_conditions: {
            min_plays: 50
          }
        },
        rewards: {
          credits: 75,
          premium_days: 7
        }
      },
      // ==================== COMMUNITY BADGES ====================
      "community_favorite": {
        id: "community_favorite",
        name: "Community Favorite",
        description: "More upvotes than downvotes with 10+ total votes",
        icon: "\u{1F3C6}",
        color: "#32CD32",
        category: "community",
        rarity: "rare",
        criteria: {
          type: "upvotes",
          threshold: 10,
          timeframe: "all_time",
          additional_conditions: {
            upvote_ratio: 0.7
            // 70% upvotes
          }
        },
        rewards: {
          credits: 40
        }
      },
      "peoples_choice": {
        id: "peoples_choice",
        name: "People's Choice",
        description: "Overwhelmingly positive community response (90%+ upvotes)",
        icon: "\u{1F396}\uFE0F",
        color: "#FF6347",
        category: "community",
        rarity: "epic",
        criteria: {
          type: "upvotes",
          threshold: 25,
          timeframe: "all_time",
          additional_conditions: {
            upvote_ratio: 0.9,
            min_total_votes: 30
          }
        },
        rewards: {
          credits: 100,
          premium_days: 5
        }
      },
      // ==================== MILESTONE BADGES ====================
      "storyteller": {
        id: "storyteller",
        name: "Storyteller",
        description: "Created your first story",
        icon: "\u{1F4DA}",
        color: "#8B4513",
        category: "milestone",
        rarity: "common",
        criteria: {
          type: "stories_created",
          threshold: 1,
          timeframe: "all_time"
        },
        rewards: {
          credits: 0
        }
      },
      "prolific_writer": {
        id: "prolific_writer",
        name: "Prolific Writer",
        description: "Created 10+ stories",
        icon: "\u{1F4D6}",
        color: "#228B22",
        category: "milestone",
        rarity: "rare",
        criteria: {
          type: "stories_created",
          threshold: 10,
          timeframe: "all_time"
        },
        rewards: {
          credits: 50
        }
      },
      "story_master": {
        id: "story_master",
        name: "Story Master",
        description: "Created 50+ stories",
        icon: "\u{1F4DD}",
        color: "#B8860B",
        category: "milestone",
        rarity: "epic",
        criteria: {
          type: "stories_created",
          threshold: 50,
          timeframe: "all_time"
        },
        rewards: {
          credits: 200,
          premium_days: 14
        }
      },
      // ==================== MONTHLY ACHIEVEMENTS ====================
      "monthly_star": {
        id: "monthly_star",
        name: "Monthly Star",
        description: "Top engagement this month",
        icon: "\u{1F31F}",
        color: "#FFD700",
        category: "community",
        rarity: "epic",
        criteria: {
          type: "likes",
          threshold: 20,
          timeframe: "monthly"
        },
        rewards: {
          credits: 75,
          premium_days: 3
        }
      }
    };
    getBadgesByCategory = (category) => {
      return Object.values(BADGE_DEFINITIONS).filter((badge) => badge.category === category);
    };
    getBadgesByRarity = (rarity) => {
      return Object.values(BADGE_DEFINITIONS).filter((badge) => badge.rarity === rarity);
    };
    getBadgeById = (id) => {
      return BADGE_DEFINITIONS[id];
    };
    BADGE_CHECK_ORDER = Object.values(BADGE_DEFINITIONS).sort((a, b) => {
      const rarityOrder = { "legendary": 0, "epic": 1, "rare": 2, "common": 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }).map((badge) => badge.id);
  }
});

// server/services/reward.service.ts
var reward_service_exports = {};
__export(reward_service_exports, {
  awardBadge: () => awardBadge,
  awardReward: () => awardReward,
  checkAndAwardTopAuthor: () => checkAndAwardTopAuthor
});
async function awardBadge(userId, badgeName) {
  console.warn("awardBadge is deprecated. Use badgeService.processUserBadges() for automatic badge awarding.");
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for badge award.`);
      return false;
    }
    if (typeof badgeName === "string" && !getBadgeById(badgeName)) {
      const legacyBadge = {
        id: badgeName.toLowerCase().replace(/\s+/g, "_"),
        name: badgeName,
        description: `Legacy badge: ${badgeName}`,
        icon: "\u{1F3C6}",
        color: "#FFD700",
        rarity: "common",
        awardedAt: /* @__PURE__ */ new Date()
      };
      if (!user.badges) {
        user.badges = [];
      }
      const existingBadge = user.badges.find(
        (badge) => badge.name === badgeName || badge.id === legacyBadge.id
      );
      if (!existingBadge) {
        user.badges.push(legacyBadge);
        await user.save();
        console.log(`Awarded legacy badge "${badgeName}" to user ${userId}.`);
        return true;
      }
    }
    return false;
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
var init_reward_service = __esm({
  "server/services/reward.service.ts"() {
    "use strict";
    init_user_model();
    init_badges();
  }
});

// server/constants/plans.ts
var plans_exports = {};
__export(plans_exports, {
  AUDIO_CREDIT_PACKAGES: () => AUDIO_CREDIT_PACKAGES,
  COMBO_CREDIT_PACKAGES: () => COMBO_CREDIT_PACKAGES,
  CREDIT_COSTS: () => CREDIT_COSTS,
  STORY_LENGTHS: () => STORY_LENGTHS,
  SUBSCRIPTION_PLANS: () => SUBSCRIPTION_PLANS,
  TEXT_CREDIT_PACKAGES: () => TEXT_CREDIT_PACKAGES,
  getAudioCreditCost: () => getAudioCreditCost,
  getMonthlyCredits: () => getMonthlyCredits,
  getTextCreditCost: () => getTextCreditCost,
  getUserLimits: () => getUserLimits,
  hasReachedLimit: () => hasReachedLimit
});
function getUserLimits(subscriptionType) {
  return SUBSCRIPTION_PLANS[subscriptionType]?.monthlyLimits || SUBSCRIPTION_PLANS.discovery.monthlyLimits;
}
function getMonthlyCredits(subscriptionType) {
  return SUBSCRIPTION_PLANS[subscriptionType]?.monthlyCredits || SUBSCRIPTION_PLANS.discovery.monthlyCredits;
}
function hasReachedLimit(usageThisMonth, subscriptionType, checkType) {
  const limits = getUserLimits(subscriptionType);
  const monthlyCredits = getMonthlyCredits(subscriptionType);
  switch (checkType) {
    case "stories":
      return usageThisMonth.storiesGenerated >= limits.stories;
    case "textCredits":
      return usageThisMonth.textCreditsUsed >= monthlyCredits.text;
    case "audioCredits":
      return usageThisMonth.audioCreditsUsed >= monthlyCredits.audio;
    default:
      return false;
  }
}
function getTextCreditCost(action, storyLength) {
  if (action === "generateStory") {
    if (storyLength === 2) return CREDIT_COSTS.text.generateStory.short;
    else if (storyLength === 3) return CREDIT_COSTS.text.generateStory.medium;
    else if (storyLength === 4) return CREDIT_COSTS.text.generateStory.long;
    return CREDIT_COSTS.text.generateStory.medium;
  } else if (action === "continueStory") {
    return CREDIT_COSTS.text.continueStory;
  }
  return 1;
}
function getAudioCreditCost(storyLength, minutes) {
  if (minutes) {
    return Math.ceil(minutes / 2.5);
  }
  if (storyLength === 2) return CREDIT_COSTS.audio.generateAudio.short;
  else if (storyLength === 3) return CREDIT_COSTS.audio.generateAudio.medium;
  else if (storyLength === 4) return CREDIT_COSTS.audio.generateAudio.long;
  return CREDIT_COSTS.audio.generateAudio.medium;
}
var SUBSCRIPTION_PLANS, TEXT_CREDIT_PACKAGES, AUDIO_CREDIT_PACKAGES, COMBO_CREDIT_PACKAGES, CREDIT_COSTS, STORY_LENGTHS;
var init_plans = __esm({
  "server/constants/plans.ts"() {
    "use strict";
    SUBSCRIPTION_PLANS = {
      discovery: {
        id: "discovery",
        name: "Discovery",
        price: 0,
        // Free
        billingPeriod: "free",
        description: "Explore Without Commitment",
        monthlyCredits: {
          text: 2,
          audio: 1
        },
        monthlyLimits: {
          stories: 2,
          audioCredits: 1
        },
        features: [
          "\u{1F58B} Create up to 2 personalized stories (text)",
          "\u{1F3A7} 1 free audio (\u2248 1 to 2 min)",
          "\u{1F399} Standard voice",
          "\u{1F4DA} No access to the premium library",
          "\u2728 Perfect to explore the world of Seduice for free, in both text and voice"
        ]
      },
      essentiel: {
        id: "essentiel",
        name: "Essentiel",
        price: 599,
        // €5.99 (in cents)
        billingPeriod: "monthly",
        description: "Pleasure at Your Own Pace",
        monthlyCredits: {
          text: 5,
          audio: 6
        },
        popular: true,
        monthlyLimits: {
          stories: 5,
          audioCredits: 6
        },
        features: [
          "\u{1F58B} Create up to 5 personalized stories (text)",
          "\u{1F3A7} 6 audio credits (\u2248 15 minutes total)",
          "\u{1F399} Natural-sounding voices",
          "\u{1F4DA} No access to the premium library",
          "\u{1F510} A soft and regular introduction to your intimate desires"
        ]
      },
      seduction: {
        id: "seduction",
        name: "Seduction",
        price: 1199,
        // €11.99 (in cents)
        billingPeriod: "monthly",
        description: "Your Pleasure Rendezvous",
        monthlyCredits: {
          text: 12,
          audio: 12
        },
        monthlyLimits: {
          stories: 12,
          audioCredits: 12
        },
        features: [
          "\u{1F58B} Create up to 12 personalized stories (text)",
          "\u{1F3A7} 12 audio credits (\u2248 30 minutes)",
          "\u{1F399} Expressive & realistic voices",
          "\u{1F4DA} Partial access to the premium audio library",
          "\u{1F381} New stories added monthly",
          "\u{1F4AB} Let your desires unfold like an intimate audio series"
        ]
      },
      intimacy: {
        id: "intimacy",
        name: "Intimacy",
        price: 2499,
        // €24.99 (in cents)
        billingPeriod: "monthly",
        description: "The Ultimate Experience Without Limits",
        monthlyCredits: {
          text: 25,
          audio: 24
        },
        bestValue: true,
        monthlyLimits: {
          stories: 25,
          audioCredits: 24
        },
        features: [
          "\u{1F58B} Create up to 25 personalized stories (text)",
          "\u{1F3A7} 24 audio credits (\u2248 60 minutes)",
          "\u{1F399} Expressive & immersive voices",
          "\u{1F4DA} Full access to the premium audio library",
          "\u{1F48C} Tailored suggestions and exclusive stories",
          "\u{1F534} The Ultimate Experience Without Limits"
        ]
      }
    };
    TEXT_CREDIT_PACKAGES = {
      text_starter: {
        id: "text_starter",
        name: "Text Pack - Starter",
        credits: 15,
        price: 299,
        // €2.99 (in cents)
        description: "Perfect for more story creation"
      },
      text_popular: {
        id: "text_popular",
        name: "Text Pack - Popular",
        credits: 40,
        price: 699,
        // €6.99 (in cents)
        popular: true,
        description: "Most popular text credits pack"
      },
      text_premium: {
        id: "text_premium",
        name: "Text Pack - Premium",
        credits: 80,
        price: 1199,
        // €11.99 (in cents)
        bestValue: true,
        description: "Maximum text credits for heavy writers"
      }
    };
    AUDIO_CREDIT_PACKAGES = {
      audio_starter: {
        id: "audio_starter",
        name: "Audio Pack - Starter",
        credits: 10,
        price: 499,
        // €4.99 (in cents)
        description: "Perfect for more audio experiences"
      },
      audio_popular: {
        id: "audio_popular",
        name: "Audio Pack - Popular",
        credits: 25,
        price: 999,
        // €9.99 (in cents)
        popular: true,
        description: "Most popular audio credits pack"
      },
      audio_premium: {
        id: "audio_premium",
        name: "Audio Pack - Premium",
        credits: 50,
        price: 1799,
        // €17.99 (in cents)
        bestValue: true,
        description: "Maximum audio credits for audio lovers"
      }
    };
    COMBO_CREDIT_PACKAGES = {
      combo_starter: {
        id: "combo_starter",
        name: "Combo Pack - Starter",
        textCredits: 3,
        audioCredits: 2,
        price: 599,
        // €5.99 (in cents)
        description: "Best value starter combo pack"
      },
      combo_popular: {
        id: "combo_popular",
        name: "Combo Pack - Popular",
        textCredits: 7,
        audioCredits: 5,
        price: 1299,
        // €12.99 (in cents)
        popular: true,
        description: "Best value combo pack"
      },
      combo_premium: {
        id: "combo_premium",
        name: "Combo Pack - Premium",
        textCredits: 15,
        audioCredits: 10,
        price: 2299,
        // €22.99 (in cents)
        bestValue: true,
        description: "Ultimate combo pack for power users"
      }
    };
    CREDIT_COSTS = {
      text: {
        generateStory: {
          short: 1,
          // Short story
          medium: 2,
          // Medium story
          long: 4
          // Long story
        },
        continueStory: 1
        // Continue/add chapter
      },
      audio: {
        generateAudio: {
          short: 2,
          // ~2.5 minutes audio
          medium: 3,
          // ~5 minutes audio
          long: 5
          // ~8-10 minutes audio
        },
        perMinute: 1
        // 1 audio credit per ~2.5 minutes
      }
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
import dotenv8 from "dotenv";
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
import { z as z5 } from "zod";

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
init_user_model();
import jwt2 from "jsonwebtoken";
import dotenv3 from "dotenv";
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
init_user_model();
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
init_user_model();
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
init_user_model();
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

// server/routes.ts
init_user_model();
init_story_model();

// server/routes/story.route.ts
import { Router as Router2 } from "express";

// server/services/story.service.ts
init_story_model();

// server/utils/openai.ts
import OpenAI from "openai";
import dotenv5 from "dotenv";
dotenv5.config();
var geminiAI = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.GEMINI_API || "AIzaSyB_t3pkKT_GvB4vPYNkrdALSajq5N0Sbu4"
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
  const systemPrompt = `You must return ONLY valid JSON. No explanations, no title suggestions, no additional text.

Create an erotic story with these parameters:
- Time Period: ${timePeriod}
- Location: ${location}
- Atmosphere: ${atmosphere}
- Protagonist: ${protagonistGender}
- Partner: ${partnerGender}
- Relationship: ${relationship}
- Tone: ${writingTone}
- ${targetWordCount}
- ${explicitLevelDescription}
- ${titlePrompt}

${settingPrompt}
${protagonistPrompt}
${loveInterestPrompt}

MANDATORY JSON FORMAT (nothing else):
{
  "title": "Story Title Here",
  "content": "Complete story content with vivid descriptions, dialogue, and sensual elements. End with cliffhanger."
}

DO NOT include title options, explanations, or any text outside the JSON object.`;
  const userPrompt = "Create the erotic story now. Return ONLY the JSON object with title and content. No explanations, no title suggestions, no additional text.";
  try {
    console.log("Generating story with Google Gemini model...");
    const completion = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      // Slightly lower for more consistent JSON output
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
      responseText = responseText.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
      try {
        let jsonStr = responseText;
        try {
          const result = JSON.parse(jsonStr);
          return {
            title: title || result.title || "Untitled Story",
            content: result.content || "Story generation failed"
          };
        } catch (nestedJsonError) {
          console.error("Error parsing cleaned JSON:", nestedJsonError);
          let content = responseText;
          content = content.replace(/^.*?Here are a few title options.*?(?=\n\n|\n[A-Z])/is, "").replace(/^\* \*\*.*?\*\*.*$/gm, "").replace(/^Here's? (?:the|a) story.*?$/gm, "").replace(/^Based on.*?$/gm, "").replace(/^.*?ranging in tone.*?$/gm, "").replace(/^\s*[\*\-\+]\s+.*$/gm, "").replace(/^\s*$\n/gm, "").trim();
          const storyMatch = content.match(/(The\s+(?:turquoise|crystal|warm|golden|sun|beach|water|wind|island).*?)$/is) || content.match(/(I\s+(?:was|had|found|saw|felt).*?)$/is) || content.match(/([A-Z][a-z]+.*?(?:water|sun|beach|resort|island|paradise|garden).*?)$/is);
          if (storyMatch) {
            content = storyMatch[1].trim();
          }
          return {
            title: title || "Untitled Story",
            content
          };
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response from Gemini:", jsonError);
        let content = responseText;
        const afterTitleOptions = content.split(/Here are a few title options.*?\n/i)[1];
        if (afterTitleOptions) {
          const storyStart = afterTitleOptions.search(/The\s+(?:turquoise|crystal|warm|sun|water)/i);
          if (storyStart !== -1) {
            content = afterTitleOptions.substring(storyStart);
          } else {
            content = afterTitleOptions.replace(/^\* \*\*.*?\*\*.*$/gm, "").trim();
          }
        }
        content = content.replace(/^\* \*\*.*?\*\*.*$/gm, "").replace(/^\s*$/gm, "").trim();
        return {
          title: title || "Untitled Story",
          content
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
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
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
    console.log("=== USING NEW CHAPTER TITLE FUNCTION ===");
    const keywords = content.toLowerCase();
    let title = `Chapter ${chapterNumber}`;
    if (keywords.includes("beach") || keywords.includes("sand") || keywords.includes("ocean")) {
      title = "Seaside Encounter";
    } else if (keywords.includes("garden") || keywords.includes("flower")) {
      title = "Garden Romance";
    } else if (keywords.includes("cottage") || keywords.includes("cabin")) {
      title = "Intimate Hideaway";
    } else if (keywords.includes("sunset") || keywords.includes("sunrise")) {
      title = "Golden Hour";
    } else if (keywords.includes("wine") || keywords.includes("dinner")) {
      title = "Evening Desires";
    } else if (keywords.includes("kiss") || keywords.includes("lips")) {
      title = "First Touch";
    } else if (keywords.includes("dance") || keywords.includes("music")) {
      title = "Rhythmic Passion";
    } else if (keywords.includes("rain") || keywords.includes("storm")) {
      title = "Storm of Desire";
    } else if (keywords.includes("fire") || keywords.includes("flame")) {
      title = "Burning Passion";
    } else if (keywords.includes("moonlight") || keywords.includes("night")) {
      title = "Moonlit Embrace";
    } else if (keywords.includes("morning") || keywords.includes("dawn")) {
      title = "Dawn Awakening";
    } else if (keywords.includes("secret") || keywords.includes("hidden")) {
      title = "Secret Moments";
    } else {
      const defaultTitles = [
        "Unexpected Meeting",
        "Growing Attraction",
        "Passionate Encounter",
        "Intimate Connection",
        "Deepening Bond",
        "Tender Moments",
        "Rising Heat",
        "Sweet Surrender"
      ];
      title = defaultTitles[(chapterNumber - 1) % defaultTitles.length] || `Chapter ${chapterNumber}`;
    }
    return title;
  } catch (error) {
    console.error("Error generating chapter title:", error);
    return `Chapter ${chapterNumber}`;
  }
}
async function generateTitleSuggestions(content) {
  try {
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
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
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
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
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
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
async function concludeStory(existingContent, settings, selectedChoice) {
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
      targetWordCount = "Write a short conclusion of approximately 300-400 words.";
    } else if (length === 3) {
      maxTokens = 2400;
      targetWordCount = "Write a medium-length conclusion of approximately 700-900 words.";
    } else if (length === 4) {
      maxTokens = 4800;
      targetWordCount = "Write a longer conclusion of approximately 1500-1800 words.";
    } else {
      maxTokens = 1200;
      targetWordCount = "Write a short conclusion of approximately 300-400 words.";
    }
    console.log(`Story conclusion length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);
    const explicitLevelDescription = explicitLevel !== void 0 ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.` : "Keep the content moderately explicit unless otherwise specified.";
    const settingPrompt = settingDescription ? `Setting description: ${settingDescription}` : "";
    const protagonistPrompt = protagonistDescription ? `Protagonist description: ${protagonistDescription}` : "";
    const loveInterestPrompt = loveInterestDescription ? `Love interest description: ${loveInterestDescription}` : "";
    const choicePrompt = selectedChoice ? `The user chose: "${selectedChoice}". Conclude the story based on this choice.` : "";
    const systemPrompt = `You are an expert erotic fiction writer. Conclude this story seamlessly from where it left off.
    
    CRITICAL INSTRUCTIONS:
    1. Read the existing content carefully and continue EXACTLY where it ended
    2. DO NOT repeat any dialogue, actions, or scenes from the existing content
    3. Bring the story to a satisfying conclusion. Resolve the main conflicts and provide a clear ending.
    4. DO NOT end with a cliffhanger.
    5. Maintain the same characters, setting, and tone throughout
    6. DO NOT include "Chapter X" headers - provide only the story content
    
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
    
    Your conclusion should provide a sense of closure and resolution.`;
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here's the existing story content:

${existingContent}

IMPORTANT: Conclude the story from the exact point where it ended. Provide a satisfying resolution.` }
      ],
      max_tokens: maxTokens,
      temperature: 0.8
    });
    let responseText = response.choices[0].message.content || "The story concludes...";
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
    console.error("Error concluding story:", error);
    throw new Error("Failed to conclude the story. Please try again.");
  }
}

// server/services/story.service.ts
init_user_model();
init_reward_service();
var VisibilityError = class extends Error {
  code;
  status;
  constructor(message, status, code) {
    super(message);
    this.name = "VisibilityError";
    if (status) this.status = status;
    if (code) this.code = code;
  }
};
var createStory = async (title, settings, maxTokens, userId, isPublic = false, category = "romance", accessType = "public", textCreditCost = 1) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.textCredits < textCreditCost) {
    throw new Error(`Insufficient text credits. This story requires ${textCreditCost} text credits, but you only have ${user.textCredits} text credits available. Please purchase additional text credits or upgrade to premium.`);
  }
  user.textCredits -= textCreditCost;
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
    textCreditsCost: textCreditCost,
    audioCreditsCost: 2
    // Default audio cost for first chapter
  };
  const story = new Story({
    title: title || generatedTitle,
    content: cleanedContent,
    // Keep for backward compatibility
    userId,
    settings,
    isPublic: accessType === "public",
    accessType,
    category,
    textCreditsCost: textCreditCost,
    audioCreditsCost: 2,
    // Default audio cost for story
    chapters: [firstChapter],
    currentChapter: 1,
    totalChapters: 1,
    isChapterBased: true
  });
  await story.save();
  user.stories.push(story._id);
  await user.save();
  if (user.stories.length === 1) {
    await awardBadge(userId, "Storyteller");
  }
  try {
    console.log(`Will generate audio for story ${story._id} with voice ${settings.narrationVoice} (ID: ${settings.narrationVoiceId})`);
  } catch (audioError) {
    console.error("Error scheduling audio generation:", audioError);
  }
  return story;
};
var continueStoryService = async (id, finalChoice, conclude) => {
  const story = await Story.findById(id);
  if (!story) {
    throw new Error("Story not found");
  }
  const user = await User.findById(story.userId);
  if (!user) {
    throw new Error("User not found");
  }
  const TEXT_CONTINUATION_COST = 1;
  if (user.textCredits < TEXT_CONTINUATION_COST) {
    throw new Error(`Insufficient text credits. Continuing this story requires ${TEXT_CONTINUATION_COST} text credit, but you only have ${user.textCredits} text credits available. Please purchase additional text credits or upgrade to premium.`);
  }
  user.textCredits -= TEXT_CONTINUATION_COST;
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
    const continuation = conclude ? await concludeStory(
      currentContent,
      story.settings,
      finalChoice
    ) : await continueStory(
      currentContent,
      story.settings,
      finalChoice
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
      textCreditsCost: TEXT_CONTINUATION_COST,
      audioCreditsCost: 2,
      // Default audio cost for new chapter
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
        textCreditsCost: story.textCreditsCost || story.creditsCost || 1,
        // Fallback for legacy data
        audioCreditsCost: story.audioCreditsCost || 2
        // Default audio cost
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
    user.textCredits += TEXT_CONTINUATION_COST;
    await user.save();
    console.error("Error in continueStoryService:", error);
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
var setStoryVisibility = async (userId, storyId, isPublic) => {
  if (!userId) {
    throw new VisibilityError("Not authenticated", 401);
  }
  if (typeof isPublic !== "boolean") {
    throw new VisibilityError("Invalid visibility status", 400);
  }
  if (!isPublic) {
    const user = await User.findById(userId);
    if (!user) {
      throw new VisibilityError("User not found", 404);
    }
    if (!user.isPremium) {
      throw new VisibilityError("Only premium users can set stories to private", 403, "PREMIUM_REQUIRED");
    }
  }
  const story = await Story.findById(storyId);
  if (!story) {
    throw new VisibilityError("Story not found", 404);
  }
  if (story.userId !== userId) {
    throw new VisibilityError("You don't have permission to update this story", 403);
  }
  story.isPublic = isPublic;
  await story.save();
  return story;
};
var getVoiceOptionsService = async () => {
  const voices = await elevenlabs.getVoices();
  const determineVoiceGender = (voiceName, labels) => {
    if (labels && labels.gender && (labels.gender.toLowerCase() === "male" || labels.gender.toLowerCase() === "female")) {
      return labels.gender.toLowerCase();
    }
    const maleNames = ["adam", "josh", "thomas", "charlie", "james", "matthew", "daniel", "michael", "david", "william", "joseph", "chris", "george", "robert", "jack", "john", "henry", "jacob", "sam", "samuel", "tom", "callum", "harry", "oliver", "peter", "will", "liam", "lucas"];
    const femaleNames = ["rachel", "sarah", "emily", "bella", "domi", "charlotte", "olivia", "emma", "ava", "sophia", "isabella", "mia", "amelia", "alice", "lily", "grace", "chloe", "jessica", "sophia", "amy", "katie", "susan", "jennifer", "elizabeth", "mary", "kathy", "matilda", "river"];
    const normalizedName = voiceName.toLowerCase().trim();
    const firstNamePart = normalizedName.split(" ")[0];
    if (normalizedName.includes("female") || normalizedName.includes("woman")) return "female";
    if (normalizedName.includes("male") || normalizedName.includes("man")) return "male";
    if (maleNames.includes(firstNamePart)) return "male";
    if (femaleNames.includes(firstNamePart)) return "female";
    if (/\b(mr|sir|guy|boy|bro|dude)\b/.test(normalizedName)) return "male";
    if (/\b(mrs|ms|miss|lady|girl|sis)\b/.test(normalizedName)) return "female";
    if (normalizedName === "river") return "female";
    return "unknown";
  };
  return voices.map((voice) => {
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
        gender: determineVoiceGender(voice.name, voice.labels),
        accent: voice.labels && voice.labels.accent || "neutral",
        age: voice.labels && voice.labels.age || "adult",
        style: voice.labels && voice.labels.style || "natural"
      },
      preview_url: voice.preview_url || ""
    };
  });
};
var getPublicStoriesService = async (userId) => {
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
        const likedBy = story.likedBy || [];
        const upvotedBy = story.upvotedBy || [];
        const downvotedBy = story.downvotedBy || [];
        if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
          const user = await User.findById(story.userId).select("name badges");
          return {
            ...story.toObject(),
            userName: user ? user.name : "Anonymous",
            authorBadges: user ? user.badges : [],
            hasLiked: userId ? likedBy.includes(userId) : false,
            hasUpvoted: userId ? upvotedBy.includes(userId) : false,
            hasDownvoted: userId ? downvotedBy.includes(userId) : false
          };
        } else {
          return {
            ...story.toObject(),
            userName: "Anonymous",
            authorBadges: [],
            hasLiked: userId ? likedBy.includes(userId) : false,
            hasUpvoted: userId ? upvotedBy.includes(userId) : false,
            hasDownvoted: userId ? downvotedBy.includes(userId) : false
          };
        }
      } catch (err) {
        return {
          ...story.toObject(),
          userName: "Anonymous",
          authorBadges: [],
          hasLiked: false,
          hasUpvoted: false,
          hasDownvoted: false
        };
      }
    })
  );
  return storiesWithUserNames;
};
var getStoriesByCategoryService = async (category) => {
  if (!category) {
    throw new VisibilityError("Category is required", 400);
  }
  let query = { isPublic: true };
  switch (category) {
    case "romance":
      query = { isPublic: true, $or: [{ category: "romance" }, { "settings.atmosphere": "Romantic" }, { "settings.writingTone": "Romantic" }] };
      break;
    case "fantasy":
      query = { isPublic: true, $or: [{ category: "fantasy" }, { "settings.timePeriod": "Fantasy Realm" }] };
      break;
    case "historical":
      query = { isPublic: true, $or: [{ category: "historical" }, { "settings.timePeriod": { $in: ["Medieval", "Victorian"] } }] };
      break;
    case "contemporary":
      query = { isPublic: true, $or: [{ category: "contemporary" }, { "settings.timePeriod": "Contemporary" }] };
      break;
    case "adventure":
      query = { isPublic: true, $or: [{ category: "adventure" }, { "settings.atmosphere": "Mysterious" }] };
      break;
    case "passionate":
      query = { isPublic: true, $or: [{ category: "passionate" }, { "settings.writingTone": "Passionate" }] };
      break;
    case "playful":
      query = { isPublic: true, $or: [{ category: "playful" }, { "settings.writingTone": "Playful" }] };
      break;
    case "intense":
      query = { isPublic: true, $or: [{ category: "intense" }, { "settings.writingTone": "Intense" }] };
      break;
    default:
      query = { isPublic: true, category };
  }
  const categoryStories = await Story.find(query).sort({ createdAt: -1 }).limit(8);
  const storiesWithUserNames = await Promise.all(
    categoryStories.map(async (story) => {
      try {
        if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
          const user = await User.findById(story.userId);
          return { ...story.toObject(), userName: user ? user.name : "Anonymous" };
        } else {
          return { ...story.toObject(), userName: "Anonymous" };
        }
      } catch (err) {
        return { ...story.toObject(), userName: "Anonymous" };
      }
    })
  );
  return storiesWithUserNames;
};
var getPremiumStoriesService = async (userId) => {
  const user = await User.findById(userId);
  const hasGalleryAccess = ["essentiel", "seduction", "intimacy"].includes(user?.subscription || "");
  if (!user || !hasGalleryAccess) {
    const err = new Error("Access denied. Premium subscription required for premium gallery access.");
    err.status = 403;
    err.code = "PREMIUM_REQUIRED";
    err.currentSubscription = user?.subscription || "none";
    err.requiredSubscriptions = ["essentiel", "seduction", "intimacy"];
    throw err;
  }
  const currentDate = /* @__PURE__ */ new Date();
  let storyQuery = {};
  let limit = 20;
  if (user.subscription === "essentiel") {
    storyQuery = { accessType: "premium_early_access", $or: [{ premiumAccessDate: { $lte: currentDate } }, { premiumAccessDate: { $exists: false } }] };
    limit = 10;
  } else if (user.subscription === "seduction") {
    storyQuery = { accessType: { $in: ["premium_early_access", "premium_exclusive"] }, $or: [{ premiumAccessDate: { $lte: currentDate } }, { premiumAccessDate: { $exists: false } }] };
    limit = 20;
  } else if (user.subscription === "intimacy") {
    storyQuery = { accessType: { $in: ["premium_early_access", "premium_exclusive"] }, $or: [{ premiumAccessDate: { $lte: currentDate } }, { premiumAccessDate: { $exists: false } }] };
    limit = 30;
  } else {
    storyQuery = { accessType: "premium_early_access" };
    limit = 5;
  }
  const premiumStories = await Story.find(storyQuery).sort({ createdAt: -1 }).limit(limit);
  const storiesWithUserNames = await Promise.all(
    premiumStories.map(async (story) => {
      try {
        if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
          const author = await User.findById(story.userId).select("name badges");
          return { ...story.toObject(), userName: author ? author.name : "Anonymous", authorBadges: author ? author.badges : [] };
        } else {
          return { ...story.toObject(), userName: "Anonymous", authorBadges: [] };
        }
      } catch (err) {
        return { ...story.toObject(), userName: "Anonymous", authorBadges: [] };
      }
    })
  );
  return storiesWithUserNames;
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
  textCredits: z.number().default(2),
  audioCredits: z.number().default(1),
  stories: z.array(z.string()).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  subscription: z.enum(["free", "essentiel", "seduction", "intimacy"]).default("free"),
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
  textCreditsCost: z.number().default(1),
  audioCreditsCost: z.number().default(2),
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
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  category: z.string().default("romance"),
  textCreditsCost: z.number().default(1),
  audioCreditsCost: z.number().default(2),
  chapters: z.array(chapterSchema2).default([]),
  currentChapter: z.number().default(1),
  totalChapters: z.number().default(1),
  isChapterBased: z.boolean().default(false),
  isPremiumContent: z.boolean().default(false),
  accessType: z.enum(["public", "premium_early_access", "premium_exclusive"]).default("public"),
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
init_story_model();
init_user_model();
import path2 from "path";
import fs2 from "fs";

// server/services/badge.service.ts
init_user_model();
init_story_model();
init_badges();
var BadgeService = class {
  /**
   * Get comprehensive user statistics for badge evaluation
   */
  async getUserStats(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User ${userId} not found for stats calculation`);
        return null;
      }
      const userStories = await Story.find({ userId });
      const totalLikes = userStories.reduce((sum, story) => sum + (story.likes || 0), 0);
      const totalUpvotes = userStories.reduce((sum, story) => sum + (story.upvotes || 0), 0);
      const totalDownvotes = userStories.reduce((sum, story) => sum + (story.downvotes || 0), 0);
      const totalPlays = userStories.reduce((sum, story) => sum + (story.plays || 0), 0);
      const storiesCreated = userStories.length;
      const engagementRatio = totalPlays > 0 ? totalLikes / totalPlays : 0;
      const totalVotes = totalUpvotes + totalDownvotes;
      const upvoteRatio = totalVotes > 0 ? totalUpvotes / totalVotes : 0;
      const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const monthlyStories = userStories.filter((story) => {
        const storyDate = new Date(story.createdAt);
        return storyDate.getMonth() === currentMonth && storyDate.getFullYear() === currentYear;
      });
      const monthlyLikes = monthlyStories.reduce((sum, story) => sum + (story.likes || 0), 0);
      const monthlyUpvotes = monthlyStories.reduce((sum, story) => sum + (story.upvotes || 0), 0);
      return {
        totalLikes,
        totalUpvotes,
        totalDownvotes,
        totalPlays,
        storiesCreated,
        engagementRatio,
        upvoteRatio,
        monthlyLikes,
        monthlyUpvotes,
        monthlyStories: monthlyStories.length
      };
    } catch (error) {
      console.error("Error calculating user stats:", error);
      return null;
    }
  }
  /**
   * Check if a user qualifies for a specific badge
   */
  evaluateBadgeCriteria(badge, stats) {
    try {
      const { criteria } = badge;
      switch (criteria.type) {
        case "likes":
          const likesValue = criteria.timeframe === "monthly" ? stats.monthlyLikes : stats.totalLikes;
          return likesValue >= criteria.threshold;
        case "upvotes":
          const upvotesValue = criteria.timeframe === "monthly" ? stats.monthlyUpvotes : stats.totalUpvotes;
          let meetsUpvoteThreshold = upvotesValue >= criteria.threshold;
          if (criteria.additional_conditions) {
            if (criteria.additional_conditions.upvote_ratio) {
              meetsUpvoteThreshold = meetsUpvoteThreshold && stats.upvoteRatio >= criteria.additional_conditions.upvote_ratio;
            }
            if (criteria.additional_conditions.min_total_votes) {
              const totalVotes = stats.totalUpvotes + stats.totalDownvotes;
              meetsUpvoteThreshold = meetsUpvoteThreshold && totalVotes >= criteria.additional_conditions.min_total_votes;
            }
          }
          return meetsUpvoteThreshold;
        case "plays":
          return stats.totalPlays >= criteria.threshold;
        case "stories_created":
          const storiesValue = criteria.timeframe === "monthly" ? stats.monthlyStories : stats.storiesCreated;
          return storiesValue >= criteria.threshold;
        case "engagement_ratio":
          let meetsEngagementThreshold = stats.engagementRatio >= criteria.threshold;
          if (criteria.additional_conditions?.min_plays) {
            meetsEngagementThreshold = meetsEngagementThreshold && stats.totalPlays >= criteria.additional_conditions.min_plays;
          }
          return meetsEngagementThreshold;
        case "community_impact":
          return stats.totalLikes > 10 && stats.upvoteRatio > 0.6;
        default:
          console.warn(`Unknown badge criteria type: ${criteria.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error evaluating badge criteria for ${badge.id}:`, error);
      return false;
    }
  }
  /**
   * Check which new badges a user has earned
   */
  async checkEligibleBadges(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return [];
      }
      const stats = await this.getUserStats(userId);
      if (!stats) {
        return [];
      }
      const currentBadges = user.badges || [];
      const newBadges = [];
      for (const badgeId of BADGE_CHECK_ORDER) {
        if (currentBadges.some((badge) => badge.id === badgeId)) {
          continue;
        }
        const badgeDefinition = getBadgeById(badgeId);
        if (!badgeDefinition) {
          continue;
        }
        if (this.evaluateBadgeCriteria(badgeDefinition, stats)) {
          newBadges.push({
            badgeId,
            awarded: true,
            reason: `Earned by meeting criteria: ${badgeDefinition.description}`,
            rewards: badgeDefinition.rewards
          });
        }
      }
      return newBadges;
    } catch (error) {
      console.error("Error checking eligible badges:", error);
      return [];
    }
  }
  /**
   * Award badges to a user and apply rewards
   */
  async awardBadges(userId, badgeAwards) {
    const awarded = [];
    const errors = [];
    try {
      const user = await User.findById(userId);
      if (!user) {
        errors.push("User not found");
        return { success: false, awarded, errors };
      }
      for (const award of badgeAwards) {
        try {
          const badgeDefinition = getBadgeById(award.badgeId);
          if (!badgeDefinition) {
            errors.push(`Badge definition not found: ${award.badgeId}`);
            continue;
          }
          const existingBadge = user.badges?.find((badge) => badge.id === award.badgeId);
          if (existingBadge) {
            continue;
          }
          if (!user.badges) {
            user.badges = [];
          }
          user.badges.push({
            id: award.badgeId,
            name: badgeDefinition.name,
            description: badgeDefinition.description,
            icon: badgeDefinition.icon,
            color: badgeDefinition.color,
            rarity: badgeDefinition.rarity,
            awardedAt: /* @__PURE__ */ new Date()
          });
          if (award.rewards?.credits) {
            const textCredits = Math.floor(award.rewards.credits * 0.7);
            const audioCredits = Math.floor(award.rewards.credits * 0.3);
            user.textCredits = (user.textCredits || 0) + textCredits;
            user.audioCredits = (user.audioCredits || 0) + audioCredits;
            console.log(`Awarded ${textCredits} text credits and ${audioCredits} audio credits for badge: ${badgeDefinition.name}`);
          }
          if (award.rewards?.premium_days) {
            console.log(`Badge would award ${award.rewards.premium_days} premium days: ${badgeDefinition.name}`);
          }
          awarded.push(award.badgeId);
          console.log(`\u2705 Awarded badge "${badgeDefinition.name}" to user ${userId}`);
        } catch (error) {
          console.error(`Error awarding badge ${award.badgeId}:`, error);
          errors.push(`Failed to award badge ${award.badgeId}: ${error.message}`);
        }
      }
      if (awarded.length > 0) {
        await user.save();
      }
      return {
        success: awarded.length > 0 || errors.length === 0,
        awarded,
        errors
      };
    } catch (error) {
      console.error("Error in awardBadges:", error);
      errors.push(`System error: ${error.message}`);
      return { success: false, awarded, errors };
    }
  }
  /**
   * Main function to check and award all eligible badges
   */
  async processUserBadges(userId) {
    try {
      const eligibleBadges = await this.checkEligibleBadges(userId);
      if (eligibleBadges.length === 0) {
        return { newBadges: [], errors: [] };
      }
      const result = await this.awardBadges(userId, eligibleBadges);
      return {
        newBadges: result.awarded,
        errors: result.errors
      };
    } catch (error) {
      console.error("Error processing user badges:", error);
      return {
        newBadges: [],
        errors: [`Failed to process badges: ${error.message}`]
      };
    }
  }
  /**
   * Get user's badge summary for display
   */
  async getUserBadgeSummary(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.badges) {
        return {
          total: 0,
          byRarity: { common: 0, rare: 0, epic: 0, legendary: 0 },
          recent: []
        };
      }
      const badges = user.badges;
      const byRarity = {
        common: badges.filter((b) => b.rarity === "common").length,
        rare: badges.filter((b) => b.rarity === "rare").length,
        epic: badges.filter((b) => b.rarity === "epic").length,
        legendary: badges.filter((b) => b.rarity === "legendary").length
      };
      const recent = badges.sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()).slice(0, 5);
      return {
        total: badges.length,
        byRarity,
        recent
      };
    } catch (error) {
      console.error("Error getting user badge summary:", error);
      return null;
    }
  }
};
var badgeService = new BadgeService();
var listBadgeDefinitionsService = (category, rarity) => {
  let badges = Object.values(BADGE_DEFINITIONS);
  if (category) badges = getBadgesByCategory(category);
  if (rarity) badges = getBadgesByRarity(rarity);
  return { badges, total: badges.length };
};
var getUserBadgesWithSummaryService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  const badgeSummary = await badgeService.getUserBadgeSummary(userId);
  const userStats = await badgeService.getUserStats(userId);
  return {
    badges: user.badges || [],
    summary: badgeSummary,
    stats: userStats
  };
};
var getBadgeLeaderboardService = async (limit = 10) => {
  const users = await User.find({ badges: { $exists: true, $ne: [] } }).select("name badges").limit(limit);
  const leaderboard = users.map((user) => {
    const badges = user.badges || [];
    const badgeCounts = {
      total: badges.length,
      legendary: badges.filter((b) => b.rarity === "legendary").length,
      epic: badges.filter((b) => b.rarity === "epic").length,
      rare: badges.filter((b) => b.rarity === "rare").length,
      common: badges.filter((b) => b.rarity === "common").length
    };
    const score = badgeCounts.legendary * 100 + badgeCounts.epic * 25 + badgeCounts.rare * 5 + badgeCounts.common * 1;
    return {
      userId: user._id,
      name: user.name,
      badgeCounts,
      score,
      recentBadges: badges.sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()).slice(0, 3)
    };
  }).sort((a, b) => b.score - a.score);
  return { leaderboard, total: leaderboard.length };
};
var getBadgeStatsService = async () => {
  const totalBadgeDefinitions = Object.keys(BADGE_DEFINITIONS).length;
  const userCount = await User.countDocuments({ badges: { $exists: true, $ne: [] } });
  const badgesByRarity = await User.aggregate([
    { $match: { badges: { $exists: true, $ne: [] } } },
    { $unwind: "$badges" },
    { $group: { _id: "$badges.rarity", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const mostAwardedBadges = await User.aggregate([
    { $match: { badges: { $exists: true, $ne: [] } } },
    { $unwind: "$badges" },
    { $group: { _id: "$badges.id", name: { $first: "$badges.name" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  return {
    totalBadgeDefinitions,
    usersWithBadges: userCount,
    badgesByRarity,
    mostAwardedBadges
  };
};

// server/middlewares/engagement.middleware.ts
var EngagementTracker = class {
  badgeCheckQueue = [];
  isProcessingQueue = false;
  /**
   * Add a badge check task to the queue
   */
  enqueueBadgeCheck(userId, trigger) {
    const recentCheck = this.badgeCheckQueue.find(
      (task) => task.userId === userId && Date.now() - task.timestamp.getTime() < 3e4
      // 30 seconds
    );
    if (!recentCheck) {
      this.badgeCheckQueue.push({
        userId,
        trigger,
        timestamp: /* @__PURE__ */ new Date()
      });
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    }
  }
  /**
   * Process the badge check queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.badgeCheckQueue.length === 0) {
      return;
    }
    this.isProcessingQueue = true;
    while (this.badgeCheckQueue.length > 0) {
      const task = this.badgeCheckQueue.shift();
      if (!task) continue;
      try {
        console.log(`\u{1F3C6} Checking badges for user ${task.userId} (trigger: ${task.trigger})`);
        const result = await badgeService.processUserBadges(task.userId);
        if (result.newBadges.length > 0) {
          console.log(`\u{1F389} User ${task.userId} earned ${result.newBadges.length} new badges: ${result.newBadges.join(", ")}`);
        }
        if (result.errors.length > 0) {
          console.error(`\u274C Badge processing errors for user ${task.userId}:`, result.errors);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing badge check for user ${task.userId}:`, error);
      }
    }
    this.isProcessingQueue = false;
  }
  /**
   * Trigger badge check for story creation
   */
  onStoryCreated(userId) {
    this.enqueueBadgeCheck(userId, "story_created");
  }
  /**
   * Trigger badge check for story interaction
   */
  onStoryInteraction(userId, interactionType) {
    this.enqueueBadgeCheck(userId, `story_${interactionType}`);
  }
  /**
   * Manual badge check (for testing or admin functions)
   */
  async checkBadgesNow(userId) {
    try {
      console.log(`\u{1F50D} Manual badge check for user ${userId}`);
      return await badgeService.processUserBadges(userId);
    } catch (error) {
      console.error(`Error in manual badge check for user ${userId}:`, error);
      return {
        newBadges: [],
        errors: [`Manual check failed: ${error.message}`]
      };
    }
  }
};
var engagementTracker = new EngagementTracker();
var trackEngagement = (action) => {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.session?.userId;
        if (userId) {
          switch (action) {
            case "story_created":
              engagementTracker.onStoryCreated(userId);
              break;
            case "story_liked":
            case "story_upvoted":
            case "story_downvoted":
            case "story_played":
              break;
          }
        }
      }
      return originalJson.call(this, data);
    };
    next();
  };
};
var trackStoryInteraction = async (storyId, interactionType) => {
  try {
    const { Story: Story2 } = await Promise.resolve().then(() => (init_story_model(), story_model_exports));
    const story = await Story2.findById(storyId);
    if (story && story.userId) {
      engagementTracker.onStoryInteraction(story.userId, interactionType);
    }
  } catch (error) {
    console.error(`Error tracking story interaction for story ${storyId}:`, error);
  }
};
var runDailyBadgeCheck = async () => {
  try {
    console.log("\u{1F550} Starting daily badge check for all users...");
    const { User: User2 } = await Promise.resolve().then(() => (init_user_model(), user_model_exports));
    const users = await User2.find({}, "_id").lean();
    let processedCount = 0;
    let errorCount = 0;
    for (const user of users) {
      try {
        const result = await badgeService.processUserBadges(user._id.toString());
        if (result.newBadges.length > 0) {
          console.log(`\u{1F4CA} Daily check: User ${user._id} earned badges: ${result.newBadges.join(", ")}`);
        }
        processedCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error in daily badge check for user ${user._id}:`, error);
        errorCount++;
      }
    }
    console.log(`\u2705 Daily badge check completed. Processed: ${processedCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error("Error running daily badge check:", error);
  }
};

// server/controllers/story.controller.ts
var trackStoryGeneration = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found for tracking story generation");
      return;
    }
    if (!user.usageThisMonth) {
      user.usageThisMonth = {
        storiesGenerated: 0,
        chaptersGenerated: 0,
        audioMinutesUsed: 0,
        lastResetDate: /* @__PURE__ */ new Date()
      };
    }
    const now = /* @__PURE__ */ new Date();
    const lastReset = new Date(user.usageThisMonth.lastResetDate);
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      user.usageThisMonth = {
        storiesGenerated: 1,
        chaptersGenerated: 0,
        audioMinutesUsed: 0,
        lastResetDate: now
      };
    } else {
      user.usageThisMonth.storiesGenerated += 1;
    }
    await user.save();
    console.log(`Tracked story generation for user ${userId}. Total this month: ${user.usageThisMonth.storiesGenerated}`);
  } catch (error) {
    console.error("Error tracking story generation:", error);
  }
};
var createStory2 = async (req, res) => {
  try {
    const settingsSchema = z2.object({
      title: z2.string().min(1, "Title is required"),
      settings: storySettingsSchema,
      maxTokens: z2.number().optional(),
      isPublic: z2.boolean().optional().default(false),
      accessType: z2.enum(["public", "private", "premium_exclusive"]).optional().default("public"),
      category: z2.string().optional().default("romance")
    });
    const { title, settings, maxTokens, isPublic, accessType, category } = settingsSchema.parse(req.body);
    const userId = req.session.userId;
    if (!userId) {
      throw new Error("User not found");
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (accessType === "premium_exclusive") {
      if (user.subscription !== "seduction" && user.subscription !== "intimacy") {
        return res.status(403).json({
          message: "Exclusive premium story creation is only available for Seduction and Intimacy subscribers",
          code: "PREMIUM_EXCLUSIVE_REQUIRED",
          isPremiumRequired: true,
          requiredPlans: ["seduction", "intimacy"],
          currentPlan: user.subscription,
          upgradeMessage: "Upgrade to Seduction or Intimacy plan to create exclusive premium stories"
        });
      }
    }
    if (accessType === "premium_early_access") {
      const allowedPlans = ["essentiel", "seduction", "intimacy"];
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
    const storyLength = settings.length;
    let textCreditCost = 1;
    if (storyLength === 2) textCreditCost = 1;
    else if (storyLength === 3) textCreditCost = 2;
    else if (storyLength === 4) textCreditCost = 4;
    if (user.textCredits < textCreditCost) {
      return res.status(402).json({
        message: `Insufficient text credits. You need ${textCreditCost} text credits but only have ${user.textCredits}.`,
        code: "INSUFFICIENT_TEXT_CREDITS",
        required: textCreditCost,
        available: user.textCredits
      });
    }
    try {
      const story = await createStory(title, settings, maxTokens, userId, isPublic, category, accessType, textCreditCost);
      await trackStoryGeneration(userId);
      res.status(201).json(story);
    } catch (storyGenError) {
      console.error("Error in story generation service:", storyGenError);
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
    if (error instanceof Error && error.message.includes("Insufficient text credits")) {
      return res.status(402).json({
        message: error.message,
        code: "INSUFFICIENT_TEXT_CREDITS",
        isPremiumRequired: false
      });
    }
    if (error instanceof Error && error.message.includes("Insufficient audio credits")) {
      return res.status(402).json({
        message: error.message,
        code: "INSUFFICIENT_AUDIO_CREDITS",
        isPremiumRequired: false
      });
    }
    if (error instanceof Error && (error.message === "INSUFFICIENT_CREDITS" || error.message.includes("Insufficient credits"))) {
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
    const userId = req.session?.userId;
    let storyWithInteractions = story.toObject();
    if (userId) {
      const likedBy = story.likedBy || [];
      const upvotedBy = story.upvotedBy || [];
      const downvotedBy = story.downvotedBy || [];
      storyWithInteractions = {
        ...storyWithInteractions,
        hasLiked: likedBy.includes(userId),
        hasUpvoted: upvotedBy.includes(userId),
        hasDownvoted: downvotedBy.includes(userId)
      };
    } else {
      storyWithInteractions = {
        ...storyWithInteractions,
        hasLiked: false,
        hasUpvoted: false,
        hasDownvoted: false
      };
    }
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
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(storyWithInteractions);
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
    const { selectedChoice, choice, conclude } = req.body;
    const finalChoice = selectedChoice || choice;
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const continuedStory = await continueStoryService(id, finalChoice, conclude);
    res.status(200).json(continuedStory);
  } catch (error) {
    console.error("Error continuing story:", error);
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
      res.setHeader("Cache-Control", "no-cache");
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
      res.setHeader("Cache-Control", "no-cache");
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
var unlockChapter = async (req, res) => {
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
    const chapter = story.chapters.find((ch) => ch.number === chapterNum);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    const textCreditCost = chapter.textCreditsCost || chapter.creditsCost || 1;
    if (user.textCredits < textCreditCost) {
      return res.status(402).json({
        message: `Insufficient text credits to unlock this chapter. Required: ${textCreditCost}, Available: ${user.textCredits}`,
        code: "INSUFFICIENT_TEXT_CREDITS",
        required: textCreditCost,
        available: user.textCredits
      });
    }
    user.textCredits -= textCreditCost;
    user.unlockedChapters.push({ storyId: story._id, chapterNumber: chapterNum });
    await user.save();
    res.status(200).json({ message: "Chapter unlocked successfully" });
  } catch (error) {
    console.error("Error unlocking chapter:", error);
    res.status(500).json({ message: "Failed to unlock chapter" });
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
    if (!story.likedBy) story.likedBy = [];
    const hasLiked = story.likedBy.includes(userId);
    if (hasLiked) {
      story.likedBy = story.likedBy.filter((uid) => uid !== userId);
      story.likes = Math.max(0, (story.likes || 0) - 1);
    } else {
      story.likedBy.push(userId);
      story.likes = (story.likes || 0) + 1;
      await trackStoryInteraction(id, "like");
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
    if (!story.upvotedBy) story.upvotedBy = [];
    if (!story.downvotedBy) story.downvotedBy = [];
    const hasUpvoted = story.upvotedBy.includes(userId);
    const hasDownvoted = story.downvotedBy.includes(userId);
    if (hasUpvoted) {
      story.upvotedBy = story.upvotedBy.filter((uid) => uid !== userId);
      story.upvotes = Math.max(0, (story.upvotes || 0) - 1);
    } else {
      story.upvotedBy.push(userId);
      story.upvotes = (story.upvotes || 0) + 1;
      if (hasDownvoted) {
        story.downvotedBy = story.downvotedBy.filter((uid) => uid !== userId);
        story.downvotes = Math.max(0, (story.downvotes || 0) - 1);
      }
      await trackStoryInteraction(id, "upvote");
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
    if (!story.upvotedBy) story.upvotedBy = [];
    if (!story.downvotedBy) story.downvotedBy = [];
    const hasUpvoted = story.upvotedBy.includes(userId);
    const hasDownvoted = story.downvotedBy.includes(userId);
    if (hasDownvoted) {
      story.downvotedBy = story.downvotedBy.filter((uid) => uid !== userId);
      story.downvotes = Math.max(0, (story.downvotes || 0) - 1);
    } else {
      story.downvotedBy.push(userId);
      story.downvotes = (story.downvotes || 0) + 1;
      if (hasUpvoted) {
        story.upvotedBy = story.upvotedBy.filter((uid) => uid !== userId);
        story.upvotes = Math.max(0, (story.upvotes || 0) - 1);
      }
      await trackStoryInteraction(id, "downvote");
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
var updateVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.session?.userId;
    const updated = await setStoryVisibility(userId, id, isPublic);
    return res.json(updated);
  } catch (error) {
    console.error("Error updating story visibility:", error);
    const status = error?.status || 500;
    const body = { message: error?.message || "Failed to update story visibility" };
    if (error?.code) {
      body.code = error.code;
      if (error.code === "PREMIUM_REQUIRED") body.isPremiumRequired = true;
    }
    return res.status(status).json(body);
  }
};
var voiceOptions = async (_req, res) => {
  try {
    const voices = await getVoiceOptionsService();
    res.json(voices);
  } catch (error) {
    console.error("Error fetching voice options:", error);
    res.status(500).json({ message: "Failed to fetch voice options" });
  }
};
var getPublicStoriesList = async (req, res) => {
  try {
    const userId = req.session?.userId;
    const stories = await getPublicStoriesService(userId);
    res.json(stories);
  } catch (error) {
    console.error("Error fetching public stories:", error);
    res.status(500).json({ message: "Failed to fetch public stories" });
  }
};
var getStoriesByCategoryController = async (req, res) => {
  try {
    const { category } = req.params;
    const stories = await getStoriesByCategoryService(category);
    res.json(stories);
  } catch (error) {
    const status = error?.status || 500;
    const msg = error?.message || "Failed to fetch stories by category";
    console.error("Error fetching stories for category:", error);
    res.status(status).json({ message: msg });
  }
};
var getPremiumStoriesController = async (req, res) => {
  try {
    const userId = req.session.userId;
    const stories = await getPremiumStoriesService(userId);
    res.json(stories);
  } catch (error) {
    const status = error?.status || 500;
    const body = { message: error?.message || "Failed to fetch premium stories" };
    if (error?.code === "PREMIUM_REQUIRED") {
      body.currentSubscription = error.currentSubscription;
      body.requiredSubscriptions = error.requiredSubscriptions;
    }
    console.error("Error fetching premium stories:", error);
    res.status(status).json(body);
  }
};

// server/routes/story.route.ts
var router2 = Router2();
router2.get("/voice-options", voiceOptions);
router2.route("/generate").post(authMiddleware, trackEngagement("story_created"), createStory2);
router2.route("/title-suggestions").post(authMiddleware, titleSuggestions);
router2.get("/public", getPublicStoriesList);
router2.get("/by-category/:category", getStoriesByCategoryController);
router2.get("/premium-stories", authMiddleware, getPremiumStoriesController);
router2.route("/:id").get(getStory2);
router2.route("/:id").put(authMiddleware, updateStory);
router2.route("/:id").delete(authMiddleware, deleteStory2);
router2.route("/:id/continue").post(authMiddleware, continueStory2);
router2.route("/:id/audio").get(getStoryAudio);
router2.route("/:id/chapters").get(getStoryChapters);
router2.route("/:id/chapters/:chapterNumber").get(getStoryChapter);
router2.route("/:id/chapters/:chapterNumber/choices").get(getChapterChoices);
router2.route("/:id/chapters/:chapterNumber/choice").post(authMiddleware, continueStory2);
router2.route("/:id/chapters/:chapterNumber/unlock").post(authMiddleware, unlockChapter);
router2.route("/:id/like").post(authMiddleware, likeStory);
router2.route("/:id/upvote").post(authMiddleware, upvoteStory);
router2.route("/:id/downvote").post(authMiddleware, downvoteStory);
router2.patch("/:id/visibility", authMiddleware, updateVisibility);
var story_route_default = router2;

// server/routes/admin.route.ts
import { Router as Router3 } from "express";

// server/services/admin.service.ts
init_user_model();
init_story_model();
import { hash } from "bcrypt";
var AdminServiceError = class extends Error {
  status;
  code;
  constructor(message, status, code) {
    super(message);
    this.name = "AdminServiceError";
    if (status) this.status = status;
    if (code) this.code = code;
  }
};
var listUsers = async () => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return users;
};
var getUserById = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) throw new AdminServiceError("User not found", 404);
  return user;
};
var createUserAdmin = async (data) => {
  const { name, email, password, role, isPremium } = data;
  const existing = await User.findOne({ email });
  if (existing) throw new AdminServiceError("Email already in use", 400, "EMAIL_IN_USE");
  const hashedPassword = await hash(password, 10);
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role: role || "user",
    isPremium: isPremium || false
  });
  await newUser.save();
  const out = { ...newUser.toObject() };
  delete out.password;
  return out;
};
var updateUserAdmin = async (id, data) => {
  const { name, email, role, isPremium } = data;
  const user = await User.findById(id);
  if (!user) throw new AdminServiceError("User not found", 404);
  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) throw new AdminServiceError("Email already in use", 400, "EMAIL_IN_USE");
  }
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (typeof isPremium !== "undefined") user.isPremium = !!isPremium;
  await user.save();
  const out = { ...user.toObject() };
  delete out.password;
  return out;
};
var deleteUserAdmin = async (id) => {
  const result = await User.findByIdAndDelete(id);
  if (!result) throw new AdminServiceError("User not found", 404);
  await Story.deleteMany({ userId: id });
  return { message: "User and associated stories deleted successfully" };
};
var listStoriesAdmin = async () => {
  const stories = await Story.find().sort({ createdAt: -1 });
  const enhanced = await Promise.all(stories.map(async (story) => {
    const user = await User.findById(story.userId).select("name");
    const obj = story.toObject();
    obj.userName = user ? user.name : "Unknown User";
    return obj;
  }));
  return enhanced;
};
var setStoryVisibilityAdmin = async (storyId, isPublic) => {
  const story = await Story.findById(storyId);
  if (!story) throw new AdminServiceError("Story not found", 404);
  story.isPublic = isPublic;
  await story.save();
  return story;
};
var deleteStoryAdmin = async (storyId) => {
  const result = await Story.findByIdAndDelete(storyId);
  if (!result) throw new AdminServiceError("Story not found", 404);
  return { message: "Story deleted successfully" };
};
var awardTopAuthorAdmin = async () => {
  const { checkAndAwardTopAuthor: checkAndAwardTopAuthor2 } = await Promise.resolve().then(() => (init_reward_service(), reward_service_exports));
  await checkAndAwardTopAuthor2();
  return { message: "Top author check and award initiated." };
};

// server/controllers/admin.controller.ts
var getAllUsers = async (_req, res) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
var getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || "Failed to fetch user" });
  }
};
var createUser = async (req, res) => {
  try {
    const { name, email, password, role, isPremium } = req.body;
    const created = await createUserAdmin({ name, email, password, role, isPremium });
    res.status(201).json(created);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || "Failed to create user", code: error?.code });
  }
};
var updateUser = async (req, res) => {
  try {
    const { name, email, role, isPremium } = req.body;
    const updated = await updateUserAdmin(req.params.id, { name, email, role, isPremium });
    res.json(updated);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || "Failed to update user", code: error?.code });
  }
};
var deleteUser = async (req, res) => {
  try {
    const result = await deleteUserAdmin(req.params.id);
    res.json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || "Failed to delete user" });
  }
};
var getAllStories = async (_req, res) => {
  try {
    const stories = await listStoriesAdmin();
    res.json(stories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
};
var updateStoryVisibility = async (req, res) => {
  try {
    const { isPublic } = req.body;
    const story = await setStoryVisibilityAdmin(req.params.id, isPublic);
    res.json(story);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || "Failed to update story visibility" });
  }
};
var deleteStory3 = async (req, res) => {
  try {
    const result = await deleteStoryAdmin(req.params.id);
    res.json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || "Failed to delete story" });
  }
};
var awardTopAuthor = async (_req, res) => {
  try {
    const result = await awardTopAuthorAdmin();
    res.json(result);
  } catch (error) {
    console.error("Error awarding top author:", error);
    res.status(500).json({ message: "Failed to award top author." });
  }
};

// server/routes/admin.route.ts
var router3 = Router3();
router3.get("/users", isAdmin, getAllUsers);
router3.get("/users/:id", isAdmin, getUser);
router3.post("/users", isAdmin, createUser);
router3.patch("/users/:id", isAdmin, updateUser);
router3.delete("/users/:id", isAdmin, deleteUser);
router3.get("/stories", isAdmin, getAllStories);
router3.patch("/stories/:id/visibility", isAdmin, updateStoryVisibility);
router3.delete("/stories/:id", isAdmin, deleteStory3);
router3.post("/award-top-author", isAdmin, awardTopAuthor);
var admin_route_default = router3;

// server/routes/user.route.ts
import { Router as Router4 } from "express";

// server/services/user.service.ts
init_user_model();
init_story_model();
var UserServiceError = class extends Error {
  status;
  code;
  constructor(message, status, code) {
    super(message);
    this.name = "UserServiceError";
    if (status) this.status = status;
    if (code) this.code = code;
  }
};
var debugAndFixSubscription = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new UserServiceError("User not found", 404);
  if (user.isPremium && user.subscription === "free") {
    const before = "free";
    const inferredPlan = "essentiel";
    user.subscription = inferredPlan;
    await user.save();
    return {
      message: "Fixed subscription status",
      before,
      after: inferredPlan,
      userStatus: {
        isPremium: user.isPremium,
        subscription: user.subscription,
        textCredits: user.textCredits,
        audioCredits: user.audioCredits
      }
    };
  }
  return {
    message: "Subscription status is correct",
    userStatus: {
      isPremium: user.isPremium,
      subscription: user.subscription,
      textCredits: user.textCredits,
      audioCredits: user.audioCredits
    }
  };
};
var getStoriesForUser = async (userId) => {
  const stories = await Story.find({ userId }).sort({ createdAt: -1 });
  return stories;
};
var setUserStoryVisibility = async (userId, storyId, isPublic) => {
  return await setStoryVisibility(userId, storyId, isPublic);
};
var deleteUserStory = async (userId, storyId) => {
  const story = await Story.findById(storyId);
  if (!story) throw new UserServiceError("Story not found", 404);
  if (story.userId !== userId) throw new UserServiceError("You don't have permission to delete this story", 403);
  return await deleteStory(storyId, userId);
};

// server/controllers/user.controller.ts
var debugSubscription = async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await debugAndFixSubscription(userId);
    res.json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || "Failed to check subscription" });
  }
};
var getMyStories = async (req, res) => {
  try {
    const userId = req.session.userId;
    const stories = await getStoriesForUser(userId);
    res.json(stories);
  } catch (error) {
    console.error("Error fetching user stories:", error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
};
var updateMyStoryVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.session.userId;
    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ message: "Invalid visibility status" });
    }
    const story = await setUserStoryVisibility(userId, id, isPublic);
    res.json(story);
  } catch (error) {
    const status = error?.status || 500;
    const body = { message: error?.message || "Failed to update story visibility" };
    if (error?.code) body.code = error.code;
    res.status(status).json(body);
  }
};
var removeMyStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const result = await deleteUserStory(userId, id);
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || "Failed to delete story" });
  }
};

// server/routes/user.route.ts
var router4 = Router4();
router4.use(authMiddleware);
router4.get("/debug-subscription", debugSubscription);
router4.get("/stories", getMyStories);
router4.patch("/stories/:id/visibility", updateMyStoryVisibility);
router4.delete("/stories/:id", removeMyStory);
var user_route_default = router4;

// server/routes/payment.route.ts
import { Router as Router5 } from "express";

// server/config/stripe.ts
import Stripe from "stripe";
import dotenv6 from "dotenv";
dotenv6.config();
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

// server/services/payment.service.ts
init_user_model();
import { z as z3 } from "zod";
var PaymentService = class {
  async createSubscriptionCheckout(userId, planId, origin) {
    const { SUBSCRIPTION_PLANS: SUBSCRIPTION_PLANS2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
    const schema = z3.object({
      planId: z3.enum(["essentiel", "seduction", "intimacy"])
    });
    const { planId: validatedPlanId } = schema.parse({ planId });
    const selectedPlan = SUBSCRIPTION_PLANS2[validatedPlanId];
    if (!selectedPlan) {
      throw new Error("Invalid plan ID");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const priceInCents = selectedPlan.price;
    const clientReferenceId = `seduise_app_${userId}_${Date.now()}`;
    const session2 = await stripe_default.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: selectedPlan.name,
              description: `${selectedPlan.description} - ${selectedPlan.monthlyCredits.text} text + ${selectedPlan.monthlyCredits.audio} audio credits/month`
            },
            unit_amount: priceInCents,
            recurring: {
              interval: "month"
            }
          },
          quantity: 1
        }
      ],
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: clientReferenceId,
      success_url: `${origin}/payment/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${validatedPlanId}`,
      cancel_url: `${origin}/premium-upgrade`,
      metadata: {
        userId,
        plan: validatedPlanId,
        textCredits: selectedPlan.monthlyCredits.text.toString(),
        audioCredits: selectedPlan.monthlyCredits.audio.toString(),
        type: "subscription_purchase"
      }
    });
    return { id: session2.id };
  }
  async createCreditCheckout(userId, packageId, origin) {
    const { COMBO_CREDIT_PACKAGES: COMBO_CREDIT_PACKAGES2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
    const schema = z3.object({
      packageId: z3.enum(["starter", "popular", "premium"]).default("popular")
    });
    const { packageId: validatedPackageId } = schema.parse({ packageId });
    const packageMapping = {
      "starter": "combo_starter",
      "popular": "combo_popular",
      "premium": "combo_premium"
    };
    const mappedPackageId = packageMapping[validatedPackageId];
    const selectedPackage = COMBO_CREDIT_PACKAGES2[mappedPackageId];
    if (!selectedPackage) {
      throw new Error("Invalid package ID");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const priceInCents = selectedPackage.price;
    const clientReferenceId = `seduise_app_${userId}_${Date.now()}`;
    const session2 = await stripe_default.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.textCredits} text + ${selectedPackage.audioCredits} audio credits - ${selectedPackage.description}`
            },
            unit_amount: priceInCents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      customer_email: user.email,
      client_reference_id: clientReferenceId,
      success_url: `${origin}/payment/credit-success?session_id={CHECKOUT_SESSION_ID}&textCredits=${selectedPackage.textCredits}&audioCredits=${selectedPackage.audioCredits}&package=${validatedPackageId}`,
      cancel_url: `${origin}/credits`,
      metadata: {
        userId,
        packageId: validatedPackageId,
        textCredits: selectedPackage.textCredits.toString(),
        audioCredits: selectedPackage.audioCredits.toString(),
        type: "credit_purchase"
      }
    });
    return { id: session2.id };
  }
  async processCreditSuccess(sessionId, credits, packageId, userId) {
    if (!sessionId) {
      if (userId) {
      } else {
        return {
          success: true,
          message: "Credit purchase completed (demo mode)",
          demo: true
        };
      }
    }
    let creditsToAdd = parseInt(credits) || 0;
    if (creditsToAdd <= 0 && packageId) {
      const { CREDIT_PACKAGES } = await Promise.resolve().then(() => (init_plans(), plans_exports));
      const packageKey = packageId;
      if (CREDIT_PACKAGES[packageKey]) {
        creditsToAdd = CREDIT_PACKAGES[packageKey].credits;
      }
    }
    if (creditsToAdd <= 0) {
      creditsToAdd = 50;
    }
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.credits = (user.credits || 0) + creditsToAdd;
        await user.save();
        return {
          success: true,
          message: "Credits added successfully!",
          credits: user.credits
        };
      }
    }
    return { success: true, message: "Credit purchase successful!" };
  }
  async updateUserCredits(userId, credits) {
    if (!credits || isNaN(credits)) {
      throw new Error("Invalid credit amount");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.credits = (user.credits || 0) + credits;
    await user.save();
    return {
      success: true,
      message: "Credits updated successfully",
      credits: user.credits
    };
  }
  async processSubscriptionSuccessWithStripeVerification(sessionId, plan, userId) {
    const session2 = await stripe_default.checkout.sessions.retrieve(sessionId);
    const isPaymentSuccessful = session2.payment_status === "paid" || session2.status === "complete" && session2.payment_status !== "unpaid";
    if (!isPaymentSuccessful) {
      throw new Error(`Payment not completed: status=${session2.status}, payment_status=${session2.payment_status}`);
    }
    let actualUserId = session2.metadata?.userId || userId;
    if (!actualUserId && session2.client_reference_id) {
      const refParts = session2.client_reference_id.split("_");
      if (refParts.length >= 3 && refParts[0] === "seduise" && refParts[1] === "app") {
        actualUserId = refParts[2];
      }
    }
    if (!actualUserId) {
      throw new Error("User identification failed");
    }
    let actualPlan = session2.metadata?.plan || plan;
    if (!actualPlan || !["essentiel", "seduction", "intimacy"].includes(actualPlan)) {
      throw new Error("Invalid subscription plan");
    }
    const user = await User.findById(actualUserId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.processedSessions && user.processedSessions.includes(sessionId)) {
      return {
        success: true,
        message: "Subscription already processed",
        plan: actualPlan,
        alreadyProcessed: true,
        textCredits: 0,
        audioCredits: 0,
        totalTextCredits: user.textCredits,
        totalAudioCredits: user.audioCredits
      };
    }
    const { SUBSCRIPTION_PLANS: SUBSCRIPTION_PLANS2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
    const planDetails = SUBSCRIPTION_PLANS2[actualPlan];
    if (!planDetails) {
      throw new Error("Plan details not found");
    }
    user.isPremium = true;
    user.subscription = actualPlan;
    if (!user.processedSessions) {
      user.processedSessions = [];
    }
    user.processedSessions.push(sessionId);
    const creditsToAdd = planDetails.monthlyCredits;
    user.textCredits = (user.textCredits || 0) + creditsToAdd.text;
    user.audioCredits = (user.audioCredits || 0) + creditsToAdd.audio;
    user.usageThisMonth = {
      storiesGenerated: 0,
      chaptersGenerated: 0,
      textCreditsUsed: 0,
      audioCreditsUsed: 0,
      lastResetDate: /* @__PURE__ */ new Date()
    };
    await user.save();
    return {
      success: true,
      message: "Subscription activated successfully",
      plan: actualPlan,
      textCredits: creditsToAdd.text,
      audioCredits: creditsToAdd.audio,
      totalTextCredits: user.textCredits,
      totalAudioCredits: user.audioCredits
    };
  }
  async processCreditSuccessWithStripeVerification(sessionId, credits, packageId, userId) {
    const session2 = await stripe_default.checkout.sessions.retrieve(sessionId);
    const isPaymentSuccessful = session2.payment_status === "paid" || session2.status === "complete" && session2.payment_status !== "unpaid";
    if (!isPaymentSuccessful) {
      throw new Error(`Payment not completed: status=${session2.status}, payment_status=${session2.payment_status}`);
    }
    let actualUserId = session2.metadata?.userId || userId;
    if (!actualUserId && session2.client_reference_id) {
      const refParts = session2.client_reference_id.split("_");
      if (refParts.length >= 2 && refParts[0] === "user") {
        actualUserId = refParts[1];
      }
    }
    if (!actualUserId) {
      throw new Error("User identification failed");
    }
    let textCreditsToAdd = 0;
    let audioCreditsToAdd = 0;
    if (session2.metadata?.textCredits && session2.metadata?.audioCredits) {
      textCreditsToAdd = parseInt(session2.metadata.textCredits);
      audioCreditsToAdd = parseInt(session2.metadata.audioCredits);
    } else if (packageId || session2.metadata?.packageId) {
      const pkgId = packageId || session2.metadata?.packageId;
      const { COMBO_CREDIT_PACKAGES: COMBO_CREDIT_PACKAGES2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
      const packageMapping = {
        "starter": "combo_starter",
        "popular": "combo_popular",
        "premium": "combo_premium"
      };
      const mappedPackageId = packageMapping[pkgId];
      if (mappedPackageId && COMBO_CREDIT_PACKAGES2[mappedPackageId]) {
        const pkg = COMBO_CREDIT_PACKAGES2[mappedPackageId];
        textCreditsToAdd = pkg.textCredits;
        audioCreditsToAdd = pkg.audioCredits;
      }
    }
    if (textCreditsToAdd <= 0 && audioCreditsToAdd <= 0) {
      textCreditsToAdd = 14;
      audioCreditsToAdd = 6;
    }
    const user = await User.findById(actualUserId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.processedSessions && user.processedSessions.includes(sessionId)) {
      return {
        success: true,
        message: "Credits already processed",
        alreadyProcessed: true,
        textCredits: 0,
        audioCredits: 0,
        totalTextCredits: user.textCredits || 0,
        totalAudioCredits: user.audioCredits || 0
      };
    }
    if (!user.processedSessions) {
      user.processedSessions = [];
    }
    user.processedSessions.push(sessionId);
    const previousTextCredits = user.textCredits || 0;
    const previousAudioCredits = user.audioCredits || 0;
    user.textCredits = previousTextCredits + textCreditsToAdd;
    user.audioCredits = previousAudioCredits + audioCreditsToAdd;
    await user.save();
    return {
      success: true,
      message: "Payment successful and credits added",
      textCredits: textCreditsToAdd,
      audioCredits: audioCreditsToAdd,
      totalTextCredits: user.textCredits,
      totalAudioCredits: user.audioCredits
    };
  }
  async processWebhookEvent(event) {
    if (event.type === "checkout.session.completed") {
      const session2 = event.data.object;
      const isPaymentSuccessful = session2.payment_status === "paid" || session2.status === "complete" && session2.payment_status !== "unpaid";
      if (!isPaymentSuccessful) {
        throw new Error(`Payment not completed: status=${session2.status}, payment_status=${session2.payment_status}`);
      }
      let userId = session2.metadata?.userId;
      if (!userId && session2.client_reference_id) {
        const refParts = session2.client_reference_id.split("_");
        if (refParts.length >= 2 && refParts[0] === "user") {
          userId = refParts[1];
        }
      }
      if (!userId) {
        throw new Error("User ID not found in session metadata or client reference");
      }
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      const purchaseType = session2.metadata?.type;
      if (purchaseType === "credit_purchase") {
        const creditsToAdd = parseInt(session2.metadata?.credits || "0");
        if (creditsToAdd > 0) {
          user.credits = (user.credits || 0) + creditsToAdd;
          await user.save();
          return { message: `Added ${creditsToAdd} credits to user ${userId}` };
        } else {
          throw new Error("Invalid credit amount");
        }
      } else if (purchaseType === "subscription_purchase") {
        return { message: `Subscription purchase detected - will be processed via success page` };
      } else {
        return { message: `Unknown purchase type: ${purchaseType}` };
      }
    }
    return { message: "Event processed successfully" };
  }
  async verifyWebhookSignature(body, signature) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      return {
        type: "checkout.session.completed",
        data: { object: body },
        id: "dev_" + Date.now()
      };
    } else {
      return stripe_default.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
    }
  }
};
var paymentService = new PaymentService();

// server/controllers/payment.controller.ts
import { z as z4 } from "zod";
var PaymentController = class {
  async createSubscriptionCheckout(req, res) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const { planId } = req.body;
      const origin = req.headers.origin || "https://" + req.headers.host;
      const result = await paymentService.createSubscriptionCheckout(userId, planId, origin);
      res.json(result);
    } catch (error) {
      console.error("Error creating subscription checkout session:", error);
      if (error instanceof z4.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create subscription checkout session" });
    }
  }
  async createCreditCheckout(req, res) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const { packageId } = req.body;
      const origin = req.headers.origin || "https://" + req.headers.host;
      const result = await paymentService.createCreditCheckout(userId, packageId, origin);
      res.json(result);
    } catch (error) {
      console.error("Error creating credit checkout session:", error);
      if (error instanceof z4.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  }
  async creditSuccessPost(req, res) {
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
      const userId = req.session.userId;
      const result = await paymentService.processCreditSuccess(
        session_id,
        credits,
        packageId,
        userId
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error processing credit purchase:", error);
      res.status(500).json({ success: false, message: "Failed to process credit purchase" });
    }
  }
  async updateCredits(req, res) {
    try {
      const { credits } = req.body;
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }
      const result = await paymentService.updateUserCredits(userId, parseInt(credits));
      console.log(`Added ${credits} credits to user ${userId} via direct update`);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating credits:", error);
      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: "Failed to update credits" });
    }
  }
  async subscriptionSuccessGet(req, res) {
    try {
      const session_id = req.query.session_id || req.query.CHECKOUT_SESSION_ID;
      const plan = req.query.plan;
      console.log("GET Subscription success handler received:", {
        session_id,
        plan,
        query: req.query
      });
      if (!session_id || typeof session_id !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID"
        });
      }
      const userId = req.session.userId;
      const result = await paymentService.processSubscriptionSuccessWithStripeVerification(
        session_id,
        plan,
        userId
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error processing subscription success:", error);
      if (error instanceof Error) {
        if (error.message.includes("Payment not completed")) {
          return res.status(402).json({
            success: false,
            message: "Payment not completed. Please complete the payment and try again."
          });
        }
        if (error.message.includes("User identification failed")) {
          return res.status(400).json({
            success: false,
            message: "User identification failed. Please contact support."
          });
        }
        if (error.message.includes("User not found")) {
          return res.status(404).json({
            success: false,
            message: "User not found. Please contact support."
          });
        }
      }
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred. Please contact support."
      });
    }
  }
  async creditSuccessGet(req, res) {
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
      if (!session_id || typeof session_id !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID"
        });
      }
      const userId = req.session.userId;
      const result = await paymentService.processCreditSuccessWithStripeVerification(
        session_id,
        credits,
        packageId,
        userId
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error processing credit success:", error);
      if (error instanceof Error) {
        if (error.message.includes("Payment not completed")) {
          return res.status(402).json({
            success: false,
            message: "Payment not completed. Please complete the payment and try again."
          });
        }
        if (error.message.includes("User identification failed")) {
          return res.status(400).json({
            success: false,
            message: "User identification failed. Please contact support."
          });
        }
        if (error.message.includes("User not found")) {
          return res.status(404).json({
            success: false,
            message: "User not found. Please contact support."
          });
        }
        if (error.message.includes("Error retrieving Stripe session")) {
          return res.status(500).json({
            success: false,
            message: "Error verifying payment. Please contact support."
          });
        }
      }
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred. Please contact support."
      });
    }
  }
  async webhook(req, res) {
    console.log(`Webhook received [${(/* @__PURE__ */ new Date()).toISOString()}]`);
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      console.error("Webhook Error: No stripe-signature header provided");
      return res.status(400).send("Webhook Error: No signature provided");
    }
    console.log(`Stripe signature received: ${signature.substring(0, 20)}...`);
    try {
      const event = await paymentService.verifyWebhookSignature(req.body, signature);
      console.log(`Webhook verified: ${event.id} [${event.type}]`);
      const result = await paymentService.processWebhookEvent(event);
      console.log("Webhook processing result:", result.message);
      res.json({ received: true });
    } catch (error) {
      console.error(`Webhook error:`, error);
      if (error.message && error.message.includes("signature verification failed")) {
        return res.status(400).send(`Webhook Error: ${error.message}`);
      }
      if (error instanceof Error) {
        return res.status(500).send(`Error processing webhook: ${error.message}`);
      }
      return res.status(500).send("Error processing webhook");
    }
  }
};
var paymentController = new PaymentController();

// server/routes/payment.route.ts
var router5 = Router5();
router5.post("/create-subscription-checkout", authMiddleware, paymentController.createSubscriptionCheckout.bind(paymentController));
router5.post("/create-credit-checkout", authMiddleware, paymentController.createCreditCheckout.bind(paymentController));
router5.post("/credit-success", paymentController.creditSuccessPost.bind(paymentController));
router5.post("/update-credits", paymentController.updateCredits.bind(paymentController));
router5.get("/credit-success", paymentController.creditSuccessGet.bind(paymentController));
router5.get("/subscription-success", paymentController.subscriptionSuccessGet.bind(paymentController));
router5.post("/webhook", paymentController.webhook.bind(paymentController));
var payment_route_default = router5;

// server/routes/badge.route.ts
import { Router as Router6 } from "express";

// server/controllers/badge.controller.ts
var getBadgeDefinitions = async (req, res) => {
  try {
    const { category, rarity } = req.query;
    const { badges, total } = listBadgeDefinitionsService(category, rarity);
    res.json({ success: true, badges, total });
  } catch (error) {
    console.error("Error fetching badge definitions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch badge definitions" });
  }
};
var getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.session.userId;
    if (userId !== requestingUserId) {
      return res.status(403).json({ success: false, message: "You can only view your own badges" });
    }
    const data = await getUserBadgesWithSummaryService(userId);
    if (!data) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, ...data });
  } catch (error) {
    console.error("Error fetching user badges:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user badges" });
  }
};
var checkUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.session.userId;
    if (userId !== requestingUserId) {
      return res.status(403).json({ success: false, message: "You can only check your own badges" });
    }
    const result = await engagementTracker.checkBadgesNow(userId);
    res.json({
      success: true,
      message: result.newBadges.length > 0 ? `Congratulations! You earned ${result.newBadges.length} new badges!` : "No new badges earned at this time.",
      newBadges: result.newBadges,
      errors: result.errors
    });
  } catch (error) {
    console.error("Error checking user badges:", error);
    res.status(500).json({ success: false, message: "Failed to check badges" });
  }
};
var getLeaderboard = async (req, res) => {
  try {
    const { limit = "10" } = req.query;
    const n = parseInt(limit, 10) || 10;
    const { leaderboard, total } = await getBadgeLeaderboardService(n);
    res.json({ success: true, leaderboard, total });
  } catch (error) {
    console.error("Error fetching badge leaderboard:", error);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
};
var runDailyCheck = async (req, res) => {
  try {
    const userRole = req.session.role;
    if (userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    runDailyBadgeCheck().catch((error) => console.error("Error in daily badge check:", error));
    res.json({ success: true, message: "Daily badge check initiated" });
  } catch (error) {
    console.error("Error initiating daily badge check:", error);
    res.status(500).json({ success: false, message: "Failed to initiate daily badge check" });
  }
};
var getBadgeStats = async (_req, res) => {
  try {
    const stats = await getBadgeStatsService();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching badge stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch badge stats" });
  }
};

// server/routes/badge.route.ts
var router6 = Router6();
router6.get("/definitions", getBadgeDefinitions);
router6.get("/user/:userId", authMiddleware, getUserBadges);
router6.post("/check/:userId", authMiddleware, checkUserBadges);
router6.get("/leaderboard", getLeaderboard);
router6.post("/admin/daily-check", authMiddleware, runDailyCheck);
router6.get("/stats", getBadgeStats);
var badge_route_default = router6;

// server/routes.ts
import mongoose from "mongoose";
async function registerRoutes(app2) {
  app2.use("/api/auth", auth_route_default);
  app2.use("/api/stories", story_route_default);
  app2.use("/api/user", user_route_default);
  app2.use("/api/admin", admin_route_default);
  app2.use("/api/payment", payment_route_default);
  app2.use("/api/badges", badge_route_default);
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
      const { text, voiceId, storyId } = z5.object({
        text: z5.string(),
        voiceId: z5.string(),
        storyId: z5.string().optional()
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
        res.json({
          audioUrl,
          fallback: isFallback,
          message: isFallback ? "Generated a fallback audio file. The text may be too complex or long for the TTS service." : void 0
        });
      } catch (error) {
        console.error("ElevenLabs API error during generation:", error);
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
      const { text, voiceId } = z5.object({
        text: z5.string(),
        voiceId: z5.string()
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
import dotenv7 from "dotenv";
dotenv7.config();
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
dotenv8.config();
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
