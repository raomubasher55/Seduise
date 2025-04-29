import React , { useState, useEffect , useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { generateStory } from "@/lib/ai";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { VoiceOption } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { VoiceSelector } from "../components/VoiceSelector";

const TIME_PERIODS = ["Contemporary", "Medieval", "Victorian", "Future", "Fantasy Realm"];
const LOCATIONS = ["Urban City", "Beach Resort", "Mountain Retreat", "Luxury Estate", "Exotic Island"];
const ATMOSPHERES = ["Romantic", "Mysterious", "Passionate", "Playful", "Intense"];
const RELATIONSHIPS = ["Strangers", "Dating", "Married", "Friends", "Colleagues"];
const WRITING_TONES = ["Romantic", "Sensual", "Intense", "Playful", "Explicit"];
const NARRATION_VOICES = ["Soft Female", "Deep Male", "Sensual Female", "Authoritative Male", "Playful Female"];
const WRITING_STYLES = ["Romantic", "Passionate", "Playful", "Intense"];
const CATEGORIES = [
  { id: "romance", name: "Romance", icon: "❤️", color: "#FF6B8B" },
  { id: "fantasy", name: "Fantasy", icon: "✨", color: "#8A4FFF" },
  { id: "historical", name: "Historical", icon: "📜", color: "#B78040" },
  { id: "contemporary", name: "Contemporary", icon: "🏙️", color: "#4A90E2" },
  { id: "adventure", name: "Adventure", icon: "🌋", color: "#50C878" },
  { id: "passionate", name: "Passionate", icon: "🔥", color: "#FF4500" },
  { id: "playful", name: "Playful", icon: "😏", color: "#FF9500" },
  { id: "intense", name: "Intense", icon: "⚡", color: "#9747FF" }
];

// Local interface for story settings
interface StorySettings {
  timePeriod: string;
  location: string;
  atmosphere: string;
  protagonistGender: string;
  partnerGender: string;
  relationship: string;
  writingTone: string;
  narrationVoice: string;
  narrationVoiceId: string;
  length: number;
  // Additional properties that will be sent to the server
  settingDescription?: string;
  protagonistDescription?: string;
  loveInterestDescription?: string;
  explicitLevel?: number;
}

const CreateStory = () => {
  const { isPremium, user, hasCredits } = useAuth();
  const [, navigate] = useLocation();
  const [storyTitle, setStoryTitle] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("romance");
  const [settings, setSettings] = useState<StorySettings>({
    timePeriod: "Contemporary",
    location: "Beach Resort",
    atmosphere: "Romantic",
    protagonistGender: "Female",
    partnerGender: "Male",
    relationship: "Strangers",
    writingTone: "Romantic",
    narrationVoice: "",
    narrationVoiceId: "",
    length: 3
  });
  const [titleError, setTitleError] = useState<string>("");
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<"setting" | "characters" | "style" | "voice">("setting");
  const [explicitLevel, setExplicitLevel] = useState(50);
  const [creditsWarningShown, setCreditsWarningShown] = useState(false);
  
  // For additional inputs in the Setting tab
  const [settingDescription, setSettingDescription] = useState<string>("");
  
  // For additional inputs in the Characters tab
  const [protagonistDescription, setProtagonistDescription] = useState<string>("");
  const [loveInterestDescription, setLoveInterestDescription] = useState<string>("");
  
  // State for voice options
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isVoicePreviewPlaying, setIsVoicePreviewPlaying] = useState(false);
  const [audioPreviewSrc, setAudioPreviewSrc] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // Fetch voice options when component mounts
  useEffect(() => {
    const fetchVoiceOptions = async () => {
      try {
        const response = await apiRequest('GET', '/api/stories/voice-options');
        const data = await response.json();
        console.log("Fetched voice options:", data);
        setVoices(data);
        
        // Set a default voice if one hasn't been selected already
        if (!settings.narrationVoiceId && data.length > 0) {
          const defaultVoice = data.find((v: VoiceOption) => v.category === 'premade') || data[0];
          updateSetting("narrationVoiceId", defaultVoice.id);
          updateSetting("narrationVoice", defaultVoice.name);
          console.log(`Set default voice: ${defaultVoice.name} (${defaultVoice.id})`);
        }
      } catch (error) {
        console.error("Failed to fetch voice options:", error);
      }
    };
    
    fetchVoiceOptions();
  }, []);

  const storyGenerationMutation = useMutation({
    mutationFn: generateStory,
    onSuccess: (data) => {
      toast({
        title: "Story Generated",
        description: "Your personalized story has been created.",
      });
      navigate(`/story/${data._id}`);
    },
    onError: (error: any) => {
      // Check if this is a story limit error
      if (error.response?.data?.code === "STORY_LIMIT_REACHED") {
        toast({
          title: "Story Limit Reached",
          description: "Free users can only create 3 stories. Upgrade to premium for unlimited stories!",
          variant: "destructive",
          duration: 5000,
        });
        setShowUpgradeAlert(true);
      } 
      // Check if this is insufficient credits error
      else if (error.response?.data?.code === "INSUFFICIENT_CREDITS") {
        toast({
          title: "Insufficient Credits",
          description: (
            <div className="flex flex-col space-y-2">
              <p>You don't have enough credits to generate a story.</p>
              <Button 
                size="sm" 
                onClick={() => navigate('/credits')}
                className="mt-2 w-full bg-amber-600 hover:bg-amber-700"
              >
                Purchase Credits
              </Button>
            </div>
          ),
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate story. Please try again.",
          variant: "destructive",
        });
      }
    },
  });
  
  const handleGenerateStory = () => {
    if (!storyTitle.trim()) {
      setTitleError("Story title is required");
      toast({
        title: "Missing Title",
        description: "Please provide a title for your story.",
        variant: "destructive",
      });
      return;
    }
    
    if (!settings.narrationVoiceId) {
      toast({
        title: "Missing Voice",
        description: "Please select a narration voice for your story.",
        variant: "destructive",
      });
      return;
    }

    if (!isPremium && !hasCredits && !creditsWarningShown) {
      toast({
        title: "Insufficient Credits",
        description: (
          <div className="flex flex-col space-y-2">
            <p>You don't have enough credits to generate a story.</p>
            <Button 
              size="sm" 
              onClick={() => navigate('/credits')}
              className="mt-2 w-full bg-amber-600 hover:bg-amber-700"
            >
              Purchase Credits
            </Button>
          </div>
        ),
        variant: "destructive",
        duration: 5000,
      });
      setCreditsWarningShown(true);
      return;
    }
    
    // Include all the additional descriptive fields in the settings
    storyGenerationMutation.mutate({
      title: storyTitle,
      settings: {
        ...settings,
        narrationVoiceId: settings.narrationVoiceId,
        // Add the additional descriptive fields 
        settingDescription: settingDescription,
        protagonistDescription: protagonistDescription,
        loveInterestDescription: loveInterestDescription,
        explicitLevel: explicitLevel
      },
      maxTokens: settings.length * 500,
      isPublic: isPremium ? isPublic : false,
      category: category
    });
  };

  const updateSetting = (key: keyof StorySettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenderSelect = (type: "protagonistGender" | "partnerGender", gender: string) => {
    setSettings(prev => ({
      ...prev,
      [type]: gender
    }));
  };

  const handleStyleSelect = (style: string) => {
    updateSetting("writingTone", style);
  };

  const handleStoryLengthSelect = (length: number) => {
    updateSetting("length", length);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "setting":
        return (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2">Location</label>
                <Input
                  placeholder="Luxury hotel, tropical beach, mountain cabin..."
                  className="w-full bg-[#121212] border border-gray-700 text-white"
                  value={settings.location}
                  onChange={(e) => updateSetting("location", e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Time Period</label>
                <Input
                  placeholder="Modern day, 1920s, Victorian era..."
                  className="w-full bg-[#121212] border border-gray-700 text-white"
                  value={settings.timePeriod}
                  onChange={(e) => updateSetting("timePeriod", e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">Setting Description</label>
                <Textarea
                  placeholder="Describe the atmosphere, mood, and details of the setting..."
                  className="w-full bg-[#121212] border border-gray-700 text-white min-h-[100px]"
                  value={settingDescription}
                  onChange={(e) => setSettingDescription(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  className="bg-[#8B1E3F] hover:bg-[#a82b4f] text-white px-8"
                  onClick={() => setActiveTab("characters")}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        );
        
      case "characters":
        return (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Protagonist</h3>
                <div className="mb-3">
                  <label className="block text-white mb-2">Gender</label>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleGenderSelect("protagonistGender", "Female")} 
                      className={`flex-1 ${settings.protagonistGender === "Female" ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                    >
                      Female
                    </Button>
                    <Button 
                      onClick={() => handleGenderSelect("protagonistGender", "Male")} 
                      className={`flex-1 ${settings.protagonistGender === "Male" ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                    >
                      Male
                    </Button>
                    <Button 
                      onClick={() => handleGenderSelect("protagonistGender", "Non-binary")} 
                      className={`flex-1 ${settings.protagonistGender === "Non-binary" ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                    >
                      Non-binary
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white mb-2">Description</label>
                  <Textarea
                    placeholder="Describe the protagonist's appearance, personality, desires..."
                    className="w-full bg-[#121212] border border-gray-700 text-white min-h-[100px]"
                    value={protagonistDescription}
                    onChange={(e) => setProtagonistDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Love Interest</h3>
                <div className="mb-3">
                  <label className="block text-white mb-2">Gender</label>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleGenderSelect("partnerGender", "Female")} 
                      className={`flex-1 ${settings.partnerGender === "Female" ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                    >
                      Female
                    </Button>
                    <Button 
                      onClick={() => handleGenderSelect("partnerGender", "Male")} 
                      className={`flex-1 ${settings.partnerGender === "Male" ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                    >
                      Male
                    </Button>
                    <Button 
                      onClick={() => handleGenderSelect("partnerGender", "Non-binary")} 
                      className={`flex-1 ${settings.partnerGender === "Non-binary" ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                    >
                      Non-binary
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white mb-2">Description</label>
                  <Textarea
                    placeholder="Describe the love interest's appearance, personality, desires..."
                    className="w-full bg-[#121212] border border-gray-700 text-white min-h-[100px]"
                    value={loveInterestDescription}
                    onChange={(e) => setLoveInterestDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  className="bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"
                  onClick={() => setActiveTab("setting")}
                >
                  Previous
                </Button>
                <Button 
                  className="bg-[#8B1E3F] hover:bg-[#a82b4f] text-white px-8"
                  onClick={() => setActiveTab("style")}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        );
        
      case "style":
        return (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Writing Style</h3>
                <div className="grid grid-cols-2 gap-3">
                  {WRITING_STYLES.map((style) => (
                    <Button 
                      key={style}
                      onClick={() => handleStyleSelect(style)} 
                      className={`${settings.writingTone === style ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Explicit Level</h3>
                <div className="mt-2">
                  <Slider
                    value={[explicitLevel]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setExplicitLevel(value[0])}
                    className="w-full"
                    defaultValue={[50]}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>Suggestive</span>
                  <span>{explicitLevel}%</span>
                  <span>Explicit</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Story Length</h3>
                <div className="flex justify-between gap-3">
                  <Button 
                    onClick={() => handleStoryLengthSelect(2)} 
                    className={`flex-1 ${settings.length === 2 ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                  >
                    Short
                  </Button>
                  <Button 
                    onClick={() => handleStoryLengthSelect(3)} 
                    className={`flex-1 ${settings.length === 3 ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                  >
                    Medium
                  </Button>
                  <Button 
                    onClick={() => handleStoryLengthSelect(4)} 
                    className={`flex-1 ${settings.length === 4 ? "bg-[#8B1E3F] text-white" : "bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"}`}
                  >
                    Long
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  className="bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"
                  onClick={() => setActiveTab("characters")}
                >
                  Previous
                </Button>
                <Button 
                  className="bg-[#8B1E3F] hover:bg-[#a82b4f] text-white px-8"
                  onClick={() => setActiveTab("voice")}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        );
        
      case "voice":
        return (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Choose Narration Voice</h3>
                <VoiceSelector
                  selectedVoice={settings.narrationVoiceId}
                  onVoiceSelect={(voiceId: string) => {
                    // Find the selected voice in the list to get its name
                    const selectedVoice = voices.find((v: VoiceOption) => v.id === voiceId);
                    updateSetting("narrationVoiceId", voiceId);
                    
                    // Also update narrationVoice with the name if we have it
                    if (selectedVoice) {
                      updateSetting("narrationVoice", selectedVoice.name);
                      console.log(`Selected voice: ${selectedVoice.name} (${voiceId})`);
                    } else {
                      // Fallback to a description based on the ID
                      const defaultVoiceName = "Custom Voice";
                      updateSetting("narrationVoice", defaultVoiceName);
                      console.log(`Selected voice ID: ${voiceId} (name not found)`);
                    }
                  }}
                />
              </div>

              {/* Visibility Toggle - Only for Premium Users */}
              {isPremium && (
                <div className="mt-6 p-4 bg-[#1E1E1E] border border-gray-700 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Story Visibility</h3>
                  <div className="flex items-center space-x-2 mb-1">
                    <Switch 
                      id="story-visibility"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="story-visibility" className="cursor-pointer">
                      {isPublic ? 'Public - Share with the community' : 'Private - Only visible to you'}
                    </Label>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {isPublic 
                      ? 'Your story will be visible in the community section for others to enjoy.' 
                      : 'Your story will only be visible to you in your dashboard.'}
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  className="bg-[#121212] border border-gray-700 text-white hover:bg-[#1E1E1E]"
                  onClick={() => setActiveTab("style")}
                >
                  Previous
                </Button>
                <Button 
                  className="bg-[#8B1E3F] hover:bg-[#a82b4f] text-white px-8"
                  onClick={handleGenerateStory}
                  disabled={storyGenerationMutation.isPending || (!isPremium && (creditsWarningShown || !hasCredits))}
                >
                  {storyGenerationMutation.isPending 
                    ? "Generating..." 
                    : (isPremium || hasCredits) 
                      ? "Generate Story (1 Credit)" 
                      : "No Credits Available"}
                </Button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showUpgradeAlert && (
        <div className="mb-8 bg-gradient-to-r from-[#8B1E3F] to-[#3D315B] p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-300 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h3 className="text-white font-bold">Story Limit Reached</h3>
                <p className="text-gray-200">Free users can create only 3 stories. Upgrade to premium for unlimited stories!</p>
              </div>
            </div>
            <Button 
              className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
              onClick={() => navigate('/premium')}
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      )}
      
      <section className="mb-16">
        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] rounded-2xl p-8">
          <h2 className="text-2xl font-['Playfair_Display'] font-semibold mb-6">Create Your Perfect Story</h2>
          <p className="text-gray-300 mb-8">Customize every aspect of your narrative for a truly personalized experience.</p>
          
          {/* Story Title Input */}
          <div className="mb-6">
            <label htmlFor="story-title" className="block text-lg font-medium text-white mb-2">Story Title <span className="text-red-500">*</span></label>
            <Input
              id="story-title"
              type="text"
              placeholder="Enter your story title"
              value={storyTitle}
              onChange={(e) => {
                setStoryTitle(e.target.value);
                if (e.target.value.trim()) {
                  setTitleError("");
                }
              }}
              className={`w-full bg-[#121212] border ${titleError ? 'border-red-500' : 'border-gray-700'} text-white focus:ring-[#D9B08C] py-3 h-auto text-lg`}
            />
            {titleError && <p className="mt-1 text-sm text-red-500">{titleError}</p>}
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label htmlFor="category" className="block text-lg font-medium text-white mb-2">Category</label>
            <Select
              value={category}
              onValueChange={setCategory}
            >
              <SelectTrigger id="category" className="w-full bg-[#121212] border border-gray-700 text-white py-3 h-auto text-lg">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-gray-700">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center">
                      <span className="mr-2">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Public/Private Toggle (Premium users only) */}
          {isPremium && (
            <div className="mb-8 p-4 bg-[#121212] border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="public-toggle" 
                    checked={isPublic} 
                    onCheckedChange={setIsPublic} 
                  />
                  <Label htmlFor="public-toggle" className="text-white">
                    Make story public
                  </Label>
                </div>
                <div className="text-xs text-gray-400">
                  {isPublic ? "Your story will be visible in the Community section" : "Only you can view this story"}
                </div>
              </div>
            </div>
          )}

          {/* Tabbed Interface */}
          <div className="rounded-xl overflow-hidden shadow-md">
            {/* Tab Headers */}
            <div className="flex ">
              <button
                className={`flex-1 py-3 font-medium ${activeTab === "setting" ? "border-b-2 border-[#8B1E3F] text-[#8B1E3F]" : "text-white"}`}
                onClick={() => setActiveTab("setting")}
              >
                Setting
              </button>
              <button
                className={`flex-1 py-3 font-medium ${activeTab === "characters" ? "border-b-2 border-[#8B1E3F] text-[#8B1E3F]" : "text-white"}`}
                onClick={() => setActiveTab("characters")}
              >
                Characters
              </button>
              <button
                className={`flex-1 py-3 font-medium ${activeTab === "style" ? "border-b-2 border-[#8B1E3F] text-[#8B1E3F]" : "text-white"}`}
                onClick={() => setActiveTab("style")}
              >
                Style
              </button>
              <button
                className={`flex-1 py-3 font-medium ${activeTab === "voice" ? "border-b-2 border-[#8B1E3F] text-[#8B1E3F]" : "text-white"}`}
                onClick={() => setActiveTab("voice")}
              >
                Voice
              </button>
            </div>
            {renderTabContent()}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreateStory;