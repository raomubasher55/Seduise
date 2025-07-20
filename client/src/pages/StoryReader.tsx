import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import AudioPlayer from "@/components/AudioPlayer";
import { Sparkles, Heart, Share2, ChevronLeft, ChevronRight, BookOpen, ThumbsUp, ThumbsDown } from "lucide-react";
import { continueStory, makeChoice } from "@/lib/ai";
import { generateSpeech } from "@/lib/audio";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { formatTime } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Chapter } from "@shared/schema";

interface StoryReaderProps {
  params: {
    id: string;
  };
}

const StoryReader = ({ params }: StoryReaderProps) => {
  const [, navigate] = useLocation();
  const storyId = params.id;
  const [hasAudio, setHasAudio] = useState(false);
  const [currentChapterNum, setCurrentChapterNum] = useState(1);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans");
  const [readingMode, setReadingMode] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/like`);
      if (!response.ok) {
        throw new Error("Failed to like story");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      toast({
        title: "Story Liked",
        description: "You've successfully liked this story!",
      });
    },
    onError: (error) => {
      console.error("Error liking story:", error);
      toast({
        title: "Error",
        description: "Failed to like story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (storyId) {
      likeMutation.mutate(storyId);
    }
  };

  const upvoteMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/upvote`);
      if (!response.ok) {
        throw new Error("Failed to upvote story");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      toast({
        title: "Story Upvoted",
        description: "You've successfully upvoted this story!",
      });
    },
    onError: (error) => {
      console.error("Error upvoting story:", error);
      toast({
        title: "Error",
        description: "Failed to upvote story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpvote = () => {
    if (storyId) {
      upvoteMutation.mutate(storyId);
    }
  };

  const downvoteMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/downvote`);
      if (!response.ok) {
        throw new Error("Failed to downvote story");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      toast({
        title: "Story Downvoted",
        description: "You've successfully downvoted this story!",
      });
    },
    onError: (error) => {
      console.error("Error downvoting story:", error);
      toast({
        title: "Error",
        description: "Failed to downvote story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDownvote = () => {
    if (storyId) {
      downvoteMutation.mutate(storyId);
    }
  };

  // Fetch story data
  const { data: story, isLoading, error } = useQuery({
    queryKey: [`/api/stories/${storyId}`],
  });

  // Fetch choices for the current chapter
  const { data: choicesData, isLoading: isLoadingChoices } = useQuery({
    queryKey: [`/api/stories/${storyId}/chapters/${currentChapterNum}/choices`],
    enabled: !!story && !!currentChapterNum, // Only fetch if story and currentChapterNum are available
  });

  // Fetch chapters data
  const { data: chaptersData, isLoading: isLoadingChapters } = useQuery({
    queryKey: [`/api/stories/${storyId}/chapters`],
    enabled: !!story,
  });

  // Update chapters when data loads
  useEffect(() => {
    if (chaptersData?.chapters) {
      setChapters(chaptersData.chapters);
      if (story?.currentChapter) {
        setCurrentChapterNum(story.currentChapter);
      }
    }
  }, [chaptersData, story]);

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
    const currentChapter = chapters.find(ch => ch.number === currentChapterNum);
    if (currentChapter && currentChapter.audioUrl) {
      setHasAudio(true);
    }
    // Check if the story has an audio URL directly in the story object
    else if (story && story.audioUrl) {
      setHasAudio(true);
    }
    // Check audio data from the API
    else if (audioData && audioData.audioUrl) {
      setHasAudio(true);
    } else {
      setHasAudio(false);
    }
  }, [audioData, story, chapters, currentChapterNum]);

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
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/chapters`] });
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

  const makeChoiceMutation = useMutation({
    mutationFn: ({ storyId, chapterNumber, selectedChoice }: { storyId: string; chapterNumber: number; selectedChoice: string }) => makeChoice(storyId, chapterNumber, selectedChoice),
    onSuccess: (data) => {
      toast({
        title: "Choice Made",
        description: "Your story continues based on your decision.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/chapters`] });
    },
    onError: (error: any) => {
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
          description: "Failed to make choice. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleGenerateAudio = () => {
    if (!story) return;

    const currentChapter = chapters.find(ch => ch.number === currentChapterNum);
    if (!currentChapter) return;

    // Get the narration voice from settings
    const narrationVoice = (story.settings as any).narrationVoice || 'Soft Female';

    // Map the narration voice to correct ElevenLabs IDs for male voices
    let voiceId = narrationVoice;
    if (narrationVoice === 'Deep Male') {
      voiceId = 'VR6AewLTigWG4xSOukaG'; // Adam's voice ID
    } else if (narrationVoice === 'Authoritative Male') {
      voiceId = 'TxGEqnHWrfWFTfGW9XjX'; // Josh's voice ID  
    }

    console.log(`Using voice: ${narrationVoice}, mapped to ElevenLabs ID: ${voiceId}`);

    generateSpeechMutation.mutate({
      text: currentChapter.content,
      voiceId: voiceId,
      storyId: storyId
    });
  };

  console.log(`Story is ${story} `);

  const handleContinueStory = () => {
    // If there are choices for the current chapter, don't show the credit dialog directly
    // Instead, the choices themselves will trigger the next action
    if (currentChapter?.choices && currentChapter.choices.length > 0) {
      // This case should ideally not be reached if the UI correctly hides the button
      // when choices are present. But as a fallback, do nothing or log a warning.
      console.warn("Continue Story button clicked when choices are available.");
      return;
    }
    setShowCreditDialog(true);
  };

  const handleMakeChoice = (selectedChoice: string) => {
    if (!storyId || !currentChapterNum) return;
    makeChoiceMutation.mutate({ storyId, chapterNumber: currentChapterNum, selectedChoice });
  };

  const navigateToChapter = (chapterNumber: number) => {
    if (chapterNumber >= 1 && chapterNumber <= chapters.length) {
      setCurrentChapterNum(chapterNumber);
    }
  };

  const currentChapter = chapters.find(ch => ch.number === currentChapterNum);
  const canGoNext = currentChapterNum < chapters.length;
  const canGoPrevious = currentChapterNum > 1;
  const progress = chapters.length > 0 ? (currentChapterNum / chapters.length) * 100 : 0;

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
  console.log('image', story.imageUrl)

  return (
    <div className={`w-full px-4 py-8 ${readingMode ? 'reading-mode' : ''}`}>
      <section className="mb-16">
        <div className={`${readingMode ? 'reading-mode-content' : 'bg-[#1E1E1E] rounded-2xl p-8'}`}>
          <div className="flex flex-col md:flex-row gap-8">
            {!readingMode && (
              <div className="md:w-1/3 flex flex-col">
                <Card className="bg-[#2D2D2D] rounded-xl overflow-hidden mb-6 border-0">
                  {/* <img 
                  src={story.imageUrl || "https://images.unsplash.com/photo-1575299899528-a-a3dbcf8e5e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"} 
                  alt="Story cover" 
                  className="w-full h-48 object-cover"
                /> */}
                  <div className="p-5">
                    <h3 className="font-['Playfair_Display'] text-xl font-semibold mb-1">{story.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {currentChapter ? currentChapter.content.substring(0, 100) : story.content?.substring(0, 100)}...
                    </p>
                    {chapters.length > 1 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">Chapter {currentChapterNum} of {chapters.length}</span>
                          <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-[#574873] flex items-center justify-center text-xs">
                          {/* {story.userId ? "U" + story.userId : "SG"} */}
                        </div>
                        {/* <span className="ml-2 text-xs text-gray-400">by Author</span> */}
                      </div>
                      <div className="flex items-center space-x-3">
                        <button onClick={handleLike} disabled={likeMutation.isPending}>
                          <Heart size={16} fill={story?.likes > 0 ? "#A93B5B" : "none"} className="text-[#A93B5B]" />
                        </button>
                        <span className="text-xs text-gray-400">{story?.likes || 0}</span>
                        <button onClick={handleUpvote} disabled={upvoteMutation.isPending}>
                          <ThumbsUp size={16} fill={story?.upvotes > 0 ? "#60A5FA" : "none"} className="text-blue-400" />
                        </button>
                        <span className="text-xs text-gray-400">{story?.upvotes || 0}</span>
                        <button onClick={handleDownvote} disabled={downvoteMutation.isPending}>
                          <ThumbsDown size={16} fill={story?.downvotes > 0 ? "#F87171" : "none"} className="text-red-400" />
                        </button>
                        <span className="text-xs text-gray-400">{story?.downvotes || 0}</span>
                        <button className="text-gray-400 hover:text-[#D9B08C]">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
                {chapters.length > 1 && (
                  <Card className="bg-[#2D2D2D] rounded-xl p-5 border-0 mt-4">
                    <h4 className="font-['Playfair_Display'] text-lg mb-4">Chapter Navigation</h4>
                    <Select value={currentChapterNum.toString()} onValueChange={(value) => navigateToChapter(parseInt(value))}>
                      <SelectTrigger className="bg-[#121212] border-gray-700">
                        <SelectValue placeholder="Select chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem key={chapter.number} value={chapter.number.toString()}>
                            Chapter {chapter.number}: {chapter.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Card>
                )}
              </div>
            )}

            <div className="md:w-2/3 bg-[#2D2D2D] rounded-xl p-6">
              {/* Chapter Header */}
              {currentChapter && chapters.length > 1 && (
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToChapter(currentChapterNum - 1)}
                      disabled={!canGoPrevious}
                      className="bg-[#121212] border-gray-700"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <div className="text-center">
                      <h3 className="font-['Playfair_Display'] text-lg">{currentChapter.title} </h3>
                      <p className="text-sm text-gray-400">Chapter {currentChapterNum} of {chapters.length}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToChapter(currentChapterNum + 1)}
                      disabled={!canGoNext}
                      className="bg-[#121212] border-gray-700"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Reading Experience Controls */}
              <div className="mb-4 flex items-center md:justify-between md:flex-row flex-col border-y border-gray-700 py-2 gap-2">
                <div className="flex md:items-center md:flex-row flex-col md:gap-4 gap-2">
                  <Select value={fontFamily} onValueChange={(value) => setFontFamily(value as any)}>
                    <SelectTrigger className="w-[120px] bg-[#121212] border-gray-600 h-8">
                      <SelectValue placeholder="Font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={fontSize} onValueChange={(value) => setFontSize(value as any)}>
                    <SelectTrigger className="w-[120px] bg-[#121212] border-gray-600 h-8">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReadingMode(!readingMode)}
                  className="bg-[#121212] border-gray-600 h-8"
                >
                  <BookOpen size={16} className="mr-2" />
                  {readingMode ? "Exit Reading Mode" : "Reading Mode"}
                </Button>
              </div>

              {hasAudio ? (
                <AudioPlayer
                  audioUrl={(currentChapter?.audioUrl) || story.audioUrl || audioData?.audioUrl || null}
                  title={currentChapter ? currentChapter.title : story.title}
                  narrator={settings.narrationVoice || settings.narrationVoiceId || "Narrator"}
                  isFallback={audioData?.fallback || false}
                  fallbackMessage={audioData?.message}
                />
              ) : (
                <div className="mb-6 bg-[#121212] p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-['Playfair_Display'] text-lg">
                        {currentChapter ? currentChapter.title : story.title}
                      </h4>
                      <p className="text-sm text-gray-400">Generate audio to listen to this chapter</p>
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

              <div
                className={`story-text-content font-${fontFamily} text-${fontSize}`}>
                <h2 className="text-2xl font-['Playfair_Display'] font-semibold mb-4">
                  {currentChapter ? currentChapter.title : story.title}
                </h2>
                {(currentChapter ? currentChapter.content : story.content || '').split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center sm:items-start space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="bg-[#121212] text-gray-400 hover:text-white border-gray-700 w-full sm:w-auto"
                    onClick={() => navigate("/discover")}
                  >
                    Back to Stories
                  </Button>
                  {chapters.length > 1 && canGoPrevious && (
                    <Button
                      variant="outline"
                      className="bg-[#121212] text-gray-400 hover:text-white border-gray-700 w-full sm:w-auto"
                      onClick={() => navigateToChapter(currentChapterNum - 1)}
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Previous Chapter
                    </Button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  {currentChapter?.choices && currentChapter.choices.length > 0 ? (
                    currentChapter.choices.map((choice, index) => (
                      <Button
                        key={index}
                        className="bg-[#8B1E3F] hover:bg-[#A93B5B] transition-colors px-4 py-2 rounded-lg text-white flex items-center justify-center w-full sm:w-auto"
                        onClick={() => handleMakeChoice(choice.text)}
                        disabled={makeChoiceMutation.isPending}
                      >
                        {makeChoiceMutation.isPending ? "Processing..." : choice.text}
                      </Button>
                    ))
                  ) : (
                    <>
                      {chapters.length > 1 && canGoNext && (
                        <Button
                          variant="outline"
                          className="bg-[#121212] text-gray-400 hover:text-white border-gray-700 w-full sm:w-auto"
                          onClick={() => navigateToChapter(currentChapterNum + 1)}
                        >
                          Next Chapter
                          <ChevronRight size={16} className="ml-1" />
                        </Button>
                      )}
                      <Button
                        className="bg-[#8B1E3F] hover:bg-[#A93B5B] transition-colors px-4 py-2 rounded-lg text-white flex items-center justify-center w-full sm:w-auto"
                        onClick={handleContinueStory}
                        disabled={continueStoryMutation.isPending}
                      >
                        <Sparkles className="mr-2" size={16} />
                        {continueStoryMutation.isPending ? "Continuing..." : "Continue Story"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credit Confirmation Dialog */}
      <AlertDialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <AlertDialogContent className="bg-[#1E1E1E] border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Continue Story</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Continuing this story will cost 1 credit. You will get a new chapter added to your story.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2D2D2D] border-gray-700 text-gray-400 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#8B1E3F] hover:bg-[#A93B5B] text-white"
              onClick={() => continueStoryMutation.mutate(storyId)}
            >
              Continue Story (1 Credit)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default StoryReader;
