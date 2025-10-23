import { Request, Response } from 'express';
import { debugAndFixSubscription, getStoriesForUser, setUserStoryVisibility, deleteUserStory } from '../services/user.service';

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

