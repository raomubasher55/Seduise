import { Request, Response, NextFunction } from 'express';
import { badgeService } from '../services/badge.service';

// Queue for processing badge checks to avoid blocking requests
interface BadgeCheckTask {
  userId: string;
  trigger: string;
  timestamp: Date;
}

class EngagementTracker {
  private badgeCheckQueue: BadgeCheckTask[] = [];
  private isProcessingQueue = false;

  /**
   * Add a badge check task to the queue
   */
  private enqueueBadgeCheck(userId: string, trigger: string) {
    // Avoid duplicate checks for the same user within a short time
    const recentCheck = this.badgeCheckQueue.find(
      task => task.userId === userId && 
      Date.now() - task.timestamp.getTime() < 30000 // 30 seconds
    );

    if (!recentCheck) {
      this.badgeCheckQueue.push({
        userId,
        trigger,
        timestamp: new Date()
      });

      // Start processing if not already running
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    }
  }

  /**
   * Process the badge check queue
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.badgeCheckQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.badgeCheckQueue.length > 0) {
      const task = this.badgeCheckQueue.shift();
      if (!task) continue;

      try {
        console.log(`🏆 Checking badges for user ${task.userId} (trigger: ${task.trigger})`);
        const result = await badgeService.processUserBadges(task.userId);
        
        if (result.newBadges.length > 0) {
          console.log(`🎉 User ${task.userId} earned ${result.newBadges.length} new badges: ${result.newBadges.join(', ')}`);
        }

        if (result.errors.length > 0) {
          console.error(`❌ Badge processing errors for user ${task.userId}:`, result.errors);
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing badge check for user ${task.userId}:`, error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Trigger badge check for story creation
   */
  onStoryCreated(userId: string) {
    this.enqueueBadgeCheck(userId, 'story_created');
  }

  /**
   * Trigger badge check for story interaction
   */
  onStoryInteraction(userId: string, interactionType: 'like' | 'upvote' | 'downvote' | 'play') {
    this.enqueueBadgeCheck(userId, `story_${interactionType}`);
  }

  /**
   * Manual badge check (for testing or admin functions)
   */
  async checkBadgesNow(userId: string): Promise<{ newBadges: string[]; errors: string[] }> {
    try {
      console.log(`🔍 Manual badge check for user ${userId}`);
      return await badgeService.processUserBadges(userId);
    } catch (error) {
      console.error(`Error in manual badge check for user ${userId}:`, error);
      return {
        newBadges: [],
        errors: [`Manual check failed: ${error.message}`]
      };
    }
  }
}

// Singleton instance
export const engagementTracker = new EngagementTracker();

/**
 * Middleware to track engagement and trigger badge checks
 */
export const trackEngagement = (action: 'story_created' | 'story_liked' | 'story_upvoted' | 'story_downvoted' | 'story_played') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store the original res.json to intercept successful responses
    const originalJson = res.json;

    res.json = function(data: any) {
      // Only trigger badge checks on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.session?.userId;
        
        if (userId) {
          switch (action) {
            case 'story_created':
              engagementTracker.onStoryCreated(userId);
              break;
            case 'story_liked':
            case 'story_upvoted':
            case 'story_downvoted':
            case 'story_played':
              // For interactions, we need to identify the story author
              // This will be handled in the route handlers
              break;
          }
        }
      }

      // Call the original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Helper function to track story interactions by story author
 */
export const trackStoryInteraction = async (storyId: string, interactionType: 'like' | 'upvote' | 'downvote' | 'play') => {
  try {
    const { Story } = await import('../models/story.model');
    const story = await Story.findById(storyId);
    
    if (story && story.userId) {
      engagementTracker.onStoryInteraction(story.userId, interactionType);
    }
  } catch (error) {
    console.error(`Error tracking story interaction for story ${storyId}:`, error);
  }
};

/**
 * Daily badge check function (can be called by a cron job)
 */
export const runDailyBadgeCheck = async () => {
  try {
    console.log('🕐 Starting daily badge check for all users...');
    
    const { User } = await import('../models/user.model');
    const users = await User.find({}, '_id').lean();
    
    let processedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const result = await badgeService.processUserBadges(user._id.toString());
        
        if (result.newBadges.length > 0) {
          console.log(`📊 Daily check: User ${user._id} earned badges: ${result.newBadges.join(', ')}`);
        }
        
        processedCount++;
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error in daily badge check for user ${user._id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Daily badge check completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error running daily badge check:', error);
  }
};