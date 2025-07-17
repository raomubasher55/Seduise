// Subscription plans and their limits
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    description: "Basic access with limited features",
    price: 0, // Free tier
    monthlyLimits: {
      stories: 4,
      chapters: 12,
      audioMinutes: 3
    },
    features: [
      "Create up to 4 stories per month",
      "Generate up to 12 chapters",
      "3-minute audio narration maximum",
      "Basic voices selection",
      "Standard response time"
    ],
    supportsCredits: true
  },
  essential: {
    name: "Essential",
    description: "Enhanced storytelling experience",
    price: 499, // €4.99/month (in cents)
    monthlyLimits: {
      stories: 10,
      chapters: 50,
      audioMinutes: 10
    },
    features: [
      "Create up to 10 stories per month",
      "Generate up to 50 chapters",
      "10-minute audio narration maximum",
      "Enhanced voice selection",
      "Faster response time",
      "Ad-free experience"
    ],
    supportsCredits: true
  },
  passion: {
    name: "Passion",
    description: "Premium storytelling for enthusiasts",
    price: 999, // €9.99/month (in cents)
    monthlyLimits: {
      stories: 20,
      chapters: 100,
      audioMinutes: 15
    },
    features: [
      "Create up to 20 stories per month",
      "Generate up to 100 chapters",
      "15-minute audio narration maximum",
      "Premium voices access",
      "Premium gallery access",
      "Priority support",
      "Early access to new features"
    ],
    supportsCredits: true
  },
  escape: {
    name: "Escape",
    description: "Ultimate storytelling experience",
    price: 1999, // €19.99/month (in cents)
    monthlyLimits: {
      stories: 40,
      chapters: 200,
      audioMinutes: 20
    },
    features: [
      "Create up to 40 stories per month",
      "Generate up to 200 chapters",
      "20-minute audio narration maximum",
      "All premium voices",
      "Exclusive premium content",
      "VIP support",
      "Access to beta features"
    ],
    supportsCredits: true
  }
};

// Credit packages
export const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 20,
    price: 499, // €4.99 (in cents)
    description: 'Perfect for casual story creation'
  },
  popular: {
    id: 'popular',
    name: 'Popular Pack',
    credits: 50,
    price: 999, // €9.99 (in cents)
    popular: true,
    description: 'Most popular choice for regular users'
  },
  premium: {
    id: 'premium',
    name: 'Premium Pack',
    credits: 100,
    price: 2199, // €21.99 (in cents)
    bestValue: true,
    description: 'Best value for avid storytellers'
  }
};

// Credit costs for different actions
export const CREDIT_COSTS = {
  generateStory: {
    short: 1,    // Short story (2-3 minutes audio)
    medium: 2,   // Medium story (4-5 minutes audio)
    long: 4      // Long story (8-9 minutes audio)
  },
  audioMinute: 0.3  // Cost per minute of audio (€3 for 10 minutes → 0.3 per minute)
};

// Story length settings and their corresponding audio durations
export const STORY_LENGTHS = {
  short: {
    id: 2,
    name: "Short",
    audioDurationMinutes: 3,  // 2-3 minutes
    creditCost: 1
  },
  medium: {
    id: 3,
    name: "Medium",
    audioDurationMinutes: 5,  // 4-5 minutes
    creditCost: 2
  },
  long: {
    id: 4,
    name: "Long",
    audioDurationMinutes: 9,  // 8-9 minutes
    creditCost: 4
  }
};

// Functions to determine user limits based on subscription plan
export function getUserLimits(subscriptionType: keyof typeof SUBSCRIPTION_PLANS) {
  return SUBSCRIPTION_PLANS[subscriptionType]?.monthlyLimits || SUBSCRIPTION_PLANS.free.monthlyLimits;
}

// Helper function to check if user has reached their limits
export function hasReachedLimit(
  usageThisMonth: {
    storiesGenerated: number;
    chaptersGenerated: number;
    audioMinutesUsed: number;
  },
  subscriptionType: keyof typeof SUBSCRIPTION_PLANS,
  checkType: 'stories' | 'chapters' | 'audioMinutes'
): boolean {
  const limits = getUserLimits(subscriptionType);
  
  switch (checkType) {
    case 'stories':
      return usageThisMonth.storiesGenerated >= limits.stories;
    case 'chapters':
      return usageThisMonth.chaptersGenerated >= limits.chapters;
    case 'audioMinutes':
      return usageThisMonth.audioMinutesUsed >= limits.audioMinutes;
    default:
      return false;
  }
}

// Calculate credit cost for an action
export function getActionCreditCost(
  action: 'generateStory' | 'generateAudio',
  params?: { minutes?: number, storyLength?: number }
): number {
  if (action === 'generateStory') {
    // Determine story length tier based on params
    if (params?.storyLength) {
      if (params.storyLength === STORY_LENGTHS.short.id) {
        return CREDIT_COSTS.generateStory.short;
      } else if (params.storyLength === STORY_LENGTHS.medium.id) {
        return CREDIT_COSTS.generateStory.medium;
      } else if (params.storyLength === STORY_LENGTHS.long.id) {
        return CREDIT_COSTS.generateStory.long;
      }
    }
    // Default to medium if no length is specified
    return CREDIT_COSTS.generateStory.medium;
  } else if (action === 'generateAudio' && params?.minutes) {
    return Math.ceil(params.minutes * CREDIT_COSTS.audioMinute);
  }
  return 0;
}