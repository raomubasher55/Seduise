import { User } from '../models/user.model';
import { SUBSCRIPTION_PLANS, getUserLimits, hasReachedLimit, getActionCreditCost } from '../constants/plans';

/**
 * Update the user's usage counters when a story is generated
 */
export async function trackStoryGeneration(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  // Increment the stories generated count
  if (!user.usageThisMonth) {
    user.usageThisMonth = {
      storiesGenerated: 1,
      chaptersGenerated: 0,
      audioMinutesUsed: 0,
      lastResetDate: new Date()
    };
  } else {
    user.usageThisMonth.storiesGenerated += 1;
  }

  await user.save();
}

/**
 * Update the user's usage counters when a chapter is generated
 */
export async function trackChapterGeneration(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  // Increment the chapters generated count
  if (!user.usageThisMonth) {
    user.usageThisMonth = {
      storiesGenerated: 0,
      chaptersGenerated: 1,
      audioMinutesUsed: 0,
      lastResetDate: new Date()
    };
  } else {
    user.usageThisMonth.chaptersGenerated += 1;
  }

  await user.save();
}

/**
 * Update the user's usage counters when audio is generated
 */
export async function trackAudioGeneration(userId: string, audioLengthMinutes: number): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  // Increment the audio minutes used
  if (!user.usageThisMonth) {
    user.usageThisMonth = {
      storiesGenerated: 0,
      chaptersGenerated: 0,
      audioMinutesUsed: audioLengthMinutes,
      lastResetDate: new Date()
    };
  } else {
    user.usageThisMonth.audioMinutesUsed += audioLengthMinutes;
  }

  await user.save();
}

/**
 * Check if a user can perform an action based on their subscription limits
 * and credit balance
 */
export async function canPerformAction(
  userId: string,
  actionType: 'generateStory' | 'generateChapter' | 'generateAudio',
  params?: { audioLengthMinutes?: number, storyLength?: number }
): Promise<{ 
  canProceed: boolean;
  message?: string;
  requiredCredits?: number;
  currentCredits?: number;
  subscriptionLimitReached?: boolean;
}> {
  const user = await User.findById(userId);
  if (!user) {
    return { 
      canProceed: false,
      message: 'User not found' 
    };
  }

  // Initialize usage counters if they don't exist
  if (!user.usageThisMonth) {
    user.usageThisMonth = {
      storiesGenerated: 0,
      chaptersGenerated: 0,
      audioMinutesUsed: 0,
      lastResetDate: new Date()
    };
    await user.save();
  }

  // Reset usage counters if it's a new month
  await checkAndResetMonthlyUsage(user);

  // Get subscription limits
  const subscriptionType = user.subscription as keyof typeof SUBSCRIPTION_PLANS;
  
  // Check if the user has reached their subscription limits
  let limitReached = false;
  let limitType = '';
  
  // Ensure usageThisMonth is initialized
  const usage = user.usageThisMonth || {
    storiesGenerated: 0,
    chaptersGenerated: 0,
    audioMinutesUsed: 0,
    lastResetDate: new Date()
  };
  
  if (actionType === 'generateStory') {
    limitReached = hasReachedLimit({
      storiesGenerated: usage.storiesGenerated,
      chaptersGenerated: usage.chaptersGenerated,
      audioMinutesUsed: usage.audioMinutesUsed
    }, subscriptionType, 'stories');
    limitType = 'story generation';
  } else if (actionType === 'generateChapter') {
    limitReached = hasReachedLimit({
      storiesGenerated: usage.storiesGenerated,
      chaptersGenerated: usage.chaptersGenerated,
      audioMinutesUsed: usage.audioMinutesUsed
    }, subscriptionType, 'chapters');
    limitType = 'chapter generation';
  } else if (actionType === 'generateAudio') {
    const audioMinutes = params?.audioLengthMinutes || 0;
    
    // Check if the requested audio length exceeds the maximum allowed
    const limits = getUserLimits(subscriptionType);
    if (audioMinutes > limits.audioMinutes) {
      return {
        canProceed: false,
        message: `Your subscription allows a maximum of ${limits.audioMinutes} minutes of audio per narration. Please upgrade your plan for longer narrations.`,
      };
    }
    
    // Check if the user has enough available minutes in their monthly quota
    const remainingMinutes = limits.audioMinutes - usage.audioMinutesUsed;
    if (audioMinutes > remainingMinutes) {
      limitReached = true;
      limitType = 'audio generation';
    }
  }

  // If the user has reached their subscription limit, check if they have enough credits
  if (limitReached) {
    // Calculate required credits
    let requiredCredits = 0;
    
    if (actionType === 'generateStory') {
      requiredCredits = getActionCreditCost('generateStory', { storyLength: params?.storyLength });
    } else if (actionType === 'generateAudio' && params?.audioLengthMinutes) {
      requiredCredits = getActionCreditCost('generateAudio', { minutes: params.audioLengthMinutes });
    } else {
      // For chapters, use the same cost as a story for now, defaulting to medium length
      requiredCredits = getActionCreditCost('generateStory', { storyLength: params?.storyLength });
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

  // If subscription limits are not reached, user can proceed without using credits
  return { canProceed: true };
}

/**
 * Deduct credits from a user
 */
export async function deductCredits(userId: string, credits: number): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user || user.credits < credits) {
    return false;
  }

  user.credits -= credits;
  await user.save();
  return true;
}

/**
 * Check if it's a new month and reset usage counters if needed
 */
async function checkAndResetMonthlyUsage(user: any): Promise<void> {
  if (!user.usageThisMonth || !user.usageThisMonth.lastResetDate) {
    user.usageThisMonth = {
      storiesGenerated: 0,
      chaptersGenerated: 0,
      audioMinutesUsed: 0,
      lastResetDate: new Date()
    };
    await user.save();
    return;
  }

  const lastResetDate = new Date(user.usageThisMonth.lastResetDate);
  const currentDate = new Date();

  // Check if it's a new month
  if (lastResetDate.getMonth() !== currentDate.getMonth() ||
      lastResetDate.getFullYear() !== currentDate.getFullYear()) {
    // Reset usage counters
    user.usageThisMonth = {
      storiesGenerated: 0,
      chaptersGenerated: 0,
      audioMinutesUsed: 0,
      lastResetDate: currentDate
    };
    await user.save();
  }
}