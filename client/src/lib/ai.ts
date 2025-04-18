import { apiRequest } from "./queryClient";
import { StoryGenerationParams, StoryWithAudio } from "@/types";

export async function generateStory(params: StoryGenerationParams): Promise<StoryWithAudio> {
  const response = await apiRequest("POST", "/api/stories/generate", params);
  return response.json();
}

export async function continueStory(storyId: number, continuationPrompt?: string): Promise<StoryWithAudio> {
  const response = await apiRequest("POST", `/api/stories/${storyId}/continue`, 
    continuationPrompt ? { continuationPrompt } : undefined
  );
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
 