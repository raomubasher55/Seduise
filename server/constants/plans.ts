export const SUBSCRIPTION_PLANS = {
  discovery: {
    id: "discovery",
    name: "Discovery",
    price: 0,
    billingPeriod: "free",
    description: "Explore without commitment",
    monthlyCredits: {
      text: 2,
      audio: 1,
    },
    monthlyLimits: {
      stories: 2,
      audioCredits: 1,
    },
    features: [
      "Create up to 2 personalized stories",
      "1 short audio narration",
      "Standard narration voice",
      "No premium gallery access",
    ],
  },
  essentiel: {
    id: "essentiel",
    name: "Essentiel",
    price: 599,
    billingPeriod: "monthly",
    description: "Pleasure at your own pace",
    monthlyCredits: {
      text: 5,
      audio: 6,
    },
    popular: true,
    monthlyLimits: {
      stories: 5,
      audioCredits: 6,
    },
    features: [
      "Create up to 5 personalized stories",
      "6 audio credits (~15 min total)",
      "Natural-sounding voices",
      "Basic premium gallery access",
    ],
  },
  seduction: {
    id: "seduction",
    name: "Seduction",
    price: 1199,
    billingPeriod: "monthly",
    description: "Your pleasure rendezvous",
    monthlyCredits: {
      text: 12,
      audio: 12,
    },
    monthlyLimits: {
      stories: 12,
      audioCredits: 12,
    },
    features: [
      "Create up to 12 personalized stories",
      "12 audio credits (~30 min total)",
      "Expressive & realistic voices",
      "Premium gallery early/exclusive access",
      "New premium stories every month",
    ],
  },
  intimacy: {
    id: "intimacy",
    name: "Intimacy",
    price: 2499,
    billingPeriod: "monthly",
    description: "The ultimate experience without limits",
    monthlyCredits: {
      text: 25,
      audio: 24,
    },
    bestValue: true,
    monthlyLimits: {
      stories: 25,
      audioCredits: 24,
    },
    features: [
      "Create up to 25 personalized stories",
      "24 audio credits (~60 min total)",
      "Immersive studio-quality voices",
      "Full premium gallery access",
      "Tailored suggestions & exclusives",
    ],
  },
};

export const CREDIT_COSTS = {
  text: {
    generateStory: {
      short: 1,
      medium: 2,
      long: 4,
    },
    continueStory: 1,
  },
  audio: {
    generateAudio: {
      short: 2,
      medium: 3,
      long: 5,
    },
    perMinute: 1,
  },
};

export const STORY_LENGTHS = {
  short: {
    id: 2,
    name: "Short",
    audioDurationMinutes: 3,
    creditCost: 1,
  },
  medium: {
    id: 3,
    name: "Medium",
    audioDurationMinutes: 5,
    creditCost: 2,
  },
  long: {
    id: 4,
    name: "Long",
    audioDurationMinutes: 9,
    creditCost: 4,
  },
};

export function getUserLimits(subscriptionType: keyof typeof SUBSCRIPTION_PLANS) {
  return SUBSCRIPTION_PLANS[subscriptionType]?.monthlyLimits || SUBSCRIPTION_PLANS.discovery.monthlyLimits;
}

export function getMonthlyCredits(subscriptionType: keyof typeof SUBSCRIPTION_PLANS) {
  return SUBSCRIPTION_PLANS[subscriptionType]?.monthlyCredits || SUBSCRIPTION_PLANS.discovery.monthlyCredits;
}

export function hasReachedLimit(
  usageThisMonth: {
    storiesGenerated: number;
    textCreditsUsed: number;
    audioCreditsUsed: number;
  },
  subscriptionType: keyof typeof SUBSCRIPTION_PLANS,
  checkType: "stories" | "textCredits" | "audioCredits",
): boolean {
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

export function getTextCreditCost(action: "generateStory" | "continueStory", storyLength?: number): number {
  if (action === "generateStory") {
    if (storyLength === 2) return CREDIT_COSTS.text.generateStory.short;
    if (storyLength === 3) return CREDIT_COSTS.text.generateStory.medium;
    if (storyLength === 4) return CREDIT_COSTS.text.generateStory.long;
    return CREDIT_COSTS.text.generateStory.medium;
  }

  if (action === "continueStory") {
    return CREDIT_COSTS.text.continueStory;
  }

  return 1;
}

export function getAudioCreditCost(storyLength?: number, minutes?: number): number {
  if (minutes) {
    return Math.ceil(minutes / 2.5);
  }

  if (storyLength === 2) return CREDIT_COSTS.audio.generateAudio.short;
  if (storyLength === 3) return CREDIT_COSTS.audio.generateAudio.medium;
  if (storyLength === 4) return CREDIT_COSTS.audio.generateAudio.long;
  return CREDIT_COSTS.audio.generateAudio.medium;
}
