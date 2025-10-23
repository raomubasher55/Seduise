import { User } from "../models/user.model";
import { Story } from "../models/story.model";
import { setStoryVisibility, deleteStory as deleteStoryService } from "./story.service";

class UserServiceError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'UserServiceError';
    if (status) this.status = status;
    if (code) this.code = code;
  }
}

export const debugAndFixSubscription = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new UserServiceError('User not found', 404);

  if (user.isPremium && user.subscription === 'free') {
    // Legacy debug logic inferred to default to 'essentiel'
    const before = 'free';
    const inferredPlan = 'essentiel';
    user.subscription = inferredPlan as any;
    await user.save();
    return {
      message: 'Fixed subscription status',
      before,
      after: inferredPlan,
      userStatus: {
        isPremium: user.isPremium,
        subscription: user.subscription,
        textCredits: user.textCredits,
        audioCredits: user.audioCredits,
      },
    };
  }

  return {
    message: 'Subscription status is correct',
    userStatus: {
      isPremium: user.isPremium,
      subscription: user.subscription,
      textCredits: user.textCredits,
      audioCredits: user.audioCredits,
    },
  };
};

export const getStoriesForUser = async (userId: string) => {
  const stories = await Story.find({ userId }).sort({ createdAt: -1 });
  return stories;
};

export const setUserStoryVisibility = async (userId: string, storyId: string, isPublic: boolean) => {
  // Reuse story visibility service (includes premium checks when making private)
  return await setStoryVisibility(userId, storyId, isPublic);
};

export const deleteUserStory = async (userId: string, storyId: string) => {
  // Ensure ownership first
  const story = await Story.findById(storyId);
  if (!story) throw new UserServiceError('Story not found', 404);
  if (story.userId !== userId) throw new UserServiceError("You don't have permission to delete this story", 403);
  return await deleteStoryService(storyId, userId);
};

