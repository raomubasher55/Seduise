import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { VoiceSelector } from "../components/VoiceSelector";
import { PremiumUpgradeDialog } from "../components/PremiumUpgradeDialog";
import { MINIMAX_VOICE_OPTIONS } from "@/constants/minimaxVoices";

const TIME_PERIODS = ["Contemporary", "Medieval", "Victorian", "Future", "Fantasy Realm"];
const LOCATIONS = ["Urban City", "Beach Resort", "Mountain Retreat", "Luxury Estate", "Exotic Island"];
const ATMOSPHERES = ["Romantic", "Mysterious", "Passionate", "Playful", "Intense"];
const RELATIONSHIPS = ["Strangers", "Dating", "Married", "Friends", "Colleagues"];
const WRITING_TONES = ["Romantic", "Sensual", "Intense", "Playful", "Explicit"];
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
  const [accessType, setAccessType] = useState<string>("public");
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
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"setting" | "characters" | "style" | "voice">("setting");
  const [explicitLevel, setExplicitLevel] = useState(50);
  const [creditsWarningShown, setCreditsWarningShown] = useState(false);

  const voiceOptions = MINIMAX_VOICE_OPTIONS;
  const voiceNameMap = useMemo(
    () => new Map(voiceOptions.map((voice) => [voice.id, voice.name])),
    [voiceOptions],
  );

  const updateSetting = useCallback((key: keyof StorySettings, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  useEffect(() => {
    if (!settings.narrationVoiceId && voiceOptions.length > 0) {
      const defaultVoice = voiceOptions[0];
      updateSetting("narrationVoiceId", defaultVoice.id);
      updateSetting("narrationVoice", defaultVoice.name);
    }
  }, [settings.narrationVoiceId, updateSetting, voiceOptions]);

  // For additional inputs in the Setting tab
  const [settingDescription, setSettingDescription] = useState<string>("");

  // For additional inputs in the Characters tab
  const [protagonistDescription, setProtagonistDescription] = useState<string>("");
  const [loveInterestDescription, setLoveInterestDescription] = useState<string>("");

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
      // Check if this is a credit-related error by examining the error message
      const errorMessage = error.message || "";
      if (errorMessage.includes("Insufficient text credits") || 
          errorMessage.includes("Insufficient credits") ||
          errorMessage.includes("You need") && errorMessage.includes("credits")) {
        setShowPremiumDialog(true);
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
      setShowPremiumDialog(true);
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
      maxTokens: settings.length === 2 ? 1200 : settings.length === 3 ? 2400 : 4800, // Match server-side token calculation
      isPublic: accessType === 'public',
      accessType: accessType,
      category: category
    });
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

            <div className="w-full max-w-xs md:max-w-full mx-auto">
  <h3 className="text-lg font-medium text-white mb-3">Story Length</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
    <div
      onClick={() => handleStoryLengthSelect(2)}
      className={`w-full relative py-3 px-4 rounded cursor-pointer ${settings.length === 2 ? "bg-[#8B1E3F]" : "bg-[#121212]"}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm">2-3 min audio</div>
          <div className="text-xs text-amber-300">1 credit</div>
        </div>
        <div className="text-sm">Short</div>
      </div>
    </div>

    <div
      onClick={() => handleStoryLengthSelect(3)}
      className={`w-full relative py-3 px-4 rounded cursor-pointer ${settings.length === 3 ? "bg-[#8B1E3F]" : "bg-[#121212]"}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm">4-5 min audio</div>
          <div className="text-xs text-amber-300">2 credits</div>
        </div>
        <div className="text-sm">Medium</div>
      </div>
    </div>

    <div
      onClick={() => handleStoryLengthSelect(4)}
      className={`w-full relative py-3 px-4 rounded cursor-pointer ${settings.length === 4 ? "bg-[#8B1E3F]" : "bg-[#121212]"}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm">8-10 min audio</div>
          <div className="text-xs text-amber-300">4 credits</div>
        </div>
        <div className="text-sm">Long</div>
      </div>
    </div>
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
                  voices={voiceOptions}
                  selectedVoice={settings.narrationVoiceId}
                  onVoiceSelect={(voiceId: string) => {
                    updateSetting("narrationVoiceId", voiceId);
                    const name = voiceNameMap.get(voiceId) || "MiniMax Voice";
                    updateSetting("narrationVoice", name);
                    console.log(`Selected voice: ${name} (${voiceId})`);
                  }}
                />
              </div>


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
                      ? `Generate Story (${settings.length === 2 ? '1' : settings.length === 3 ? '2' : '4'} Credits)`
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

          {/* Story Access Type */}
          <div className="mb-8 p-4 bg-[#121212] border border-gray-700 rounded-lg">
            <label className="block text-lg font-medium text-white mb-3">Story Access</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Public Option */}
              <div
                onClick={() => setAccessType('public')}
                className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                  accessType === 'public' 
                    ? 'border-[#8B1E3F] bg-[#8B1E3F]/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">Public</h4>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">FREE</span>
                </div>
                <p className="text-sm text-gray-400">Visible to everyone in community</p>
              </div>

              {/* Private Option */}
              <div
                onClick={() => setAccessType('private')}
                className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                  accessType === 'private' 
                    ? 'border-[#8B1E3F] bg-[#8B1E3F]/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">Private</h4>
                  <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">FREE</span>
                </div>
                <p className="text-sm text-gray-400">Only visible to you</p>
              </div>

              {/* Premium Early Access Option - For all premium users */}
              {(user?.subscription === 'essentiel' || user?.subscription === 'seduction' || user?.subscription === 'intimacy') && (
                <div
                  onClick={() => setAccessType('premium_early_access')}
                  className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                    accessType === 'premium_early_access' 
                      ? 'border-[#D9B08C] bg-[#D9B08C]/10' 
                      : 'border-[#D9B08C]/50 hover:border-[#D9B08C]/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Premium</h4>
                    <span className="text-xs bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] text-white px-2 py-1 rounded">
                      PREMIUM
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Available in premium gallery</p>
                </div>
              )}

              {/* Premium Exclusive Option - Only for Seduction/Intimacy users */}
              {(user?.subscription === 'seduction' || user?.subscription === 'intimacy') && (
                <div
                  onClick={() => setAccessType('premium_exclusive')}
                  className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                    accessType === 'premium_exclusive' 
                      ? 'border-[#8B1E3F] bg-[#8B1E3F]/10' 
                      : 'border-[#8B1E3F]/50 hover:border-[#8B1E3F]/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Exclusive</h4>
                    <span className="text-xs bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] text-white px-2 py-1 rounded">
                      EXCLUSIVE
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Only for top-tier subscribers</p>
                </div>
              )}
            </div>
            
            {/* Info text based on selected access type */}
            <div className="mt-3 text-sm text-gray-400">
              {accessType === 'public' && "Your story will appear in the public community section for all users to enjoy."}
              {accessType === 'private' && "Your story will only be visible to you in your personal dashboard."}
              {accessType === 'premium_early_access' && "Your story will appear in the premium gallery for all premium subscribers."}
              {accessType === 'premium_exclusive' && "Your story will only appear in the premium gallery for Seduction and Intimacy subscribers."}
            </div>
            
            {/* Upgrade prompt for non-premium users who try to select premium early access */}
            {accessType === 'premium_early_access' && !['essentiel', 'seduction', 'intimacy'].includes(user?.subscription || '') && (
              <div className="mt-3 p-3 bg-[#D9B08C]/10 border border-[#D9B08C]/30 rounded-lg">
                <p className="text-sm text-[#F0E6DC]">
                  Premium story creation requires a premium subscription.
                </p>
                <Button 
                  size="sm" 
                  className="mt-2 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] hover:from-[#8B1E3F] hover:to-[#D9B08C]"
                  onClick={() => navigate('/premium-upgrade')}
                >
                  Upgrade to Premium
                </Button>
              </div>
            )}

            {/* Upgrade prompt for non-exclusive users who try to select premium exclusive */}
            {accessType === 'premium_exclusive' && !['seduction', 'intimacy'].includes(user?.subscription || '') && (
              <div className="mt-3 p-3 bg-[#8B1E3F]/10 border border-[#8B1E3F]/30 rounded-lg">
                <p className="text-sm text-[#F0E6DC]">
                  Exclusive story creation is available for Seduction and Intimacy subscribers only.
                </p>
                <Button 
                  size="sm" 
                  className="mt-2 bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] hover:from-[#D9B08C] hover:to-[#8B1E3F]"
                  onClick={() => navigate('/premium-upgrade')}
                >
                  Upgrade to Seduction/Intimacy
                </Button>
              </div>
            )}
          </div>

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

      {/* Premium Upgrade Dialog */}
      <PremiumUpgradeDialog
        isOpen={showPremiumDialog}
        onClose={() => setShowPremiumDialog(false)}
        trigger="insufficient_credits"
        currentCredits={{
          text: user?.textCredits || 0,
          audio: user?.audioCredits || 0
        }}
      />
    </div>
  );
};

export default CreateStory;
