import { User } from "../models/user.model";
import { Story } from "../models/story.model";
import { badgeService } from "./badge.service";
import { getBadgeById } from "../constants/badges";

/**
 * Legacy function for backward compatibility
 * @deprecated Use badgeService.processUserBadges() instead
 */
export async function awardBadge(userId: string, badgeName: string): Promise<boolean> {
  console.warn('awardBadge is deprecated. Use badgeService.processUserBadges() for automatic badge awarding.');
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for badge award.`);
      return false;
    }

    // Check if using old string format or new badge system
    if (typeof badgeName === 'string' && !getBadgeById(badgeName)) {
      // Legacy string badge - convert to new format
      const legacyBadge = {
        id: badgeName.toLowerCase().replace(/\s+/g, '_'),
        name: badgeName,
        description: `Legacy badge: ${badgeName}`,
        icon: '🏆',
        color: '#FFD700',
        rarity: 'common' as const,
        awardedAt: new Date()
      };

      if (!user.badges) {
        user.badges = [];
      }

      const existingBadge = user.badges.find(badge => 
        badge.name === badgeName || badge.id === legacyBadge.id
      );

      if (!existingBadge) {
        user.badges.push(legacyBadge);
        await user.save();
        console.log(`Awarded legacy badge "${badgeName}" to user ${userId}.`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error awarding badge "${badgeName}" to user ${userId}:`, error);
    return false;
  }
}

export async function awardReward(userId: string, rewardName: string): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for reward award.`);
      return false;
    }

    // For simplicity, we'll store rewards as badges for now.
    // In a more complex system, you might have a separate rewards array or object.
    if (!user.badges.includes(rewardName)) {
      user.badges.push(rewardName);
      await user.save();
      console.log(`Awarded reward "${rewardName}" to user ${userId}.`);
      return true;
    } else {
      console.log(`User ${userId} already has reward "${rewardName}".`);
      return false;
    }
  } catch (error) {
    console.error(`Error awarding reward "${rewardName}" to user ${userId}:`, error);
    return false;
  }
}

export async function checkAndAwardTopAuthor(): Promise<void> {
  try {
    // Find the user with the most total likes across all their public stories
    const topAuthor = await User.aggregate([
      {
        $lookup: {
          from: 'stories',
          localField: 'stories',
          foreignField: '_id',
          as: 'userStories'
        }
      },
      {
        $unwind: '$userStories'
      },
      {
        $match: {
          'userStories.isPublic': true // Only consider public stories
        }
      },
      {
        $group: {
          _id: '$_id',
          totalLikes: { $sum: '$userStories.likes' },
          user: { $first: '$ROOT' }
        }
      },
      {
        $sort: { totalLikes: -1 }
      },
      {
        $limit: 1
      }
    ]);

    if (topAuthor.length > 0) {
      const authorId = topAuthor[0].user._id;
      await awardReward(authorId, "Top Author");
    } else {
      console.log("No stories found to determine top author.");
    }
  } catch (error) {
    console.error("Error checking and awarding top author:", error);
  }
}