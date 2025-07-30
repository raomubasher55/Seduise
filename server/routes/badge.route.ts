import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { badgeService } from "../services/badge.service";
import { BADGE_DEFINITIONS, getBadgeById, getBadgesByCategory, getBadgesByRarity } from "../constants/badges";
import { engagementTracker, runDailyBadgeCheck } from "../middleware/engagement.middleware";
import { User } from "../models/user.model";

const router = Router();

/**
 * GET /api/badges/definitions
 * Get all badge definitions
 */
router.get("/definitions", async (req, res) => {
  try {
    const { category, rarity } = req.query;
    
    let badges = Object.values(BADGE_DEFINITIONS);
    
    if (category) {
      badges = getBadgesByCategory(category as any);
    }
    
    if (rarity) {
      badges = getBadgesByRarity(rarity as any);
    }
    
    res.json({
      success: true,
      badges,
      total: badges.length
    });
  } catch (error) {
    console.error('Error fetching badge definitions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch badge definitions' });
  }
});

/**
 * GET /api/badges/user/:userId
 * Get user's badges and statistics
 */
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.session.userId;
    
    // Users can only view their own badges unless they're admin
    if (userId !== requestingUserId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view your own badges' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const badgeSummary = await badgeService.getUserBadgeSummary(userId);
    const userStats = await badgeService.getUserStats(userId);
    
    res.json({
      success: true,
      badges: user.badges || [],
      summary: badgeSummary,
      stats: userStats
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user badges' });
  }
});

/**
 * POST /api/badges/check/:userId
 * Manually trigger badge check for a user
 */
router.post("/check/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.session.userId;
    
    // Users can only check their own badges
    if (userId !== requestingUserId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only check your own badges' 
      });
    }
    
    const result = await engagementTracker.checkBadgesNow(userId);
    
    res.json({
      success: true,
      message: result.newBadges.length > 0 
        ? `Congratulations! You earned ${result.newBadges.length} new badges!`
        : 'No new badges earned at this time.',
      newBadges: result.newBadges,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error checking user badges:', error);
    res.status(500).json({ success: false, message: 'Failed to check badges' });
  }
});

/**
 * GET /api/badges/leaderboard
 * Get badge leaderboard
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const { category = 'all', limit = 10 } = req.query;
    
    const users = await User.find({ badges: { $exists: true, $ne: [] } })
      .select('name badges')
      .limit(parseInt(limit as string));
    
    const leaderboard = users.map(user => {
      const badges = user.badges || [];
      const badgeCounts = {
        total: badges.length,
        legendary: badges.filter(b => b.rarity === 'legendary').length,
        epic: badges.filter(b => b.rarity === 'epic').length,
        rare: badges.filter(b => b.rarity === 'rare').length,
        common: badges.filter(b => b.rarity === 'common').length
      };
      
      // Calculate score (weighted by rarity)
      const score = badgeCounts.legendary * 100 + 
                   badgeCounts.epic * 25 + 
                   badgeCounts.rare * 5 + 
                   badgeCounts.common * 1;
      
      return {
        userId: user._id,
        name: user.name,
        badgeCounts,
        score,
        recentBadges: badges
          .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime())
          .slice(0, 3)
      };
    }).sort((a, b) => b.score - a.score);
    
    res.json({
      success: true,
      leaderboard,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Error fetching badge leaderboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

/**
 * POST /api/badges/admin/daily-check
 * Admin endpoint to run daily badge check for all users
 */
router.post("/admin/daily-check", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    // Check if user is admin (adjust this based on your admin system)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    // Run daily badge check in background
    runDailyBadgeCheck().catch(error => {
      console.error('Error in daily badge check:', error);
    });
    
    res.json({
      success: true,
      message: 'Daily badge check initiated'
    });
  } catch (error) {
    console.error('Error initiating daily badge check:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate daily badge check' });
  }
});

/**
 * GET /api/badges/stats
 * Get overall badge statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const totalBadgeDefinitions = Object.keys(BADGE_DEFINITIONS).length;
    
    const userCount = await User.countDocuments({ badges: { $exists: true, $ne: [] } });
    
    const badgeStats = await User.aggregate([
      { $match: { badges: { $exists: true, $ne: [] } } },
      { $unwind: '$badges' },
      { $group: {
        _id: '$badges.rarity',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);
    
    const mostAwardedBadges = await User.aggregate([
      { $match: { badges: { $exists: true, $ne: [] } } },
      { $unwind: '$badges' },
      { $group: {
        _id: '$badges.id',
        name: { $first: '$badges.name' },
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalBadgeDefinitions,
        usersWithBadges: userCount,
        badgesByRarity: badgeStats,
        mostAwardedBadges
      }
    });
  } catch (error) {
    console.error('Error fetching badge stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch badge stats' });
  }
});

export default router;