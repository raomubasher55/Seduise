import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import AudioPlayer from "@/components/AudioPlayer";
import { Sparkles, Heart, Share2, ChevronLeft, ChevronRight, BookOpen, ThumbsUp, ThumbsDown, Lock } from "lucide-react";
import { continueStory, makeChoice } from "@/lib/ai";
import { generateSpeech } from "@/lib/audio";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { formatTime } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Chapter } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

interface StoryReaderProps {
  params: {
    id: string;
  };
}

const StoryReader = ({ params }: StoryReaderProps) => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const storyId = params.id;
  const [hasAudio, setHasAudio] = useState(false);
  const [currentChapterNum, setCurrentChapterNum] = useState(1);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showConcludeDialog, setShowConcludeDialog] = useState(false);
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

  const handleLike = useCallback(() => {
    if (storyId) {
      likeMutation.mutate(storyId);
    }
  }, [storyId, likeMutation]);


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

  const handleUpvote = useCallback(() => {
    if (storyId) {
      upvoteMutation.mutate(storyId);
    }
  }, [storyId, upvoteMutation]);

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

  const handleDownvote = useCallback(() => {
    if (storyId) {
      downvoteMutation.mutate(storyId);
    }
  }, [storyId, downvoteMutation]);


  // Fetch story data
  const { data: story, isLoading, error } = useQuery({
    queryKey: [`/api/stories/${storyId}`],
  });

  // Fetch choices for the current chapter
  const { data: choicesData, isLoading: isLoadingChoices } = useQuery({
    queryKey: [`/api/stories/${storyId}/chapters/${currentChapterNum}/choices`],
    enabled: !!story && !!currentChapterNum,
  });

  // Fetch chapters data
  const { data: chaptersData, isLoading: isLoadingChapters } = useQuery({
    queryKey: [`/api/stories/${storyId}/chapters`, story?._id],
    enabled: !!story,
  });

  // Update chapters when data loads - CORRECTED
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
    queryKey: [`/api/stories/${storyId}/audio`],
    enabled: !!story,
    retry: 1,
    onError: (err) => {
      console.error("Error fetching audio:", err);
    }
  });

  // Update hasAudio state when audioData changes
  useEffect(() => {
    const currentChapter = chapters.find(ch => ch.number === currentChapterNum);
    if (currentChapter && currentChapter.audioUrl) {
      setHasAudio(true);
    }
    else if (story && story.audioUrl) {
      setHasAudio(true);
    }
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
      toast({
        title: "Audio Generated",
        description: "Your story narration is ready to play.",
      });
      if (data && data.audioUrl) {
        setHasAudio(true);
        queryClient.invalidateQueries({ queryKey: [`/api/speech/${storyId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/audio`] });
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
    mutationFn: (variables: { storyId: string, conclude?: boolean }) => continueStory(variables.storyId, undefined, variables.conclude),
    onSuccess: (data) => {
      toast({
        title: "Story Continued",
        description: "Your story has been extended.",
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

  const unlockChapterMutation = useMutation({
    mutationFn: async ({ storyId, chapterNumber }: { storyId: string; chapterNumber: number }) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/chapters/${chapterNumber}/unlock`);
      if (!response.ok) {
        throw await response.json(); // Throw the actual error response from server
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Chapter Unlocked",
        description: "You can now read this chapter.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/chapters`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unlock chapter. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAudio = useCallback(() => {
    if (!story) return;

    const currentChapter = chapters.find(ch => ch.number === currentChapterNum);
    if (!currentChapter) return;

    const narrationVoice = (story.settings as any).narrationVoice || 'Soft Female';
    let voiceId = narrationVoice;
    if (narrationVoice === 'Deep Male') {
      voiceId = 'VR6AewLTigWG4xSOukaG';
    } else if (narrationVoice === 'Authoritative Male') {
      voiceId = 'TxGEqnHWrfWFTfGW9XjX';
    }

    generateSpeechMutation.mutate({
      text: currentChapter.content,
      voiceId: voiceId,
      storyId: storyId
    });
  }, [story, chapters, currentChapterNum, storyId, generateSpeechMutation]);


  const currentChapter = chapters.find(ch => ch.number === currentChapterNum);

  const handleContinueStory = useCallback(() => {
    if (currentChapter?.choices && currentChapter.choices.length > 0) {
      console.warn("Continue Story button clicked when choices are available.");
      return;
    }
    setShowCreditDialog(true);
  }, [currentChapter]);

  const handleMakeChoice = useCallback((selectedChoice: string) => {
    if (!storyId || !currentChapterNum) return;
    makeChoiceMutation.mutate({ storyId, chapterNumber: currentChapterNum, selectedChoice });
  }, [storyId, currentChapterNum, makeChoiceMutation]);

  const handleUnlockChapter = useCallback(() => {
    if (!storyId || !currentChapterNum) return;
    unlockChapterMutation.mutate({ storyId, chapterNumber: currentChapterNum });
  }, [storyId, currentChapterNum, unlockChapterMutation]);

  const navigateToChapter = useCallback((chapterNumber: number) => {
    if (chapterNumber >= 1 && chapterNumber <= chapters.length) {
      setCurrentChapterNum(chapterNumber);
    }
  }, [chapters.length]);

  const isChapterUnlocked = (
    currentChapter?.number === 1 ||
    story?.userId === user?._id ||
    user?.unlockedChapters?.some(uc => uc.storyId === storyId && uc.chapterNumber === currentChapterNum)
  );

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

  return (
    <div className={`w-full px-4 py-8 ${readingMode ? 'reading-mode' : ''}`}>
      <section className="mb-16">
        <div className={`${readingMode ? 'reading-mode-content' : 'bg-[#1E1E1E] rounded-2xl p-8'}`}>
          <div className="flex flex-col md:flex-row gap-8">
            {!readingMode && (
              <div className="md:w-1/3 flex flex-col">
                <Card className="bg-[#2D2D2D] rounded-xl overflow-hidden mb-6 border-0">
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
                        </div>
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

              {hasAudio && isChapterUnlocked ? (
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
                      disabled={generateSpeechMutation.isPending || !isChapterUnlocked}
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
                {isChapterUnlocked ? (
                  (currentChapter ? currentChapter.content : story.content || '').split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <div className="text-center p-8 bg-gray-800 rounded-lg">
                    <Lock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-white">Chapter Locked</h3>
                    <p className="mt-1 text-sm text-gray-400">You need to unlock this chapter to read it.</p>
                    <Button
                      onClick={handleUnlockChapter}
                      disabled={unlockChapterMutation.isPending}
                      className="mt-4 bg-[#8B1E3F] hover:bg-[#A93B5B]"
                    >
                      {unlockChapterMutation.isPending ? "Unlocking..." : `Unlock for ${currentChapter?.creditsCost} credit(s)`}
                    </Button>
                  </div>
                )}
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
                      {story?.userId === user?._id && (
                        <>
                          <Button
                            className="bg-[#8B1E3F] hover:bg-[#A93B5B] transition-colors px-4 py-2 rounded-lg text-white flex items-center justify-center w-full sm:w-auto"
                            onClick={handleContinueStory}
                            disabled={continueStoryMutation.isPending}
                          >
                            <Sparkles className="mr-2" size={16} />
                            {continueStoryMutation.isPending ? "Continuing..." : "Continue Story"}
                          </Button>
                          {chapters.length >= 3 && (
                            <Button
                              className="bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg text-white flex items-center justify-center w-full sm:w-auto"
                              onClick={() => setShowConcludeDialog(true)}
                              disabled={continueStoryMutation.isPending}
                            >
                              <BookOpen className="mr-2" size={16} />
                              {continueStoryMutation.isPending ? "Concluding..." : "Conclude Story"}
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              onClick={() => continueStoryMutation.mutate({ storyId: storyId.toString() })}
            >
              Continue Story (1 Credit)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConcludeDialog} onOpenChange={setShowConcludeDialog}>
        <AlertDialogContent className="bg-[#1E1E1E] border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Conclude Story</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will generate a final chapter to conclude the story. This action will cost 1 credit.
              Are you sure you want to end the story?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2D2D2D] border-gray-700 text-gray-400 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => continueStoryMutation.mutate({ storyId, conclude: true })}
            >
              Conclude Story (1 Credit)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default StoryReader;