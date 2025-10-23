import { Request, Response } from 'express';
import { listBadgeDefinitionsService, getUserBadgesWithSummaryService, getBadgeLeaderboardService, getBadgeStatsService } from '../services/badge.service';
import { engagementTracker, runDailyBadgeCheck } from "../middlewares/engagement.middleware";

export const getBadgeDefinitions = async (req: Request, res: Response) => {
  try {
    const { category, rarity } = req.query as { category?: string; rarity?: string };
    const { badges, total } = listBadgeDefinitionsService(category, rarity);
    res.json({ success: true, badges, total });
  } catch (error) {
    console.error('Error fetching badge definitions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch badge definitions' });
  }
};

export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const requestingUserId = req.session.userId;
    if (userId !== requestingUserId) {
      return res.status(403).json({ success: false, message: 'You can only view your own badges' });
    }
    const data = await getUserBadgesWithSummaryService(userId);
    if (!data) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user badges' });
  }
};

export const checkUserBadges = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const requestingUserId = req.session.userId;
    if (userId !== requestingUserId) {
      return res.status(403).json({ success: false, message: 'You can only check your own badges' });
    }
    const result = await engagementTracker.checkBadgesNow(userId);
    res.json({
      success: true,
      message: result.newBadges.length > 0
        ? `Congratulations! You earned ${result.newBadges.length} new badges!`
        : 'No new badges earned at this time.',
      newBadges: result.newBadges,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Error checking user badges:', error);
    res.status(500).json({ success: false, message: 'Failed to check badges' });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query as { limit?: string };
    const n = parseInt(limit, 10) || 10;
    const { leaderboard, total } = await getBadgeLeaderboardService(n);
    res.json({ success: true, leaderboard, total });
  } catch (error) {
    console.error('Error fetching badge leaderboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

export const runDailyCheck = async (req: Request, res: Response) => {
  try {
    const userRole = req.session.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    runDailyBadgeCheck().catch((error) => console.error('Error in daily badge check:', error));
    res.json({ success: true, message: 'Daily badge check initiated' });
  } catch (error) {
    console.error('Error initiating daily badge check:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate daily badge check' });
  }
};

export const getBadgeStats = async (_req: Request, res: Response) => {
  try {
    const stats = await getBadgeStatsService();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching badge stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch badge stats' });
  }
};

