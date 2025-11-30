import { Request, Response } from 'express';
import { debugAndFixSubscription, getStoriesForUser, setUserStoryVisibility, deleteUserStory, updateUserProfile } from '../services/user.service';

export const debugSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as string;
    const result = await debugAndFixSubscription(userId);
    res.json(result);
  } catch (error: any) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || 'Failed to check subscription' });
  }
};

export const getMyStories = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as string;
    const stories = await getStoriesForUser(userId);
    res.json(stories);
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ message: 'Failed to fetch stories' });
  }
};

export const updateMyStoryVisibility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { isPublic } = req.body as { isPublic: boolean };
    const userId = req.session.userId as string;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ message: 'Invalid visibility status' });
    }

    const story = await setUserStoryVisibility(userId, id, isPublic);
    res.json(story);
  } catch (error: any) {
    const status = error?.status || 500;
    const body: any = { message: error?.message || 'Failed to update story visibility' };
    if (error?.code) body.code = error.code;
    res.status(status).json(body);
  }
};

export const removeMyStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.session.userId as string;
    const result = await deleteUserStory(userId, id);
    res.json({ message: 'Story deleted successfully' });
  } catch (error: any) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || 'Failed to delete story' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    // Extract user ID from session (like other controllers)
    const userId = req.session.userId as string;

    // Validate session
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - no session' });
    }

    // Extract profile data from request body
    const profileData = req.body;

    // Validate that at least one field is provided for update
    if (!profileData || Object.keys(profileData).length === 0) {
      return res.status(400).json({ message: 'Profile data is required' });
    }

    // Call the service
    const updatedUser = await updateUserProfile(userId, profileData);

    // Successful response
    res.json({
      message: 'User profile updated successfully',
      data: updatedUser
    });

  } catch (error: any) {

    const status = error?.status || 500;
    res.status(status).json({
      message: error?.message || 'Failed to update user profile'
    });
  }
};
