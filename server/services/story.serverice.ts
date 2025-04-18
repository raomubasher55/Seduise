import { Story } from "../models/story.model";
import { StorySettings } from "@shared/schema";
import { continueStory, generateStory } from "../utils/openai";
import { User } from "../models/user.model";

export const createStory = async (title: string, settings: StorySettings, maxTokens: number | undefined, userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    // Check if the user is a free user and has reached the story limit
    const FREE_USER_STORY_LIMIT = 3;
    if (!user.isPremium && user.stories.length >= FREE_USER_STORY_LIMIT) {
        throw new Error("Free users can only create 3 stories. Please upgrade to premium for unlimited stories.");
    }
    
    // Pass the title to the story generator
    const generatedStory = await generateStory({
        title: title,
        ...settings, 
        length: settings.length
    });

    const story = new Story({
        title: title, // Use the user-provided title
        content: generatedStory.content,
        audioUrl: null,
        settings: settings,
        userId: userId,
        isPublic: true,
        imageUrl: null,
        likes: 0,
        plays: 0
    });
    
    await story.save();
    user.stories.push(story._id);
    await user.save();
    return story;
    return "Story";
};

export const continueStoryService = async (id: string) => {
    const story = await Story.findById(id);
    if (!story) {
        throw new Error("Story not found");
    }
    
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