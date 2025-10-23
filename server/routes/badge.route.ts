import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getBadgeDefinitions, getUserBadges, checkUserBadges, getLeaderboard, runDailyCheck, getBadgeStats } from "../controllers/badge.controller";

const router = Router();

// Get all badge definitions
router.get("/definitions", getBadgeDefinitions);

// Get badges for a user
router.get("/user/:userId", authMiddleware, getUserBadges);

// Manually trigger badge check for a user
router.post("/check/:userId", authMiddleware, checkUserBadges);

// Get badge leaderboard
router.get("/leaderboard", getLeaderboard);

// Admin endpoint to run daily badge check for all users
router.post("/admin/daily-check", authMiddleware, runDailyCheck);

// Get overall badge statistics
router.get("/stats", getBadgeStats);

export default router;
