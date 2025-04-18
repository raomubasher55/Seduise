import { apiRequest } from "./queryClient";
import { TextToSpeechParams } from "@/types";

export interface SpeechGenerationResponse {
  audioUrl: string;
  fallback?: boolean;
  message?: string;
}

export async function generateSpeech(params: TextToSpeechParams): Promise<SpeechGenerationResponse> {
  const response = await apiRequest("POST", "/api/speech/generate", params);
  return response.json();
}

export async function getVoices(): Promise<{ id: string, name: string, gender: string, style: string, isPremium: boolean }[]> {
  const response = await apiRequest("GET", "/api/speech/voices");
  return response.json();
}

export function formatAudioDuration(seconds: number): string { 
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
 
export function estimateAudioDuration(text: string): number {
  // Average reading speed is about 150 words per minute
  const words = text.split(/\s+/).length;
  return (words / 150) * 60; // duration in seconds
}
