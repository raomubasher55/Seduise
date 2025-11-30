import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { debugSubscription, getMyStories, updateMyStoryVisibility, removeMyStory, updateProfile } from "../controllers/user.controller";

const router = Router();

// All these routes require authentication
router.use(authMiddleware);

// Debug endpoint to check and fix user subscription status
router.get("/debug-subscription", debugSubscription);
router.patch('/:id', updateProfile );

// Get all stories for the current user
router.get("/stories", getMyStories); 

// Toggle story visibility
router.patch("/stories/:id/visibility", updateMyStoryVisibility);

// Delete a story 
router.delete("/stories/:id", removeMyStory);

export default router;
