import { Request, Response } from 'express';
import { listUsers, getUserById, createUserAdmin, updateUserAdmin, deleteUserAdmin, listStoriesAdmin, setStoryVisibilityAdmin, deleteStoryAdmin, awardTopAuthorAdmin } from '../services/admin.service';

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (error: any) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || 'Failed to fetch user' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, isPremium } = req.body;
    const created = await createUserAdmin({ name, email, password, role, isPremium });
    res.status(201).json(created);
  } catch (error: any) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || 'Failed to create user', code: error?.code });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, isPremium } = req.body;
    const updated = await updateUserAdmin(req.params.id, { name, email, role, isPremium });
    res.json(updated);
  } catch (error: any) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || 'Failed to update user', code: error?.code });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await deleteUserAdmin(req.params.id);
    res.json(result);
  } catch (error: any) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || 'Failed to delete user' });
  }
};

export const getAllStories = async (_req: Request, res: Response) => {
  try {
    const stories = await listStoriesAdmin();
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ message: 'Failed to fetch stories' });
  }
};

export const updateStoryVisibility = async (req: Request, res: Response) => {
  try {
    const { isPublic } = req.body as { isPublic: boolean };
    const story = await setStoryVisibilityAdmin(req.params.id, isPublic);
    res.json(story);
  } catch (error: any) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || 'Failed to update story visibility' });
  }
};

export const deleteStory = async (req: Request, res: Response) => {
  try {
    const result = await deleteStoryAdmin(req.params.id);
    res.json(result);
  } catch (error: any) {
    const status = error?.status || 500;
    res.status(status).json({ message: error?.message || 'Failed to delete story' });
  }
};

export const awardTopAuthor = async (_req: Request, res: Response) => {
  try {
    const result = await awardTopAuthorAdmin();
    res.json(result);
  } catch (error) {
    console.error('Error awarding top author:', error);
    res.status(500).json({ message: 'Failed to award top author.' });
  }
};

