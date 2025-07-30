import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { Story } from "../models/story.model";
import { User } from "../models/user.model";

const router = Router();

// All these routes require authentication
router.use(authMiddleware);

// Debug endpoint to check and fix user subscription status
router.get("/debug-subscription", async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is premium but subscription is still "free"
    if (user.isPremium && user.subscription === "free") {
      // Infer subscription based on credits (this is a temporary fix)
      let inferredPlan = "essential"; // default
      if (user.credits >= 70) {
        inferredPlan = "escape";
      } else if (user.credits >= 35) {
        inferredPlan = "passion";
      } else {
        inferredPlan = "essential";
      }
      
      // Update the user's subscription
      user.subscription = inferredPlan;
      await user.save();
      
      return res.json({
        message: "Fixed subscription status",
        before: "free",
        after: inferredPlan,
        userStatus: {
          isPremium: user.isPremium,
          subscription: user.subscription,
          credits: user.credits
        }
      });
    }

    return res.json({
      message: "Subscription status is correct",
      userStatus: {
        isPremium: user.isPremium,
        subscription: user.subscription,
        credits: user.credits
      }
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ message: "Failed to check subscription" });
  }
});

// Get all stories for the current user
router.get("/stories", async (req, res) => {
  try {
    const userId = req.session.userId;
    const stories = await Story.find({ userId }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    console.error("Error fetching user stories:", error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});

// Toggle story visibility
router.patch("/stories/:id/visibility", async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.session.userId;
    
    // Validate input
    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ message: "Invalid visibility status" });
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

// Delete a story
router.delete("/stories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
    // Find the story and check ownership
    const story = await Story.findById(id);
    
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    if (story.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to delete this story" });
    }
    
    // Delete the story
    await Story.findByIdAndDelete(id);
    
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ message: "Failed to delete story" });
  }
});

export default router;