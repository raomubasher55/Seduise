import { Story } from "../models/story.model";
import { StorySettings } from "@shared/schema";
import { continueStory, generateStory, generateChapterTitle, generateChapterSummary, generateChoices, concludeStory } from "../utils/openai";
import { User } from "../models/user.model";
import { elevenlabs } from "../utils/elevenlabs";
import { awardBadge } from "./reward.service";

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
    
    // Validate and process narration voice - ensure we have a valid voice ID
    // Handle case where we have been provided a narrationVoiceId directly
    if (settings.narrationVoiceId) {
        console.log(`Using provided voice ID: ${settings.narrationVoiceId}`);
    } else if (settings.narrationVoice) {
        // Map the voice name to a valid ElevenLabs voice ID
        const voiceId = elevenlabs.getVoiceId(settings.narrationVoice);
        console.log(`Mapped voice name "${settings.narrationVoice}" to ID: ${voiceId}`);
        settings.narrationVoiceId = voiceId;
    } else {
        // Default to Adam (male voice) if no voice specified
        console.log("No narration voice specified, defaulting to Adam (male voice)");
        settings.narrationVoiceId = "VR6AewLTigWG4xSOukaG"; // Adam's voice ID
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