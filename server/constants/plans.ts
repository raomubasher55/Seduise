

  // Subscription plans with separate text and audio credits
  export const SUBSCRIPTION_PLANS = {
    discovery: {
      id: 'discovery',
      name: 'Discovery',
      price: 0, // Free
      billingPeriod: 'free',
      description: 'Explore Without Commitment',
      monthlyCredits: {
        text: 2,
        audio: 1
      },
      monthlyLimits: {
        stories: 2,
        audioCredits: 1
      },
      features: [
        '🖋 Create up to 2 personalized stories (text)',
        '🎧 1 free audio (≈ 1 to 2 min)',
        '🎙 Standard voice',
        '📚 No access to the premium library',
        '✨ Perfect to explore the world of Seduice for free, in both text and voice'
      ]
    },
    essentiel: {
      id: 'essentiel',
      name: 'Essentiel',
      price: 599, // €5.99 (in cents)
      billingPeriod: 'monthly',
      description: 'Pleasure at Your Own Pace',
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
        '🖋 Create up to 5 personalized stories (text)',
        '🎧 6 audio credits (≈ 15 minutes total)',
        '🎙 Natural-sounding voices',
        '📚 No access to the premium library',
        '🔐 A soft and regular introduction to your intimate desires'
      ]
    },
    seduction: {
      id: 'seduction',
      name: 'Seduction',
      price: 1199, // €11.99 (in cents)
      billingPeriod: 'monthly',
      description: 'Your Pleasure Rendezvous',
      monthlyCredits: {
        text: 12,
        audio: 12
      },
      monthlyLimits: {
        stories: 12,
        audioCredits: 12
      },
      features: [
        '🖋 Create up to 12 personalized stories (text)',
        '🎧 12 audio credits (≈ 30 minutes)',
        '🎙 Expressive & realistic voices',
        '📚 Partial access to the premium audio library',
        '🎁 New stories added monthly',
        '💫 Let your desires unfold like an intimate audio series'
      ]
    },
    intimacy: {
      id: 'intimacy',
      name: 'Intimacy',
      price: 2499, // €24.99 (in cents)
      billingPeriod: 'monthly',
      description: 'The Ultimate Experience Without Limits',
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
        '🖋 Create up to 25 personalized stories (text)',
        '🎧 24 audio credits (≈ 60 minutes)',
        '🎙 Expressive & immersive voices',
        '📚 Full access to the premium audio library',
        '💌 Tailored suggestions and exclusive stories',
        '🔴 The Ultimate Experience Without Limits'
      ]
    }
  };

  // Separate credit packages for text and audio
  export const TEXT_CREDIT_PACKAGES = {
    text_starter: {
      id: 'text_starter',
      name: 'Text Pack - Starter',
      credits: 15,
      price: 299, // €2.99 (in cents)
      description: 'Perfect for more story creation'
    },
    text_popular: {
      id: 'text_popular',
      name: 'Text Pack - Popular',
      credits: 40,
      price: 699, // €6.99 (in cents)
      popular: true,
      description: 'Most popular text credits pack'
    },
    text_premium: {
      id: 'text_premium',
      name: 'Text Pack - Premium',
      credits: 80,
      price: 1199, // €11.99 (in cents)
      bestValue: true,
      description: 'Maximum text credits for heavy writers'
    }
  };

  export const AUDIO_CREDIT_PACKAGES = {
    audio_starter: {
      id: 'audio_starter',
      name: 'Audio Pack - Starter',
      credits: 10,
      price: 499, // €4.99 (in cents)
      description: 'Perfect for more audio experiences'
    },
    audio_popular: {
      id: 'audio_popular',
      name: 'Audio Pack - Popular',
      credits: 25,
      price: 999, // €9.99 (in cents)
      popular: true,
      description: 'Most popular audio credits pack'
    },
    audio_premium: {
      id: 'audio_premium',
      name: 'Audio Pack - Premium',
      credits: 50,
      price: 1799, // €17.99 (in cents)
      bestValue: true,
      description: 'Maximum audio credits for audio lovers'
    }
  };

  export const COMBO_CREDIT_PACKAGES = {
    combo_starter: {
      id: 'combo_starter',
      name: 'Combo Pack - Starter',
      textCredits: 10,
      audioCredits: 8,
      price: 599, // €5.99 (in cents)
      description: 'Best value starter combo pack'
    },
    combo_popular: {
      id: 'combo_popular',
      name: 'Combo Pack - Popular',
      textCredits: 25,
      audioCredits: 20,
      price: 1299, // €12.99 (in cents)
      popular: true,
      description: 'Best value combo pack'
    },
    combo_premium: {
      id: 'combo_premium',
      name: 'Combo Pack - Premium',
      textCredits: 50,
      audioCredits: 40,
      price: 2299, // €22.99 (in cents)
      bestValue: true,
      description: 'Ultimate combo pack for power users'
    }
  };

  // Separate credit costs for text and audio
  export const CREDIT_COSTS = {
    text: {
      generateStory: {
        short: 1,    // Short story
        medium: 2,   // Medium story
        long: 4      // Long story
      },
      continueStory: 1  // Continue/add chapter
    },
    audio: {
      generateAudio: {
        short: 2,     // ~2.5 minutes audio
        medium: 3,    // ~5 minutes audio
        long: 5       // ~8-10 minutes audio
      },
      perMinute: 1    // 1 audio credit per ~2.5 minutes
    }
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

  // Get monthly credit allocation for a subscription
  export function getMonthlyCredits(subscriptionType: keyof typeof SUBSCRIPTION_PLANS) {
    return SUBSCRIPTION_PLANS[subscriptionType]?.monthlyCredits || SUBSCRIPTION_PLANS.discovery.monthlyCredits;
  }

  // Helper function to check if user has reached their limits
  export function hasReachedLimit(
    usageThisMonth: {
      storiesGenerated: number;
      textCreditsUsed: number;
      audioCreditsUsed: number;
    },
    subscriptionType: keyof typeof SUBSCRIPTION_PLANS,
    checkType: 'stories' | 'textCredits' | 'audioCredits'
  ): boolean {
    const limits = getUserLimits(subscriptionType);
    const monthlyCredits = getMonthlyCredits(subscriptionType);
    
    switch (checkType) {
      case 'stories':
        return usageThisMonth.storiesGenerated >= limits.stories;
      case 'textCredits':
        return usageThisMonth.textCreditsUsed >= monthlyCredits.text;
      case 'audioCredits':
        return usageThisMonth.audioCreditsUsed >= monthlyCredits.audio;
      default:
        return false;
    }
  }

  // Calculate text credit cost for an action
  export function getTextCreditCost(
    action: 'generateStory' | 'continueStory',
    storyLength?: number
  ): number {
    if (action === 'generateStory') {
      if (storyLength === 2) return CREDIT_COSTS.text.generateStory.short;
      else if (storyLength === 3) return CREDIT_COSTS.text.generateStory.medium;
      else if (storyLength === 4) return CREDIT_COSTS.text.generateStory.long;
      return CREDIT_COSTS.text.generateStory.medium; // Default
    } else if (action === 'continueStory') {
      return CREDIT_COSTS.text.continueStory;
    }
    return 1;
  }

  // Calculate audio credit cost for an action
  export function getAudioCreditCost(
    storyLength?: number,
    minutes?: number
  ): number {
    if (minutes) {
      return Math.ceil(minutes / 2.5); // 1 credit per ~2.5 minutes
    }
    
    if (storyLength === 2) return CREDIT_COSTS.audio.generateAudio.short;
    else if (storyLength === 3) return CREDIT_COSTS.audio.generateAudio.medium;
    else if (storyLength === 4) return CREDIT_COSTS.audio.generateAudio.long;
    return CREDIT_COSTS.audio.generateAudio.medium; // Default
  }