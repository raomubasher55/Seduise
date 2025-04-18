import { 
  users, type User, type InsertUser,
  stories, type Story, type InsertStory,
  comments, type Comment, type InsertComment,
  voices, type Voice, type InsertVoice,
  StorySettings
} from "@shared/schema";
import { ForumTopic, CommunityStory } from "@/types";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Story methods
  getStory(id: string): Promise<Story | undefined>;
  getPublicStories(): Promise<Story[]>;
  getFeaturedStories(): Promise<Story[]>;
  getPopularStories(): Promise<CommunityStory[]>;
  createStory(story: InsertStory): Promise<Story>;
  updateStoryContent(id: string, content: string): Promise<Story>;
  likeStory(id: string): Promise<void>;
  incrementStoryPlays(id: string): Promise<void>;
  
  // Voice methods
  getVoices(): Promise<Voice[]>;
  
  // Audio methods
  getStoryAudio(storyId: string): Promise<{ audioUrl: string } | undefined>;
  saveStoryAudio(storyId: string, audioUrl: string): Promise<void>;
  
  // Community methods
  getDiscussions(): Promise<ForumTopic[]>;
  getComments(storyId: string): Promise<Comment[]>;
  addComment(comment: InsertComment): Promise<Comment>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private stories: Map<string, Story>;
  private voices: Map<string, Voice>;
  private comments: Map<string, Comment>;
  private storyAudios: Map<string, string>;
  private discussions: ForumTopic[];
  
  private userId: number;
  private storyId: number;
  private commentId: number;
  private voiceId: number;

  constructor() {
    this.users = new Map();
    this.stories = new Map();
    this.voices = new Map();
    this.comments = new Map();
    this.storyAudios = new Map();
    
    this.userId = 1;
    this.storyId = 1;
    this.commentId = 1;
    this.voiceId = 1;
    
    // Initialize with some sample voices
    this.initializeVoices();
    
    // Initialize with sample discussions
    this.discussions = [
      {
        id: 1,
        title: "Writing Techniques for Sensual Scenes",
        content: "Tips and advice for creating evocative imagery in your stories.",
        author: "WriterGirl88",
        commentCount: 24
      },
      {
        id: 2,
        title: "Historical Settings That Inspire Passion",
        content: "Exploring time periods that provide rich backdrops for romantic encounters.",
        author: "HistoryLover42",
        commentCount: 18
      },
      {
        id: 3,
        title: "Character Development: Creating Desire",
        content: "How to build characters with chemistry and emotional depth.",
        author: "NovelistDreams",
        commentCount: 31
      }
    ];
  }

  private initializeVoices() {
    const defaultVoices: InsertVoice[] = [
      {
        name: "Sophia",
        gender: "female",
        style: "soft",
        apiId: "EXAVITQu4vr4xnSDxMaL",
        isPremium: false
      },
      {
        name: "James",
        gender: "male",
        style: "deep",
        apiId: "VR6AewLTigWG4xSOukaG",
        isPremium: false
      },
      {
        name: "Isabella",
        gender: "female",
        style: "sensual",
        apiId: "yoZ06aMxZJJ28mfd3POQ",
        isPremium: true
      },
      {
        name: "Michael",
        gender: "male",
        style: "authoritative",
        apiId: "TxGEqnHWrfWFTfGW9XjX",
        isPremium: true
      },
      {
        name: "Lily",
        gender: "female",
        style: "playful",
        apiId: "21m00Tcm4TlvDq8ikWAM",
        isPremium: true
      }
    ];
    
    defaultVoices.forEach(voice => {
      const id = this.voiceId.toString();
      this.voices.set(id, { ...voice, id, isPremium: voice.isPremium || false });
      this.voiceId++;
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId.toString();
    const user: User = { ...insertUser, id, isPremium: insertUser.isPremium || false };
    this.users.set(id, user);
    this.userId++;
    return user;
  }
  
  // Story methods
  async getStory(id: string): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getPublicStories(): Promise<Story[]> {
    return Array.from(this.stories.values())
      .filter(story => story.isPublic)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 6);
  }

  async getFeaturedStories(): Promise<Story[]> {
    return Array.from(this.stories.values())
      .filter(story => story.isPublic)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6);
  }

  async getPopularStories(): Promise<CommunityStory[]> {
    return Array.from(this.stories.values())
      .filter(story => story.isPublic)
      .sort((a, b) => (b.likes || 0) + (b.plays || 0) - ((a.likes || 0) + (a.plays || 0)))
      .slice(0, 4)
      .map(story => ({
        id: story._id.toString(),
        title: story.title,
        description: story.content.substring(0, 100) + "...",
        likes: story.likes || 0,
        plays: story.plays || 0
      }));
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.storyId.toString();
    const createdAt = new Date().toISOString();
    const story: Story = {
      ...insertStory,
      _id: id,
      likes: 0,
      plays: 0,
      createdAt: new Date(createdAt)
    };
    this.stories.set(id, story);
    this.storyId++;
    return story;
  }

  async updateStoryContent(id: string, content: string): Promise<Story> {
    const story = this.stories.get(id);
    if (!story) {
      throw new Error("Story not found");
    }
    
    const updatedStory = { ...story, content };
    this.stories.set(id, updatedStory);
    return updatedStory;
  }

  async likeStory(id: string): Promise<void> {
    const story = this.stories.get(id);
    if (!story) {
      throw new Error("Story not found");
    }
    
    story.likes = (story.likes || 0) + 1;
    this.stories.set(id, story);
  }

  async incrementStoryPlays(id: string): Promise<void> {
    const story = this.stories.get(id);
    if (!story) {
      throw new Error("Story not found");
    }
    
    story.plays = (story.plays || 0) + 1;
    this.stories.set(id, story);
  }
  
  // Voice methods
  async getVoices(): Promise<Voice[]> {
    return Array.from(this.voices.values());
  }
  
  // Audio methods
  async getStoryAudio(storyId: string): Promise<{ audioUrl: string } | undefined> {
    const audioUrl = this.storyAudios.get(storyId);
    return audioUrl ? { audioUrl } : undefined;
  }

  async saveStoryAudio(storyId: string, audioUrl: string): Promise<void> {
    this.storyAudios.set(storyId, audioUrl);
  }
  
  // Community methods
  async getDiscussions(): Promise<ForumTopic[]> {
    return this.discussions;
  }

  async getComments(storyId: string): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => comment.storyId === storyId);
  }

  async addComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentId.toString();
    const createdAt = new Date().toISOString();
    const comment: Comment = {
      ...insertComment,
      id,
      userId: insertComment.userId || null,
      storyId: insertComment.storyId || null,
      createdAt: new Date(createdAt)
    };
    this.comments.set(id, comment);
    this.commentId++;
    return comment;
  }
}

export const storage = new MemStorage();
