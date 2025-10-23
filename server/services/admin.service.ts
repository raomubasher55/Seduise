import { User } from "../models/user.model";
import { Story } from "../models/story.model";
import { hash } from "bcrypt";

class AdminServiceError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'AdminServiceError';
    if (status) this.status = status;
    if (code) this.code = code;
  }
}

export const listUsers = async () => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return users;
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id).select("-password");
  if (!user) throw new AdminServiceError('User not found', 404);
  return user;
};

export const createUserAdmin = async (data: { name: string; email: string; password: string; role?: string; isPremium?: boolean; }) => {
  const { name, email, password, role, isPremium } = data;

  const existing = await User.findOne({ email });
  if (existing) throw new AdminServiceError('Email already in use', 400, 'EMAIL_IN_USE');

  const hashedPassword = await hash(password, 10);
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role: role || 'user',
    isPremium: isPremium || false,
  });
  await newUser.save();

  const out = { ...newUser.toObject() } as any;
  delete out.password;
  return out;
};

export const updateUserAdmin = async (id: string, data: { name?: string; email?: string; role?: string; isPremium?: boolean; }) => {
  const { name, email, role, isPremium } = data;
  const user = await User.findById(id);
  if (!user) throw new AdminServiceError('User not found', 404);

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) throw new AdminServiceError('Email already in use', 400, 'EMAIL_IN_USE');
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role as any;
  if (typeof isPremium !== 'undefined') user.isPremium = !!isPremium;

  await user.save();
  const out = { ...user.toObject() } as any;
  delete out.password;
  return out;
};

export const deleteUserAdmin = async (id: string) => {
  const result = await User.findByIdAndDelete(id);
  if (!result) throw new AdminServiceError('User not found', 404);
  await Story.deleteMany({ userId: id });
  return { message: 'User and associated stories deleted successfully' };
};

export const listStoriesAdmin = async () => {
  const stories = await Story.find().sort({ createdAt: -1 });
  const enhanced = await Promise.all(stories.map(async (story) => {
    const user = await User.findById(story.userId).select('name');
    const obj = story.toObject() as any;
    obj.userName = user ? user.name : 'Unknown User';
    return obj;
  }));
  return enhanced;
};

export const setStoryVisibilityAdmin = async (storyId: string, isPublic: boolean) => {
  const story = await Story.findById(storyId);
  if (!story) throw new AdminServiceError('Story not found', 404);
  story.isPublic = isPublic;
  await story.save();
  return story;
};

export const deleteStoryAdmin = async (storyId: string) => {
  const result = await Story.findByIdAndDelete(storyId);
  if (!result) throw new AdminServiceError('Story not found', 404);
  return { message: 'Story deleted successfully' };
};

export const awardTopAuthorAdmin = async () => {
  // Lazy import to avoid tight coupling
  const { checkAndAwardTopAuthor } = await import('./reward.service');
  await checkAndAwardTopAuthor();
  return { message: 'Top author check and award initiated.' };
};

