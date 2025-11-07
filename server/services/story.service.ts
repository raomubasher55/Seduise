import { Story } from "../models/story.model";
import { StorySettings } from "@shared/schema";
import { continueStory, generateStory, generateChapterTitle, generateChapterSummary, generateChoices, concludeStory } from "../utils/openai";
import { User } from "../models/user.model";
import { awardBadge } from "./reward.service";
import type { Document } from "mongoose";

class VisibilityError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'VisibilityError';
    if (status) this.status = status;
    if (code) this.code = code;
  }
}

export const createStory = async (title: string, settings: StorySettings, maxTokens: number | undefined, userId: string, isPublic: boolean = false, category: string = "romance", accessType: string = "public", textCreditCost: number = 1) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    // Remove testing override - users should manage their own credits
    
    // Check if user has enough text credits
    if (user.textCredits < textCreditCost) {
        throw new Error(`Insufficient text credits. This story requires ${textCreditCost} text credits, but you only have ${user.textCredits} text credits available. Please purchase additional text credits or upgrade to premium.`);
    }
    
    // Deduct text credits before generating story
    user.textCredits -= textCreditCost;
    await user.save();
    
    // Validate narration voice for MiniMax
    if (settings.narrationVoiceId) {
        console.log(`Using provided MiniMax voice ID: ${settings.narrationVoiceId}`);
    } else {
        const defaultVoiceId = process.env.MINIMAX_DEFAULT_VOICE_ID || "minimax_female_soft";
        settings.narrationVoiceId = defaultVoiceId;
        settings.narrationVoice = settings.narrationVoice || "MiniMax Voice";
        console.log(`No narration voice provided; defaulting to MiniMax voice ${defaultVoiceId}`);
    }
    
    // Generate the story content
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

    // Clean the content in case it still has JSON formatting
    let cleanedContent = content;
    
    // Check if content is a JSON string and extract the content field
    if (typeof content === 'string' && content.trim().startsWith('{') && content.includes('"content"')) {
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

    // Generate a descriptive title and summary for the first chapter
    let chapterTitle = "The Beginning";
    let chapterSummary = "";
    try {
        chapterTitle = await generateChapterTitle(cleanedContent, 1);
        chapterSummary = await generateChapterSummary(cleanedContent, 1);
    } catch (error) {
        console.error("Failed to generate chapter metadata, using defaults:", error);
    }

    // Create the first chapter
    const firstChapter = {
        number: 1,
        title: chapterTitle,
        content: cleanedContent,
        summary: chapterSummary,
        createdAt: new Date(),
        wordCount: cleanedContent.split(' ').length,
        textCreditsCost: textCreditCost,
        audioCreditsCost: 2 // Default audio cost for first chapter
    };

    // Create the story in the database with chapter structure
    const story = new Story({
        title: title || generatedTitle,
        content: cleanedContent, // Keep for backward compatibility
        userId,
        settings,
        isPublic: accessType === 'public',
        accessType: accessType,
        category,
        textCreditsCost: textCreditCost,
        audioCreditsCost: 2, // Default audio cost for story
        chapters: [firstChapter],
        currentChapter: 1,
        totalChapters: 1,
        isChapterBased: true
    });
    
    await story.save();
    
    // Add story ID to user's stories array
    user.stories.push(story._id);
    await user.save();

    // Award "Storyteller" badge if this is the user's first story
    if (user.stories.length === 1) {
        await awardBadge(userId, "Storyteller");
    }
    
    // After story is saved, attempt to generate audio
    try {
        // Generate audio asynchronously (don't await) to not slow down story creation
        // Let the frontend handle audio generation separately
        console.log(`Will generate audio for story ${story._id} with voice ${settings.narrationVoice} (ID: ${settings.narrationVoiceId})`);
    } catch (audioError) {
        console.error("Error scheduling audio generation:", audioError);
        // Don't fail the story creation if audio generation fails
    }
    
    return story;
};

export const continueStoryService = async (id: string, finalChoice?: string, conclude?: boolean) => {
    const story = await Story.findById(id);
    if (!story) {
        throw new Error("Story not found");
    }
    
    // Get the user to check credits
    const user = await User.findById(story.userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    // Check if user has enough text credits
    const TEXT_CONTINUATION_COST = 1; // Each continuation costs 1 text credit
    if (user.textCredits < TEXT_CONTINUATION_COST) {
        throw new Error(`Insufficient text credits. Continuing this story requires ${TEXT_CONTINUATION_COST} text credit, but you only have ${user.textCredits} text credits available. Please purchase additional text credits or upgrade to premium.`);
    }
    
    // Deduct text credits before generating continuation
    user.textCredits -= TEXT_CONTINUATION_COST;
    await user.save();
    
    try {
        // Log before continuation
        console.log(`Continuing story ${id}`);
        
        // Get the current content for continuation
        let currentContent = "";
        if (story.isChapterBased && story.chapters.length > 0) {
            // Use all chapters' content for context
            currentContent = story.chapters.map(ch => ch.content).join("\n\n");
        } else {
            // Use legacy content
            currentContent = story.content || "";
        }
        
        console.log(`Current content length: ${currentContent.length} characters`);
        
        // Continue the story with the original settings, passing the selected choice
        const continuation = conclude
            ? await concludeStory(
                currentContent,
                story.settings as any,
                finalChoice
              )
            : await continueStory(
                currentContent,
                story.settings as any,
                finalChoice
              );
        
        // Generate a descriptive title and summary for the new chapter
        const nextChapterNumber = story.isChapterBased ? story.chapters.length + 1 : 2;
        let chapterTitle = `Chapter ${nextChapterNumber}`;
        let chapterSummary = "";
        try {
            chapterTitle = await generateChapterTitle(continuation, nextChapterNumber);
            chapterSummary = await generateChapterSummary(continuation, nextChapterNumber);
        } catch (error) {
            console.error("Failed to generate chapter metadata, using defaults:", error);
        }

        // Generate choices for the new chapter
        let choices = [];
        try {
            choices = await generateChoices(continuation);
        } catch (error) {
            console.error("Failed to generate choices for new chapter:", error);
        }

        // Create new chapter
        const newChapter = {
            number: nextChapterNumber,
            title: chapterTitle,
            content: continuation,
            summary: chapterSummary,
            createdAt: new Date(),
            wordCount: continuation.split(' ').length,
            textCreditsCost: TEXT_CONTINUATION_COST,
            audioCreditsCost: 2, // Default audio cost for new chapter
            choices: choices // Add generated choices to the new chapter
        };
        
        // Update story with new chapter
        if (story.isChapterBased) {
            story.chapters.push(newChapter);
        } else {
            // Convert legacy story to chapter-based
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
                wordCount: story.content ? story.content.split(' ').length : 0,
                textCreditsCost: story.textCreditsCost || story.creditsCost || 1, // Fallback for legacy data
                audioCreditsCost: story.audioCreditsCost || 2 // Default audio cost
            };
            story.chapters = [firstChapter, newChapter];
            story.isChapterBased = true;
        }
        
        // Update story metadata
        story.currentChapter = nextChapterNumber;
        story.totalChapters = story.chapters.length;
        
        // Update legacy content for backward compatibility
        story.content = story.chapters.map(ch => ch.content).join("\n\n");
        
        // Log after continuation
        console.log(`New chapter added: ${continuation.length} characters`);
        console.log(`Total chapters: ${story.chapters.length}`);
        
        // Save the updated story
        await story.save();
        return story;
    } catch (error) {
        // If continuation fails, refund the text credits
        user.textCredits += TEXT_CONTINUATION_COST;
        await user.save();
        console.error("Error in continueStoryService:", error);
        throw error;
    }
};

export const getStory = async (id: string) => {
    const story = await Story.findById(id);
    return story;
};

export const getStoryAudio = async (id: string) => {
    const story = await Story.findById(id);
    return story?.audioUrl;
};

export const  deleteStory = async(id: string , userId :string | undefined) =>{
    const story = await Story.findByIdAndDelete(id);
    if(!story){
        throw new Error("Story not found");
    }

    const user = await User.findById(userId);
    if(!user){
        throw new Error("User not found");
    }
    user.stories = user.stories.filter(storyId => storyId.toString() !== id);
    await user.save();
    return story;
}

export const getChapterChoices = async (storyId: string, chapterNumber: number) => {
    const story = await Story.findById(storyId);
    if (!story) {
        throw new Error("Story not found");
    }

    const chapter = story.chapters.find(ch => ch.number === chapterNumber);
    if (!chapter) {
        throw new Error("Chapter not found");
    }

    return chapter.choices || [];
};

export const setStoryVisibility = async (
  userId: string | undefined,
  storyId: string,
  isPublic: boolean
): Promise<Document & any> => {
  if (!userId) {
    throw new VisibilityError('Not authenticated', 401);
  }
  if (typeof isPublic !== 'boolean') {
    throw new VisibilityError('Invalid visibility status', 400);
  }

  // If setting to private, ensure user is premium
  if (!isPublic) {
    const user = await User.findById(userId);
    if (!user) {
      throw new VisibilityError('User not found', 404);
    }
    if (!user.isPremium) {
      throw new VisibilityError('Only premium users can set stories to private', 403, 'PREMIUM_REQUIRED');
    }
  }

  const story = await Story.findById(storyId);
  if (!story) {
    throw new VisibilityError('Story not found', 404);
  }
  if (story.userId !== userId) {
    throw new VisibilityError("You don't have permission to update this story", 403);
  }

  story.isPublic = isPublic;
  if (!isPublic && story.accessType === 'public') {
    story.accessType = 'private';
  } else if (isPublic && story.accessType === 'private') {
    story.accessType = 'public';
  }
  await story.save();
  return story;
};

export const getPublicStoriesService = async (userId?: string) => {
  const currentDate = new Date();
  const publicStories = await Story.find({
    $or: [
      { accessType: 'public' },
      { accessType: 'premium_early_access', publicReleaseDate: { $lte: currentDate } }
    ]
  }).sort({ createdAt: -1 }).limit(12);

  const storiesWithUserNames = await Promise.all(
    publicStories.map(async (story: any) => {
      try {
        const likedBy = story.likedBy || [];
        const upvotedBy = story.upvotedBy || [];
        const downvotedBy = story.downvotedBy || [];
        if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
          const user = await User.findById(story.userId).select('name badges');
          return {
            ...story.toObject(),
            userName: user ? user.name : 'Anonymous',
            authorBadges: user ? user.badges : [],
            hasLiked: userId ? likedBy.includes(userId) : false,
            hasUpvoted: userId ? upvotedBy.includes(userId) : false,
            hasDownvoted: userId ? downvotedBy.includes(userId) : false
          };
        } else {
          return {
            ...story.toObject(),
            userName: 'Anonymous',
            authorBadges: [],
            hasLiked: userId ? likedBy.includes(userId) : false,
            hasUpvoted: userId ? upvotedBy.includes(userId) : false,
            hasDownvoted: userId ? downvotedBy.includes(userId) : false
          };
        }
      } catch (err) {
        return {
          ...story.toObject(),
          userName: 'Anonymous',
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

export const getStoriesByCategoryService = async (category: string) => {
  if (!category) {
    throw new VisibilityError('Category is required', 400);
  }
  let query: any = { isPublic: true };
  switch (category) {
    case 'romance':
      query = { isPublic: true, $or: [{ category: 'romance' }, { 'settings.atmosphere': 'Romantic' }, { 'settings.writingTone': 'Romantic' }] };
      break;
    case 'fantasy':
      query = { isPublic: true, $or: [{ category: 'fantasy' }, { 'settings.timePeriod': 'Fantasy Realm' }] };
      break;
    case 'historical':
      query = { isPublic: true, $or: [{ category: 'historical' }, { 'settings.timePeriod': { $in: ['Medieval', 'Victorian'] } }] };
      break;
    case 'contemporary':
      query = { isPublic: true, $or: [{ category: 'contemporary' }, { 'settings.timePeriod': 'Contemporary' }] };
      break;
    case 'adventure':
      query = { isPublic: true, $or: [{ category: 'adventure' }, { 'settings.atmosphere': 'Mysterious' }] };
      break;
    case 'passionate':
      query = { isPublic: true, $or: [{ category: 'passionate' }, { 'settings.writingTone': 'Passionate' }] };
      break;
    case 'playful':
      query = { isPublic: true, $or: [{ category: 'playful' }, { 'settings.writingTone': 'Playful' }] };
      break;
    case 'intense':
      query = { isPublic: true, $or: [{ category: 'intense' }, { 'settings.writingTone': 'Intense' }] };
      break;
    default:
      query = { isPublic: true, category };
  }

  const categoryStories = await Story.find(query).sort({ createdAt: -1 }).limit(8);
  const storiesWithUserNames = await Promise.all(
    categoryStories.map(async (story: any) => {
      try {
        if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
          const user = await User.findById(story.userId);
          return { ...story.toObject(), userName: user ? user.name : 'Anonymous' };
        } else {
          return { ...story.toObject(), userName: 'Anonymous' };
        }
      } catch (err) {
        return { ...story.toObject(), userName: 'Anonymous' };
      }
    })
  );
  return storiesWithUserNames;
};

export const getPremiumStoriesService = async (userId: string) => {
  const user = await User.findById(userId);
  const hasGalleryAccess = ['essentiel', 'seduction', 'intimacy'].includes(user?.subscription || '');
  if (!user || !hasGalleryAccess) {
    const err: any = new Error('Access denied. Premium subscription required for premium gallery access.');
    err.status = 403;
    err.code = 'PREMIUM_REQUIRED';
    err.currentSubscription = user?.subscription || 'none';
    err.requiredSubscriptions = ['essentiel', 'seduction', 'intimacy'];
    throw err;
  }

  const currentDate = new Date();
  let storyQuery: any = {};
  let limit = 20;
  if (user.subscription === 'essentiel') {
    storyQuery = { accessType: 'premium_early_access', $or: [{ premiumAccessDate: { $lte: currentDate } }, { premiumAccessDate: { $exists: false } }] };
    limit = 10;
  } else if (user.subscription === 'seduction') {
    storyQuery = { accessType: { $in: ['premium_early_access', 'premium_exclusive'] }, $or: [{ premiumAccessDate: { $lte: currentDate } }, { premiumAccessDate: { $exists: false } }] };
    limit = 20;
  } else if (user.subscription === 'intimacy') {
    storyQuery = { accessType: { $in: ['premium_early_access', 'premium_exclusive'] }, $or: [{ premiumAccessDate: { $lte: currentDate } }, { premiumAccessDate: { $exists: false } }] };
    limit = 30;
  } else {
    storyQuery = { accessType: 'premium_early_access' };
    limit = 5;
  }

  const premiumStories = await Story.find(storyQuery).sort({ createdAt: -1 }).limit(limit);
  const storiesWithUserNames = await Promise.all(
    premiumStories.map(async (story: any) => {
      try {
        if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
          const author = await User.findById(story.userId).select('name badges');
          return { ...story.toObject(), userName: author ? author.name : 'Anonymous', authorBadges: author ? author.badges : [] };
        } else {
          return { ...story.toObject(), userName: 'Anonymous', authorBadges: [] };
        }
      } catch (err) {
        return { ...story.toObject(), userName: 'Anonymous', authorBadges: [] };
      }
    })
  );
  return storiesWithUserNames;
};
