export interface VoiceOption {
  id: string;
  name: string;
  category: string;
  description?: string;
  labels: {
    accent?: string;
    age?: string;
    description?: string;
    gender?: string;
    use_case?: string;
  };
  preview_url?: string;
}

export interface StoryWithAudio {
  _id: string;
  title: string;
  content: string;
  audioUrl?: string;
  settings?: any;
  narrationVoice?: string;
} 