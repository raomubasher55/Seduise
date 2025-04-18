import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import AudioPlayer from "@/components/AudioPlayer";
import { Sparkles, Heart, Share2 } from "lucide-react";
import { continueStory } from "@/lib/ai";
import { generateSpeech } from "@/lib/audio";
import { queryClient } from "@/lib/queryClient";
import { formatTime } from "@/lib/utils";

interface StoryReaderProps {
  params: {
    id: string;
  };
}

const StoryReader = ({ params }: StoryReaderProps) => {
  const [, navigate] = useLocation();
  const storyId = params.id;
  // console.log(`The received storyId is ${storyId}`);
  const [hasAudio, setHasAudio] = useState(false);
  // const [duration , setDuration  ] = useState(0)

  // Fetch story data
  const { data: story, isLoading, error } = useQuery({
    queryKey: [`/api/stories/${storyId}`],
  });

  // Fetch audio URL if available
  const { 
    data: audioData, 
    isLoading: isLoadingAudio, 
    error: audioError 
  } = useQuery({
    // queryKey: [`/api/speech/${storyId}`],
    queryKey: [`/api/stories/${storyId}/audio`],
    enabled: !!story,
    retry: 1,
    onError: (err) => {
      console.error("Error fetching audio:", err);
    }
  });

  // console.log(`The audioData is ${audioData}`);

  // Update hasAudio state when audioData changes
  useEffect(() => {
    // console.log("Audio data changed:", audioData);
    if (audioData && audioData.audioUrl) {
      // console.log("Setting hasAudio to true. Audio URL:", audioData.audioUrl);
      // setDuration(audioData.duration);
      // console.log("Duration is :" , audioData);
      setHasAudio(true);
      // window.location.reload();
    } else if (audioData === null || audioData === undefined || !audioData.audioUrl) {
      // console.log("No valid audio data found, setting hasAudio to false");
      setHasAudio(false);
    }
  }, [audioData]);

  // Generate speech mutation
  const generateSpeechMutation = useMutation({
    mutationFn: generateSpeech,
    onSuccess: (data) => {
      // console.log("Speech generated successfully:", data);
      toast({
        title: "Audio Generated",
        description: "Your story narration is ready to play.",
      });
      
      // Set hasAudio based on the response data
      if (data && data.audioUrl) {
        setHasAudio(true);
        
        // Invalidate queries to refresh the audio data
        queryClient.invalidateQueries({ queryKey: [`/api/speech/${storyId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/audio`] });
        
        // Update the story to include the latest audio URL
        if (story) {
          story.audioUrl = data.audioUrl;
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate audio. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Continue story mutation
  const continueStoryMutation = useMutation({
    mutationFn: continueStory,
    onSuccess: (data) => {
      toast({
        title: "Story Continued",
        description: "Your story has been extended.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
    },
    onError: (error: any) => {
      // Check if this is insufficient credits error
      if (error.response?.data?.code === "INSUFFICIENT_CREDITS") {
        toast({
          title: "Insufficient Credits",
          description: (
            <div className="flex flex-col space-y-2">
              <p>You don't have enough credits to continue this story.</p>
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
          description: "Failed to continue story. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleGenerateAudio = () => {
    if (!story) return;
    // console.log("story is ", story);
    generateSpeechMutation.mutate({
      text: story.content ,
      voiceId: (story.settings as any).narrationVoice,
      storyId: storyId
    });
  };

  console.log(`Story is ${story} `);

  const handleContinueStory = () => {
    continueStoryMutation.mutate(storyId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9B08C]"></div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-[#1E1E1E] p-6 max-w-xl mx-auto">
          <h2 className="text-xl font-['Playfair_Display'] mb-4">Story Not Found</h2>
          <p className="text-gray-400 mb-6">Sorry, we couldn't find the story you're looking for.</p>
          <Button asChild>
            <Link href="/discover">Explore Stories</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const settings = story.settings || {};

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-16">
        <div className="bg-[#1E1E1E] rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 flex flex-col">
              <Card className="bg-[#2D2D2D] rounded-xl overflow-hidden mb-6 border-0">
                <img 
                  src={story.imageUrl || "https://images.unsplash.com/photo-1575299899528-a8a3dbcf8e5e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"} 
                  alt="Story cover" 
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <h3 className="font-['Playfair_Display'] text-xl font-semibold mb-1">{story.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{story.content.substring(0, 100)}...</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-[#574873] flex items-center justify-center text-xs">
                        {story.userId ? "U" + story.userId : "SG"}
                      </div>
                      <span className="ml-2 text-xs text-gray-400">by Author</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-gray-400 hover:text-[#D9B08C]">
                        <Heart size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-[#D9B08C]">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-[#2D2D2D] rounded-xl p-5 border-0">
                <h4 className="font-['Playfair_Display'] text-lg mb-4">Story Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Setting</span>
                    <span className="text-white">{settings.location}, {settings.timePeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Characters</span>
                    <span className="text-white">{settings.protagonistGender} & {settings.partnerGender}, {settings.relationship}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Style</span>
                    <span className="text-white">{settings.writingTone}, {settings.atmosphere}</span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="text-gray-400">Length</span>
                    
                    <span className="text-white">{Math.floor((story.content.length / 25) / 60)} minutes</span>
                    
                  </div> */}
                </div>
              </Card>
            </div>

            <div className="md:w-2/3 bg-[#2D2D2D] rounded-xl p-6">
              {hasAudio ? (
                <AudioPlayer 
                  audioUrl={audioData?.audioUrl || null}
                  title={story.title}
                  narrator={settings.narrationVoice}
                  isFallback={audioData?.fallback || false}
                  fallbackMessage={audioData?.message}
                />
              ) : (
                <div className="mb-6 bg-[#121212] p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-['Playfair_Display'] text-lg">{story.title}</h4>
                      <p className="text-sm text-gray-400">Generate audio to listen to this story</p>
                    </div>
                    <Button 
                      onClick={handleGenerateAudio}
                      disabled={generateSpeechMutation.isPending}
                      className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
                    >
                      {generateSpeechMutation.isPending ? "Generating..." : "Generate Audio"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-y-auto h-80 pr-4 story-text">
                <h2 className="text-2xl font-['Playfair_Display'] font-semibold mb-4">{story.title}</h2>
                {story.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="bg-[#121212] text-gray-400 hover:text-white border-gray-700"
                    onClick={() => navigate("/discover")}
                  >
                    Back to Stories
                  </Button>
                </div>
                <div>
                  <Button 
                    className="bg-[#8B1E3F] hover:bg-[#A93B5B] transition-colors px-4 py-2 rounded-lg text-white flex items-center"
                    onClick={handleContinueStory}
                    disabled={continueStoryMutation.isPending}
                  >
                    <Sparkles className="mr-2" size={16} />
                    {continueStoryMutation.isPending ? "Continuing..." : "Continue Story"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StoryReader;
