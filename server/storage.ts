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
    
    // Initialize with sample popular stories
    const exampleStory1: Story = {
      _id: this.storyId.toString(),
      title: "Midnight in Paris",
      content: "A passionate encounter under the Parisian moonlight changes everything for two strangers...",
      settings: {
        timePeriod: "Contemporary",
        location: "Paris",
        atmosphere: "Romantic",
        protagonistGender: "female",
        partnerGender: "male",
        relationship: "Strangers",
        writingTone: "Passionate",
        length: 1500
      },
      userId: "system",
      isPublic: true,
      likes: 238,
      plays: 567,
      createdAt: new Date()
    };
    this.stories.set(this.storyId.toString(), exampleStory1);
    this.storyId++;
    
    const exampleStory2: Story = {
      _id: this.storyId.toString(),
      title: "The Pirate's Captive",
      content: "Captured by a notorious pirate captain, a noble lady discovers her own desires at sea...",
      settings: {
        timePeriod: "Medieval",
        location: "Caribbean Sea",
        atmosphere: "Mysterious",
        protagonistGender: "female",
        partnerGender: "male",
        relationship: "Enemies to Lovers",
        writingTone: "Intense",
        length: 2000
      },
      userId: "system",
      isPublic: true,
      likes: 186,
      plays: 423,
      createdAt: new Date()
    };
    this.stories.set(this.storyId.toString(), exampleStory2);
    this.storyId++;
    
    const exampleStory3: Story = {
      _id: this.storyId.toString(),
      title: "CEO's Secret",
      content: "When a young executive discovers her boss's hidden desires, their professional relationship transforms...",
      settings: {
        timePeriod: "Contemporary",
        location: "Manhattan",
        atmosphere: "Tense",
        protagonistGender: "female",
        partnerGender: "male",
        relationship: "Boss/Employee",
        writingTone: "Passionate",
        length: 1800
      },
      userId: "system",
      isPublic: true,
      likes: 312,
      plays: 678,
      createdAt: new Date()
    };
    this.stories.set(this.storyId.toString(), exampleStory3);
    this.storyId++;
    
    const exampleStory4: Story = {
      _id: this.storyId.toString(),
      title: "Dragon's Desire",
      content: "In a world of magic, a dragon shifter finds his fated mate in an unexpected place...",
      settings: {
        timePeriod: "Fantasy Realm",
        location: "Enchanted Forest",
        atmosphere: "Magical",
        protagonistGender: "male",
        partnerGender: "female",
        relationship: "Fated Mates",
        writingTone: "Intense",
        length: 2200
      },
      userId: "system",
      isPublic: true,
      likes: 156,
      plays: 389,
      createdAt: new Date()
    };
    this.stories.set(this.storyId.toString(), exampleStory4);
    this.storyId++;
    
    // Initialize with some sample voices
    this.initializeVoices();
    
    // Initialize with sample discussions
    this.discussions = [
      {
        id: 1,
        title: "Writing Techniques for Passionate Romance",
        content: "I'm trying to improve the passionate scenes in my stories. Any tips from experienced writers?",
        author: "RomanceWriter",
        commentCount: 15
      },
      {
        id: 2,
        title: "Historical Accuracy in Period Romances",
        content: "How important is historical accuracy in your erotic historical fiction?",
        author: "HistoryBuff",
        commentCount: 8
      },
      {
        id: 3,
        title: "Character Development in Short Stories",
        content: "How do you develop compelling characters in shorter formats?",
        author: "StoryMaster",
        commentCount: 22
      },
      {
        id: 4,
        title: "Favorite Settings for Steamy Encounters",
        content: "What are some unique settings you've used that worked well?",
        author: "CreativeScribe",
        commentCount: 17
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
