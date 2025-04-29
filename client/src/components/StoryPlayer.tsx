import React, { useState, useEffect, useRef } from 'react';
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { PlayCircle, PauseCircle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { StoryWithAudio } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface StoryPlayerProps {
  story: StoryWithAudio;
  onAudioGenerated?: (audioUrl: string) => void;
}

const StoryPlayer = ({ story, onAudioGenerated }: StoryPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(story.audioUrl || null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // If the story already has an audio URL, use it
    if (story.audioUrl) {
      setAudioUrl(story.audioUrl);
    }
  }, [story]);
  
  useEffect(() => {
    // Initialize audio element
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        
        // Add event listeners
        audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.addEventListener('ended', handleEnded);
        
        // Set initial volume
        audioRef.current.volume = volume / 100;
      } else {
        // Update source if URL changed
        audioRef.current.src = audioUrl;
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioUrl]);
  
  // Handle audio events
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };
  
  // Audio control functions
  const togglePlay = () => {
    if (!audioUrl) {
      generateAudio();
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
    
    // Unmute if volume is changed manually
    if (isMuted && value[0] > 0) {
      setIsMuted(false);
    }
    
    // Mute if volume is set to 0
    if (value[0] === 0) {
      setIsMuted(true);
    }
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
      } else {
        audioRef.current.volume = 0;
      }
      setIsMuted(!isMuted);
    }
  };
  
  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  // Generate audio for the story
  const generateAudio = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Extract voice ID from story settings
      // Use the stored voice ID if available, otherwise map from the voice name
      const voiceId = story.settings?.narrationVoiceId || story.narrationVoice;
      
      const response = await apiRequest("POST", "/api/speech/generate", {
        text: story.content,
        voiceId: voiceId,
        storyId: story._id
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        
        // Call the callback if provided
        if (onAudioGenerated) {
          onAudioGenerated(data.audioUrl);
        }
        
        // Automatically play after generation
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 500);
      } else {
        throw new Error(data.message || "Failed to generate audio");
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      toast({
        title: "Audio Generation Failed",
        description: "Could not generate audio narration. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format time (seconds) to mm:ss
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="bg-[#121212] border border-gray-700 rounded-lg p-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-medium truncate">
            {story.title} - Audio Narration
          </h3>
          <p className="text-gray-400 text-sm">{formatTime(currentTime)} / {formatTime(duration || 0)}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 rounded-full"
            onClick={() => skip(-10)}
          >
            <SkipBack className="h-4 w-4 text-gray-400" />
          </Button>
          
          <Button 
            size="icon" 
            className="h-10 w-10 rounded-full bg-[#8B1E3F] hover:bg-[#a82b4f]"
            onClick={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-pulse">...</span>
            ) : isPlaying ? (
              <PauseCircle className="h-5 w-5 text-white" />
            ) : (
              <PlayCircle className="h-5 w-5 text-white" />
            )}
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 rounded-full"
            onClick={() => skip(10)}
          >
            <SkipForward className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          disabled={!audioUrl || isLoading}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 rounded-full"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-gray-400" />
          ) : (
            <Volume2 className="h-4 w-4 text-gray-400" />
          )}
        </Button>
        
        <div className="w-24">
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex-1 flex justify-end">
          {!audioUrl && !isLoading && (
            <Button 
              size="sm" 
              className="bg-[#8B1E3F] hover:bg-[#a82b4f] text-white"
              onClick={generateAudio}
            >
              Generate Narration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryPlayer; 