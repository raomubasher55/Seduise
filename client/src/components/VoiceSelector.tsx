import { useEffect, useMemo, useRef, useState } from "react";
import { VoiceOption } from "@/types";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceSelectorProps {
  voices: VoiceOption[];
  onVoiceSelect: (voiceId: string) => void;
  selectedVoice?: string;
}

export function VoiceSelector({ voices, onVoiceSelect, selectedVoice }: VoiceSelectorProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const languages = useMemo(
    () => Array.from(new Set(voices.map((voice) => voice.language))),
    [voices],
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>(languages[0] || "");
  const [isVoicePreviewPlaying, setIsVoicePreviewPlaying] = useState(false);
  const [currentPlayingVoice, setCurrentPlayingVoice] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLanguage && languages.length > 0) {
      setSelectedLanguage(languages[0]);
    }
  }, [languages, selectedLanguage]);

  const filteredVoices = useMemo(
    () =>
      voices.filter((voice) =>
        selectedLanguage ? voice.language === selectedLanguage : true,
      ),
    [voices, selectedLanguage],
  );

  const handleVoicePreview = async (voiceId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsVoicePreviewPlaying(false);
      setCurrentPlayingVoice(null);
    }

    try {
      const sampleText = "This is a preview of how your story narration will sound.";
      const response = await apiRequest("POST", "/api/speech/generate", {
        text: sampleText,
        voiceId,
      });
      const data = await response.json();

      if (!data?.audioUrl) {
        throw new Error(data?.message || "Preview request did not return audio.");
      }

      if (data?.message) {
        toast({
          title: "Notice",
          description: data.message,
        });
      }

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
      await audio.play();
    } catch (error) {
      console.error("Error previewing voice:", error);
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (!voices.length) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        No voices available. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400 mb-2">Select a language</p>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-full md:w-64 bg-[#1E1E1E] border-gray-700 text-white">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="bg-[#1E1E1E] text-white border-gray-700 max-h-72">
            {languages.map((language) => (
              <SelectItem key={language} value={language}>
                {language}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredVoices.map((voice) => (
          <div
            key={voice.id}
            className={`flex flex-col p-4 rounded-lg border transition-colors cursor-pointer ${
              selectedVoice === voice.id
                ? "bg-[#8B1E3F] border-[#D9B08C] text-white"
                : "bg-[#121212] border-gray-700 text-white hover:bg-[#1E1E1E]"
            }`}
            onClick={() => onVoiceSelect(voice.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium text-lg">{voice.name}</div>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 mt-2"
                >
                  {voice.language}
                </Badge>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 rounded-full p-0 ${
                        isVoicePreviewPlaying && currentPlayingVoice === voice.id
                          ? "text-[#D9B08C]"
                          : "text-gray-400"
                      }`}
                      onClick={(event) => handleVoicePreview(voice.id, event)}
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
              <div className="text-xs text-gray-400 mt-1">
                Voice ID: <span className="font-mono">{voice.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

