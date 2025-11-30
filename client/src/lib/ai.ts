import { apiRequest } from "./queryClient";
import { StoryGenerationParams, StoryWithAudio } from "@/types";

export async function generateStory(params: StoryGenerationParams): Promise<StoryWithAudio> {
  const response = await apiRequest("POST", "/api/stories/generate", params);
  return response.json();
}

export async function continueStory(storyId: string, continuationPrompt?: string, conclude?: boolean): Promise<StoryWithAudio> {
  const response = await apiRequest("POST", `/api/stories/${storyId}/continue`, 
    { continuationPrompt, conclude }
  );
  return response.json();
}

export async function makeChoice(storyId: string, chapterNumber: number, choice: string): Promise<StoryWithAudio> {
    const response = await apiRequest("POST", `/api/stories/${storyId}/chapters/${chapterNumber}/choice`, { choice });
    return response.json();
  }

export async function getStorySuggestionsBySettings(settings: Partial<StoryGenerationParams["settings"]>): Promise<string[]> {
  const response = await apiRequest("POST", "/api/stories/suggestions", { settings });
  return response.json();
}
 
export async function getStoryTitleSuggestions(content: string): Promise<string[]> {
  const response = await apiRequest("POST", "/api/stories/title-suggestions", { content });
  return response.json();
}

// Profile API functions
export async function updateUserProfile(profileData: { name: string; email?: string }) {
  const response = await apiRequest("PATCH", "/api/user/profile", profileData);
  return response.json();
}

export async function getUserStories() {
  const response = await apiRequest("GET", "/api/user/stories");
  return response.json();
}

export async function updateStory(storyId: string, updateData: { title: string; content: string; isPublic: boolean }) {
  const response = await apiRequest("PUT", `/api/stories/${storyId}`, updateData);
  return response.json();
}