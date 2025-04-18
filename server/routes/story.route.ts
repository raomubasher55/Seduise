import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createStory, getStory, updateStory, deleteStory, getStoryAudio, continueStory ,titleSuggestions  } from "../controllers/story.controller";
import { Story } from "../models/story.model";
import { User } from "../models/user.model";

const router = Router();


router.route("/generate").post(authMiddleware, createStory);

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
    
    // Different category mappings
    switch(category) {
      case "romance":
        query["settings.atmosphere"] = "Romantic";
        break;
      case "fantasy":
        query["settings.timePeriod"] = "Fantasy Realm";
        break;
      case "historical":
        query["settings.timePeriod"] = { $in: ["Medieval", "Victorian"] };
        break;
      case "contemporary":
        query["settings.timePeriod"] = "Contemporary";
        break;
      case "adventure":
        query["settings.atmosphere"] = "Mysterious";
        break;
      case "passionate":
        query["settings.writingTone"] = "Passionate";
        break;
      case "playful":
        query["settings.writingTone"] = "Playful";
        break;
      case "intense":
        query["settings.writingTone"] = "Intense";
        break;
      default:
        // If category doesn't match any predefined ones, return empty array
        return res.json([]);
    }
    
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

// Individual story routes
router.route("/:id/continue").post(authMiddleware, continueStory);
router.route("/:id/audio").get(getStoryAudio);
router.route("/:id").get(getStory);
router.route("title-suggestions").get(titleSuggestions)
router.route("/:id").put(authMiddleware, updateStory);
router.route("/:id").delete(authMiddleware, deleteStory);

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