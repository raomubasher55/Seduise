import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createStory, getStory, updateStory, deleteStory, getStoryAudio, continueStory, titleSuggestions, getStoryChapters, getStoryChapter, getChapterChoices } from "../controllers/story.controller";
import { Story } from "../models/story.model";
import { User } from "../models/user.model";
import { elevenlabs } from "../utils/elevenlabs";

// Helper function to determine voice gender based on name and labels
function determineVoiceGender(voiceName: string, labels?: Record<string, string>): string {
  // If labels already has a valid gender, use it
  if (labels && labels.gender && 
      (labels.gender.toLowerCase() === 'male' || 
       labels.gender.toLowerCase() === 'female')) {
    return labels.gender.toLowerCase();
  }
  
  // Common male names for voice actors
  const maleNames = [
    'adam', 'josh', 'thomas', 'charlie', 'james', 'matthew', 'daniel', 
    'michael', 'david', 'william', 'joseph', 'chris', 'george', 'robert', 
    'jack', 'john', 'henry', 'jacob', 'sam', 'samuel', 'tom', 'callum', 
    'harry', 'oliver', 'peter', 'will', 'liam', 'lucas'
  ];
  
  // Common female names for voice actors
  const femaleNames = [
    'rachel', 'sarah', 'emily', 'bella', 'domi', 'charlotte', 'olivia', 
    'emma', 'ava', 'sophia', 'isabella', 'mia', 'amelia', 'alice', 
    'lily', 'grace', 'chloe', 'jessica', 'sophia', 'amy', 'katie', 
    'susan', 'jennifer', 'elizabeth', 'mary', 'kathy', 'matilda', 'river'
  ];
  
  // Clean and normalize the name for comparison
  const normalizedName = voiceName.toLowerCase().trim();
  const firstNamePart = normalizedName.split(' ')[0];
  
  // Check for explicit gender mentions in the name
  if (normalizedName.includes('female') || normalizedName.includes('woman')) {
    return 'female';
  }
  
  if (normalizedName.includes('male') || normalizedName.includes('man')) {
    return 'male';
  }
  
  // Check name against male and female lists
  if (maleNames.includes(firstNamePart)) {
    return 'male';
  }
  
  if (femaleNames.includes(firstNamePart)) {
    return 'female';
  }
  
  // Check if name has common male or female patterns
  if (/\b(mr|sir|guy|boy|bro|dude)\b/.test(normalizedName)) {
    return 'male';
  }
  
  if (/\b(mrs|ms|miss|lady|girl|sis)\b/.test(normalizedName)) {
    return 'female';
  }
  
  // Special case for voices named after rivers, usually female
  if (normalizedName === 'river') {
    return 'female';
  }
  
  // Default gender when cannot determine
  return 'unknown';
}

const router = Router();

// Voice options endpoint - must be before generic story routes
router.get("/voice-options", async (req, res) => {
  try {
    const voices = await elevenlabs.getVoices();
    
    // Map to include more voice details for frontend
    const mappedVoices = voices.map(voice => {
      // Extract name parts - many ElevenLabs voices have descriptions in parentheses
      const nameParts = voice.name.match(/^(.*?)(?:\s*\((.*?)\))?$/);
      const cleanName = nameParts ? nameParts[1].trim() : voice.name;
      const description = nameParts && nameParts[2] ? nameParts[2].trim() : '';
      
      // Determine if this is a premium or free voice
      const isFree = voice.category === 'premade';
      
      // Create enhanced voice information
      return {
        id: voice.voice_id,
        name: cleanName,
        fullName: voice.name,
        category: voice.category,
        isPremium: !isFree,
        description: description || (voice.labels && voice.labels.description) || '',
        labels: {
          ...voice.labels,
          // Add some defaults if missing with improved gender detection
          gender: determineVoiceGender(voice.name, voice.labels),
          accent: (voice.labels && voice.labels.accent) || 'neutral',
          age: (voice.labels && voice.labels.age) || 'adult',
          style: (voice.labels && voice.labels.style) || 'natural'
        },
        preview_url: voice.preview_url || ''
      };
    });
    
    // Log what we're sending back for debugging
    console.log(`Returning ${mappedVoices.length} voice options with enhanced details`);
    
    res.json(mappedVoices);
  } catch (error) {
    console.error("Error fetching voice options:", error);
    res.status(500).json({ message: "Failed to fetch voice options" });
  }
});

// Story CRUD operations
router.route("/generate").post(authMiddleware, createStory);
router.route("/title-suggestions").post(authMiddleware, titleSuggestions);

// Get all public stories
router.get("/public", async (req, res) => {
  try {
    const publicStories = await Story.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(12);
      
    // Populate user names for each story
    const storiesWithUserNames = await Promise.all(
      publicStories.map(async (story) => {
        try {
          // Check if userId is a valid ObjectId before querying
          if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
            const user = await User.findById(story.userId);
            return {
              ...story.toObject(),
              userName: user ? user.name : "Anonymous"
            };
          } else {
            return {
              ...story.toObject(),
              userName: "Anonymous"
            };
          }
        } catch (err) {
          // If there's an error finding the user, just return the story with Anonymous
          return {
            ...story.toObject(),
            userName: "Anonymous"
          };
        }
      })
    );
    
    res.json(storiesWithUserNames);
  } catch (error) {
    console.error("Error fetching public stories:", error);
    res.status(500).json({ message: "Failed to fetch public stories" });
  }
});

// Get stories by category
router.get("/by-category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }
    
    // Map the category to appropriate fields in the story settings
    let query: any = { isPublic: true };
    
    // Use the category field directly first, then fall back to settings-based criteria
    // This allows stories to be explicitly assigned to categories
    switch(category) {
      case "romance":
        query = { 
          isPublic: true,
          $or: [
            { category: "romance" },
            { "settings.atmosphere": "Romantic" },
            { "settings.writingTone": "Romantic" }
          ]
        };
        break;
      case "fantasy":
        query = { 
          isPublic: true,
          $or: [
            { category: "fantasy" },
            { "settings.timePeriod": "Fantasy Realm" }
          ]
        };
        break;
      case "historical":
        query = { 
          isPublic: true,
          $or: [
            { category: "historical" },
            { "settings.timePeriod": { $in: ["Medieval", "Victorian"] } }
          ]
        };
        break;
      case "contemporary":
        query = { 
          isPublic: true,
          $or: [
            { category: "contemporary" },
            { "settings.timePeriod": "Contemporary" }
          ]
        };
        break;
      case "adventure":
        query = { 
          isPublic: true,
          $or: [
            { category: "adventure" },
            { "settings.atmosphere": "Mysterious" }
          ]
        };
        break;
      case "passionate":
        query = { 
          isPublic: true,
          $or: [
            { category: "passionate" },
            { "settings.writingTone": "Passionate" }
          ]
        };
        break;
      case "playful":
        query = { 
          isPublic: true,
          $or: [
            { category: "playful" },
            { "settings.writingTone": "Playful" }
          ]
        };
        break;
      case "intense":
        query = { 
          isPublic: true,
          $or: [
            { category: "intense" },
            { "settings.writingTone": "Intense" }
          ]
        };
        break;
      default:
        // For any category we don't have specific mapping for, just query by category field
        query = { isPublic: true, category: category };
    }
    
    // Log the query for debugging
    console.log(`Query for category ${category}:`, JSON.stringify(query));
    
    const categoryStories = await Story.find(query)
      .sort({ createdAt: -1 })
      .limit(8);
      
    // Populate user names for each story
    const storiesWithUserNames = await Promise.all(
      categoryStories.map(async (story) => {
        try {
          if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
            const user = await User.findById(story.userId);
            return {
              ...story.toObject(),
              userName: user ? user.name : "Anonymous"
            };
          } else {
            return {
              ...story.toObject(),
              userName: "Anonymous"
            };
          }
        } catch (err) {
          return {
            ...story.toObject(),
            userName: "Anonymous"
          };
        }
      })
    );
    
    res.json(storiesWithUserNames);
  } catch (error) {
    console.error(`Error fetching stories for category:`, error);
    res.status(500).json({ message: "Failed to fetch stories by category" });
  }
});

// Story-specific routes with ID parameter
router.route("/:id").get(getStory);
router.route("/:id").put(authMiddleware, updateStory);
router.route("/:id").delete(authMiddleware, deleteStory);
router.route("/:id/continue").post(authMiddleware, continueStory);
router.route("/:id/audio").get(getStoryAudio);
router.route("/:id/chapters").get(getStoryChapters);
router.route("/:id/chapters/:chapterNumber").get(getStoryChapter);
router.route("/:id/chapters/:chapterNumber/choices").get(getChapterChoices);
router.route("/:id/chapters/:chapterNumber/choice").post(authMiddleware, continueStory);

// Get all premium stories (only for premium users)
router.get("/premium-stories", authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user || !user.isPremium) {
      return res.status(403).json({ message: "Access denied. Premium subscription required." });
    }

    const premiumStories = await Story.find({ isPremiumContent: true })
      .sort({ createdAt: -1 })
      .limit(20); // Limit to 20 premium stories

    // Populate user names for each story
    const storiesWithUserNames = await Promise.all(
      premiumStories.map(async (story) => {
        try {
          if (story.userId && /^[0-9a-fA-F]{24}$/.test(story.userId)) {
            const author = await User.findById(story.userId);
            return {
              ...story.toObject(),
              userName: author ? author.name : "Anonymous"
            };
          } else {
            return {
              ...story.toObject(),
              userName: "Anonymous"
            };
          }
        } catch (err) {
          return {
            ...story.toObject(),
            userName: "Anonymous"
          };
        }
      })
    );

    res.json(storiesWithUserNames);
  } catch (error) {
    console.error("Error fetching premium stories:", error);
    res.status(500).json({ message: "Failed to fetch premium stories" });
  }
});

// Toggle story visibility
router.patch("/:id/visibility", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.session.userId;
    
    // Validate input
    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ message: "Invalid visibility status" });
    }
    
    // If setting to private, check if user is premium
    if (!isPublic) {
      // Find user to check premium status
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.isPremium) {
        return res.status(403).json({
          message: "Only premium users can set stories to private",
          code: "PREMIUM_REQUIRED",
          isPremiumRequired: true
        });
      }
    }
    
    // Find the story and check ownership
    const story = await Story.findById(id);
    
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    if (story.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to update this story" });
    }
    
    // Update visibility
    story.isPublic = isPublic;
    await story.save();
    
    res.json(story);
  } catch (error) {
    console.error("Error updating story visibility:", error);
    res.status(500).json({ message: "Failed to update story visibility" });
  }
});

export default router;