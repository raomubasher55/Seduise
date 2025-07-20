// Subscription plans and their limits
export const SUBSCRIPTION_PLANS = {
  discovery: {
    name: "Discovery",
    description: "Explore Without Commitment",
    price: 0, // Free tier
    monthlyLimits: {
      stories: 2,
      audioCredits: 1
    },
    features: [
      "Create up to 2 personalized stories (text)",
      "1 free audio (≈ 1 to 2 min)",
      "Standard voice",
      "No access to the premium library"
    ],
    supportsCredits: true
  },
  essentiel: {
    name: "Essentiel",
    description: "Pleasure at Your Own Pace",
    price: 599, // €5.99/month (in cents)
    monthlyLimits: {
      stories: 5,
      audioCredits: 6
    },
    features: [
      "Create up to 5 personalized stories (text)",
      "6 audio credits (≈ 15 minutes total)",
      "Natural-sounding voices",
      "No access to the premium library"
    ],
    supportsCredits: true
  },
  seduction: {
    name: "Seduction",
    description: "Your Pleasure Rendezvous",
    price: 1199, // €11.99/month (in cents)
    monthlyLimits: {
      stories: 12,
      audioCredits: 12
    },
    features: [
      "Create up to 12 personalized stories (text)",
      "12 audio credits (≈ 30 minutes)",
      "Expressive & realistic voices",
      "Partial access to the premium audio library",
      "New stories added monthly"
    ],
    supportsCredits: true
  },
  intimacy: {
    name: "Intimacy",
    description: "The Ultimate Experience Without Limits",
    price: 2499, // €24.99/month (in cents)
    monthlyLimits: {
      stories: 25,
      audioCredits: 24
    },
    features: [
      "Create up to 25 personalized stories (text)",
      "24 audio credits (≈ 60 minutes)",
      "Expressive & immersive voices",
      "Full access to the premium audio library",
      "Tailored suggestions and exclusive stories"
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
  return SUBSCRIPTION_PLANS[subscriptionType]?.monthlyLimits || SUBSCRIPTION_PLANS.discovery.monthlyLimits;
}

// Helper function to check if user has reached their limits
export function hasReachedLimit(
  usageThisMonth: {
    storiesGenerated: number;
    audioCreditsUsed: number;
  },
  subscriptionType: keyof typeof SUBSCRIPTION_PLANS,
  checkType: 'stories' | 'audioCredits'
): boolean {
  const limits = getUserLimits(subscriptionType);
  
  switch (checkType) {
    case 'stories':
      return usageThisMonth.storiesGenerated >= limits.stories;
    case 'audioCredits':
      return usageThisMonth.audioCreditsUsed >= limits.audioCredits;
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