import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createStory, getStory, updateStory, deleteStory, getStoryAudio, continueStory, titleSuggestions, getStoryChapters, getStoryChapter, getChapterChoices, likeStory, upvoteStory, downvoteStory, unlockChapter, updateVisibility, getPublicStoriesList, getStoriesByCategoryController, getPremiumStoriesController } from "../controllers/story.controller";
import { trackEngagement } from "../middlewares/engagement.middleware";

const router = Router();

// Story CRUD operations
router.route("/generate").post(authMiddleware, trackEngagement('story_created'), createStory);
router.route("/title-suggestions").post(authMiddleware, titleSuggestions);

// Get all public stories
router.get("/public", getPublicStoriesList);

// Get stories by category
router.get("/by-category/:category", getStoriesByCategoryController);

// Get all premium stories (only for passion/escape subscribers) - MUST be before parameterized routes
router.get("/premium-stories", authMiddleware, getPremiumStoriesController);

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
router.route("/:id/chapters/:chapterNumber/unlock").post(authMiddleware, unlockChapter);
router.route("/:id/like").post(authMiddleware, likeStory);
router.route("/:id/upvote").post(authMiddleware, upvoteStory);
router.route("/:id/downvote").post(authMiddleware, downvoteStory);

// Toggle story visibility (modularized)
router.patch("/:id/visibility", authMiddleware, updateVisibility);

export default router;
