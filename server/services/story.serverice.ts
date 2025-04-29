import { Story } from "../models/story.model";
import { StorySettings } from "@shared/schema";
import { continueStory, generateStory } from "../utils/openai";
import { User } from "../models/user.model";
import { elevenlabs } from "../utils/elevenlabs";

export const createStory = async (title: string, settings: StorySettings, maxTokens: number | undefined, userId: string, isPublic: boolean = false, category: string = "romance") => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    // Check if user has enough credits
    const STORY_GENERATION_COST = 1; // Each story generation costs 1 credit
    if (user.credits < STORY_GENERATION_COST) {
        throw new Error("INSUFFICIENT_CREDITS");
    }
    
    // Check if the user is a free user and has reached the story limit
    const FREE_USER_STORY_LIMIT = 3;
    if (!user.isPremium && user.stories.length >= FREE_USER_STORY_LIMIT) {
        throw new Error("Free users can only create 3 stories. Please upgrade to premium for unlimited stories.");
    }
    
    // Deduct credits before generating story
    user.credits -= STORY_GENERATION_COST;
    await user.save();
    
    // Validate and process narration voice - ensure we have a valid voice ID
    // Handle case where we have been provided a narrationVoiceId directly
    if (settings.narrationVoiceId) {
        console.log(`Using provided voice ID: ${settings.narrationVoiceId}`);
    } else {
        // Map the voice name to a valid ElevenLabs voice ID
        const voiceId = elevenlabs.getVoiceId(settings.narrationVoice);
        console.log(`Mapped voice name "${settings.narrationVoice}" to ID: ${voiceId}`);
        settings.narrationVoiceId = voiceId;
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

    // Create the story in the database
    const story = new Story({
        title: title || generatedTitle,
        content,
        userId,
        settings,
        isPublic,
        category
    });
    
    await story.save();
    
    // Add story ID to user's stories array
    user.stories.push(story._id);
    await user.save();
    
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

export const continueStoryService = async (id: string) => {
    const story = await Story.findById(id);
    if (!story) {
        throw new Error("Story not found");
    }
    
    // Get the user to check credits
    const user = await User.findById(story.userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    // Check if user has enough credits
    const CONTINUATION_COST = 1; // Each continuation costs 1 credit
    if (user.credits < CONTINUATION_COST) {
        throw new Error("INSUFFICIENT_CREDITS");
    }
    
    // Deduct credits before generating continuation
    user.credits -= CONTINUATION_COST;
    await user.save();
    
    try {
        // Log before continuation
        console.log(`Continuing story ${id}`);
        console.log(`Original content length: ${story.content.length} characters`);
        
        // Continue the story with the original settings
        const continuation = await continueStory(
            story.content,
            story.settings as any
        );
        
        // Add a clear separator and then the continuation
        story.content = story.content + "\n\n" + continuation;
        
        // Log after continuation
        console.log(`Continuation added: ${continuation.length} characters`);
        console.log(`New total content length: ${story.content.length} characters`);
        
        // Save the updated story
        await story.save();
        return story;
    } catch (error) {
        // If continuation fails, refund the credits
        user.credits += CONTINUATION_COST;
        await user.save();
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