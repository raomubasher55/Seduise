// Subscription plans and their limits
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    description: "Basic access with limited features",
    price: 0, // Free tier
    monthlyLimits: {
      stories: 0, // Free tier doesn't generate stories directly
      chapters: 3,
      audioMinutes: 0
    },
    features: [
      "Up to 3 chapters",
      "No Audio Generation",
      "Basic story customization"
    ],
    supportsCredits: true
  },
  standard: {
    name: "Standard",
    description: "Enhanced storytelling experience",
    price: 400, // $4.00/month (in cents)
    monthlyLimits: {
      stories: 0, // Standard tier doesn't generate stories directly
      chapters: 5,
      audioMinutes: 5 // Limited audio (e.g., 5 minutes) 
    },
    features: [
      "Up to 5 chapters",
      "Limited audio narration",
      "Enhanced story customization"
    ],
    supportsCredits: true
  },
  premium: {
    name: "Premium",
    description: "Ultimate storytelling experience",
    price: 2200, // $22.00/month (in cents)
    monthlyLimits: {
      stories: 0, // Premium tier doesn't generate stories directly
      chapters: 10,
      audioMinutes: 20 // Full audio (e.g., 20 minutes)
    },
    features: [
      "Up to 10 chapters",
      "Full audio narration",
      "Exclusive content access",
      "All premium voices",
      "Priority support",
      "Early access to new features"
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