

  // Subscription plans
  export const SUBSCRIPTION_PLANS = {
    discovery: {
      id: 'discovery',
      name: 'Discovery',
      price: 0, // Free
      billingPeriod: 'free',
      description: 'Explore Without Commitment',
      monthlyCredits: 10,
      monthlyLimits: {
        stories: 2,
        audioCredits: 1
      },
      features: [
        'Create up to 2 personalized stories (text)',
        '1 free audio',
        'Standard voice',
        'No access to the premium library',
        'Perfect to explore the world of Seduice for free'
      ]
    },
    essential: {
      id: 'essential',
      name: 'Essential',
      price: 599, // €5.99 (in cents)
      billingPeriod: 'monthly',
      description: 'Pleasure at Your Own Pace',
      monthlyCredits: 15,
      popular: true,
      monthlyLimits: {
        stories: 5,
        audioCredits: 6
      },
      features: [
        'Create up to 5 personalized stories (text)',
        '6 audio credits',
        'Natural-sounding voices',
        'No access to the premium library',
        'A soft and regular introduction to your intimate desires'
      ]
    },
    passion: {
      id: 'passion',
      name: 'Passion',
      price: 1199, // €11.99 (in cents)
      billingPeriod: 'monthly',
      description: 'Your Pleasure Rendezvous',
      monthlyCredits: 35,
      monthlyLimits: {
        stories: 12,
        audioCredits: 12
      },
      features: [
        'Create up to 12 personalized stories (text)',
        '12 audio credits',
        'Expressive & realistic voices',
        'Partial access to the premium audio library',
        'New stories added monthly',
        'Let your desires unfold like an intimate audio series'
      ]
    },
    escape: {
      id: 'escape',
      name: 'Escape',
      price: 2499, // €24.99 (in cents)
      billingPeriod: 'monthly',
      description: 'The Ultimate Experience Without Limits',
      monthlyCredits: 70,
      bestValue: true,
      monthlyLimits: {
        stories: 25,
        audioCredits: 24
      },
      features: [
        'Create up to 25 personalized stories (text)',
        '24 audio credits',
        'Expressive & immersive voices',
        'Full access to the premium audio library',
        'Tailored suggestions and exclusive stories',
        'Priority support & early feature access'
      ]
    }
  };

  // Credit packages (one-time purchases)
  export const CREDIT_PACKAGES = {
    starter: {
      id: 'starter',
      name: 'Starter Pack',
      credits: 20,
      price: 399, // €3.99 (in cents)
      description: 'Perfect for trying more stories'
    },
    popular: {
      id: 'popular',
      name: 'Popular Pack',
      credits: 50,
      price: 899, // €8.99 (in cents)
      popular: true,
      description: 'Most popular credit top-up'
    },
    premium: {
      id: 'premium',
      name: 'Power Pack',
      credits: 100,
      price: 1599, // €15.99 (in cents)
      bestValue: true,
      description: 'Maximum credits for heavy users'
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