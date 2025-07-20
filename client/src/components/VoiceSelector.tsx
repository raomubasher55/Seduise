import { useEffect, useState, useRef } from "react";
import { VoiceOption } from "@/types";
import { Volume2, VolumeX, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {apiRequest} from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { string } from "zod";

interface VoiceSelectorProps {
  onVoiceSelect: (voiceId: string) => void;
  selectedVoice?: string;
}

export function VoiceSelector({ onVoiceSelect, selectedVoice }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVoicePreviewPlaying, setIsVoicePreviewPlaying] = useState(false);
  const [currentPlayingVoice, setCurrentPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await apiRequest('GET' , "/api/stories/voice-options");
        console.log("Fetched voice options:", response);
        const data = await response.json();
        setVoices(data);
      } catch (error) {
        console.error("Failed to fetch voices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  // Handle voice preview
  const handleVoicePreview = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsVoicePreviewPlaying(false);
      setCurrentPlayingVoice(null);
    }
    
    try {
      // Sample text for preview
      const sampleText = "This is a preview of how your story narration will sound.";
      
      // Call speech generation endpoint
      const response = await apiRequest("POST", "/api/speech/generate", {
        text: sampleText,
        voiceId: voiceId,
      });
      
      const data = await response.json();
      
      // Create audio element
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsVoicePreviewPlaying(true);
        setCurrentPlayingVoice(voiceId);
      };
      audio.onended = () => {
        setIsVoicePreviewPlaying(false);
        setCurrentPlayingVoice(null);
      };
      audio.onpause = () => {
        setIsVoicePreviewPlaying(false);
        setCurrentPlayingVoice(null);
      };
      
      // Play the audio
      await audio.play();
    } catch (error) {
      toast({
        title: "Error",
        description: "generation is not available on the Free plan",
        variant: "destructive",
      });
      console.error("Error previewing voice:", error);
    }
  };

  // Helper function to get voice characteristics description
  const getVoiceDescription = (voice: VoiceOption) => {
    if (!voice.labels) return "";
    
    const characteristics = [];
    
    if (voice.labels.gender) characteristics.push(voice.labels.gender);
    if (voice.labels.accent) characteristics.push(voice.labels.accent);
    if (voice.labels.age) characteristics.push(voice.labels.age);
    if (voice.labels.use_case) characteristics.push(voice.labels.use_case);
    
    return characteristics.join(' • ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading available voices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {voices.map((voice) => (
          <div
            key={voice.id}
            className={`flex flex-col p-4 rounded-lg border transition-colors cursor-pointer
              ${selectedVoice === voice.id
                ? 'bg-[#8B1E3F] border-[#D9B08C] text-white'
                : 'bg-[#121212] border-gray-700 text-white hover:bg-[#1E1E1E]'
              }`}
            onClick={() => onVoiceSelect(voice.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium text-lg">{voice.name}</div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 rounded-full p-0 ${
                        isVoicePreviewPlaying && currentPlayingVoice === voice.id
                          ? 'text-[#D9B08C]'
                          : 'text-gray-400'
                      }`}
                      onClick={(e) => handleVoicePreview(voice.id, e)}
                    >
                      {isVoicePreviewPlaying && currentPlayingVoice === voice.id ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Listen to voice preview</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="space-y-2">
              <Badge 
                variant={voice.category === 'premade' ? 'outline' : 'default'} 
                className={`${
                  voice.category === 'premade' 
                    ? 'border-gray-500 text-gray-300' 
                    : 'bg-gradient-to-r from-[#8B1E3F] to-[#3D315B] border-none'
                }`}
              >
                {voice.category === 'premade' ? 'Free Voice' : 'Premium Voice'}
              </Badge>
              
              {getVoiceDescription(voice) && (
                <div className="text-xs text-gray-400 mt-1">
                  {getVoiceDescription(voice)}
                </div>
              )}
              
              {voice.description && (
                <div className="text-xs text-gray-400 mt-1 italic">
                  "{voice.description}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}