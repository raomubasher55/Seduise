import { StorySettings } from "@shared/schema";

export interface StoryWithAudio extends Omit<StorySettings, 'narrationVoice'> {
  _id: string;
  id?: number;
  title: string;
  content: string;
  narrationVoice: string;
  audioUrl?: string;
  userId?: string;
  imageUrl?: string;
  likes: number;
  plays: number;
  createdAt: string;
  isPublic: boolean;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  style: string;
  isPremium: boolean;
}

export interface StoryGenerationParams {
  title: string;
  settings: StorySettings;
  maxTokens?: number;
  isPublic?: boolean;
  category?: string;
}

export interface TextToSpeechParams {
  text: string;
  voiceId: string;
  storyId?: number;
}

export interface ForumTopic {
  id: number;
  title: string;
  content: string;
  author: string;
  commentCount: number;
}

export interface CommunityStory {
  id: number;
  title: string;
  description: string;
  likes: number;
  plays: number;
}
