import { User } from "../models/user.model";
import { Story } from "../models/story.model";

export async function awardBadge(userId: string, badgeName: string): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for badge award.`);
      return false;
    }

    if (!user.badges.includes(badgeName)) {
      user.badges.push(badgeName);
      await user.save();
      console.log(`Awarded badge "${badgeName}" to user ${userId}.`);
      return true;
    } else {
      console.log(`User ${userId} already has badge "${badgeName}".`);
      return false;
    }
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