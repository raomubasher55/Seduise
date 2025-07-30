import { User } from '../models/user.model';
import { Story } from '../models/story.model';
import { BADGE_DEFINITIONS, BADGE_CHECK_ORDER, BadgeDefinition, getBadgeById } from '../constants/badges';

export interface BadgeAward {
  badgeId: string;
  awarded: boolean;
  reason?: string;
  rewards?: {
    credits?: number;
    premium_days?: number;
  };
}

export interface UserStats {
  totalLikes: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalPlays: number;
  storiesCreated: number;
  engagementRatio: number;
  upvoteRatio: number;
  monthlyLikes: number;
  monthlyUpvotes: number;
  monthlyStories: number;
}

export class BadgeService {
  
  /**
   * Get comprehensive user statistics for badge evaluation
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User ${userId} not found for stats calculation`);
        return null;
      }

      // Get all user's stories
      const userStories = await Story.find({ userId });
      
      // Calculate total stats
      const totalLikes = userStories.reduce((sum, story) => sum + (story.likes || 0), 0);
      const totalUpvotes = userStories.reduce((sum, story) => sum + (story.upvotes || 0), 0);
      const totalDownvotes = userStories.reduce((sum, story) => sum + (story.downvotes || 0), 0);
      const totalPlays = userStories.reduce((sum, story) => sum + (story.plays || 0), 0);
      const storiesCreated = userStories.length;

      // Calculate ratios (avoid division by zero)
      const engagementRatio = totalPlays > 0 ? totalLikes / totalPlays : 0;
      const totalVotes = totalUpvotes + totalDownvotes;
      const upvoteRatio = totalVotes > 0 ? totalUpvotes / totalVotes : 0;

      // Calculate monthly stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyStories = userStories.filter(story => {
        const storyDate = new Date(story.createdAt);
        return storyDate.getMonth() === currentMonth && storyDate.getFullYear() === currentYear;
      });

      const monthlyLikes = monthlyStories.reduce((sum, story) => sum + (story.likes || 0), 0);
      const monthlyUpvotes = monthlyStories.reduce((sum, story) => sum + (story.upvotes || 0), 0);

      return {
        totalLikes,
        totalUpvotes,
        totalDownvotes,
        totalPlays,
        storiesCreated,
        engagementRatio,
        upvoteRatio,
        monthlyLikes,
        monthlyUpvotes,
        monthlyStories: monthlyStories.length
      };

    } catch (error) {
      console.error('Error calculating user stats:', error);
      return null;
    }
  }

  /**
   * Check if a user qualifies for a specific badge
   */
  private evaluateBadgeCriteria(badge: BadgeDefinition, stats: UserStats): boolean {
    try {
      const { criteria } = badge;
      
      switch (criteria.type) {
        case 'likes':
          const likesValue = criteria.timeframe === 'monthly' ? stats.monthlyLikes : stats.totalLikes;
          return likesValue >= criteria.threshold;

        case 'upvotes':
          const upvotesValue = criteria.timeframe === 'monthly' ? stats.monthlyUpvotes : stats.totalUpvotes;
          let meetsUpvoteThreshold = upvotesValue >= criteria.threshold;
          
          // Check additional conditions for upvote badges
          if (criteria.additional_conditions) {
            if (criteria.additional_conditions.upvote_ratio) {
              meetsUpvoteThreshold = meetsUpvoteThreshold && 
                stats.upvoteRatio >= criteria.additional_conditions.upvote_ratio;
            }
            if (criteria.additional_conditions.min_total_votes) {
              const totalVotes = stats.totalUpvotes + stats.totalDownvotes;
              meetsUpvoteThreshold = meetsUpvoteThreshold && 
                totalVotes >= criteria.additional_conditions.min_total_votes;
            }
          }
          return meetsUpvoteThreshold;

        case 'plays':
          return stats.totalPlays >= criteria.threshold;

        case 'stories_created':
          const storiesValue = criteria.timeframe === 'monthly' ? stats.monthlyStories : stats.storiesCreated;
          return storiesValue >= criteria.threshold;

        case 'engagement_ratio':
          let meetsEngagementThreshold = stats.engagementRatio >= criteria.threshold;
          
          // Check minimum plays requirement
          if (criteria.additional_conditions?.min_plays) {
            meetsEngagementThreshold = meetsEngagementThreshold && 
              stats.totalPlays >= criteria.additional_conditions.min_plays;
          }
          return meetsEngagementThreshold;

        case 'community_impact':
          // Custom logic for community impact badges
          return stats.totalLikes > 10 && stats.upvoteRatio > 0.6;

        default:
          console.warn(`Unknown badge criteria type: ${criteria.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error evaluating badge criteria for ${badge.id}:`, error);
      return false;
    }
  }

  /**
   * Check which new badges a user has earned
   */
  async checkEligibleBadges(userId: string): Promise<BadgeAward[]> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return [];
      }

      const stats = await this.getUserStats(userId);
      if (!stats) {
        return [];
      }

      const currentBadges = user.badges || [];
      const newBadges: BadgeAward[] = [];

      // Check badges in priority order (legendary first)
      for (const badgeId of BADGE_CHECK_ORDER) {
        // Skip if user already has this badge
        if (currentBadges.some(badge => badge.id === badgeId)) {
          continue;
        }

        const badgeDefinition = getBadgeById(badgeId);
        if (!badgeDefinition) {
          continue;
        }

        // Check if user qualifies for this badge
        if (this.evaluateBadgeCriteria(badgeDefinition, stats)) {
          newBadges.push({
            badgeId,
            awarded: true,
            reason: `Earned by meeting criteria: ${badgeDefinition.description}`,
            rewards: badgeDefinition.rewards
          });
        }
      }

      return newBadges;

    } catch (error) {
      console.error('Error checking eligible badges:', error);
      return [];
    }
  }

  /**
   * Award badges to a user and apply rewards
   */
  async awardBadges(userId: string, badgeAwards: BadgeAward[]): Promise<{ success: boolean; awarded: string[]; errors: string[] }> {
    const awarded: string[] = [];
    const errors: string[] = [];

    try {
      const user = await User.findById(userId);
      if (!user) {
        errors.push('User not found');
        return { success: false, awarded, errors };
      }

      for (const award of badgeAwards) {
        try {
          const badgeDefinition = getBadgeById(award.badgeId);
          if (!badgeDefinition) {
            errors.push(`Badge definition not found: ${award.badgeId}`);
            continue;
          }

          // Check if user already has this badge
          const existingBadge = user.badges?.find(badge => badge.id === award.badgeId);
          if (existingBadge) {
            continue; // Skip if already awarded
          }

          // Add badge to user
          if (!user.badges) {
            user.badges = [];
          }

          user.badges.push({
            id: award.badgeId,
            name: badgeDefinition.name,
            description: badgeDefinition.description,
            icon: badgeDefinition.icon,
            color: badgeDefinition.color,
            rarity: badgeDefinition.rarity,
            awardedAt: new Date()
          });

          // Apply rewards
          if (award.rewards?.credits) {
            user.credits = (user.credits || 0) + award.rewards.credits;
            console.log(`Awarded ${award.rewards.credits} credits for badge: ${badgeDefinition.name}`);
          }

          if (award.rewards?.premium_days) {
            // Extend premium subscription (implementation depends on your subscription system)
            console.log(`Badge would award ${award.rewards.premium_days} premium days: ${badgeDefinition.name}`);
            // TODO: Implement premium days extension logic based on your subscription system
          }

          awarded.push(award.badgeId);
          console.log(`✅ Awarded badge "${badgeDefinition.name}" to user ${userId}`);

        } catch (error) {
          console.error(`Error awarding badge ${award.badgeId}:`, error);
          errors.push(`Failed to award badge ${award.badgeId}: ${error.message}`);
        }
      }

      // Save user with new badges and rewards
      if (awarded.length > 0) {
        await user.save();
      }

      return {
        success: awarded.length > 0 || errors.length === 0,
        awarded,
        errors
      };

    } catch (error) {
      console.error('Error in awardBadges:', error);
      errors.push(`System error: ${error.message}`);
      return { success: false, awarded, errors };
    }
  }

  /**
   * Main function to check and award all eligible badges
   */
  async processUserBadges(userId: string): Promise<{ newBadges: string[]; errors: string[] }> {
    try {
      const eligibleBadges = await this.checkEligibleBadges(userId);
      
      if (eligibleBadges.length === 0) {
        return { newBadges: [], errors: [] };
      }

      const result = await this.awardBadges(userId, eligibleBadges);
      
      return {
        newBadges: result.awarded,
        errors: result.errors
      };

    } catch (error) {
      console.error('Error processing user badges:', error);
      return {
        newBadges: [],
        errors: [`Failed to process badges: ${error.message}`]
      };
    }
  }

  /**
   * Get user's badge summary for display
   */
  async getUserBadgeSummary(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.badges) {
        return {
          total: 0,
          byRarity: { common: 0, rare: 0, epic: 0, legendary: 0 },
          recent: []
        };
      }

      const badges = user.badges;
      const byRarity = {
        common: badges.filter(b => b.rarity === 'common').length,
        rare: badges.filter(b => b.rarity === 'rare').length,
        epic: badges.filter(b => b.rarity === 'epic').length,
        legendary: badges.filter(b => b.rarity === 'legendary').length
      };

      const recent = badges
        .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime())
        .slice(0, 5);

      return {
        total: badges.length,
        byRarity,
        recent
      };

    } catch (error) {
      console.error('Error getting user badge summary:', error);
      return null;
    }
  }
}

// Export singleton instance
export const badgeService = new BadgeService();