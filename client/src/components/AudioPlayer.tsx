import { useState, useRef, useEffect } from "react";
import { Pause, Play, Volume2, Settings, Rewind, FastForward, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string | null;
  title: string;
  narrator: string;
  onEnded?: () => void;
  apiKeyError?: boolean;
  isFallback?: boolean;
  fallbackMessage?: string;
}

const AudioPlayer = ({ 
  audioUrl, 
  title, 
  narrator, 
  onEnded, 
  apiKeyError, 
  isFallback = false,
  fallbackMessage
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(
    apiKeyError ? "Voice generation failed: API key issue. Please contact support." : 
    isFallback ? (fallbackMessage || "Audio generation failed. Try with shorter text.") : 
    null
  );
  const [audioSize, setAudioSize] = useState<number | null>(null);
  const [isEmptyAudio, setIsEmptyAudio] = useState(isFallback);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const formattedAudioUrl = audioUrl && !apiKeyError && !isFallback
    ? (audioUrl.startsWith('http') 
      ? audioUrl 
      : `${window.location.origin}${audioUrl}`)
    : null;
  
  useEffect(() => {
    // console.log("Audio Player mounted or updated");
    // console.log("Original audio URL:", audioUrl);
    // console.log("Formatted audio URL:", formattedAudioUrl);
    // console.log("API key error:", apiKeyError);
    // console.log("Is fallback:", isFallback);
    // console.log("Fallback message:", fallbackMessage);
    
    if (apiKeyError) {
      setError("Voice generation failed: API key issue. Please contact support.");
      return;
    }
    
    if (isFallback) {
      setError(fallbackMessage || "Audio generation failed. Try with shorter text.");
      setIsEmptyAudio(true);
      return;
    }

    // console.log(`formattedAudioUrl: ${formattedAudioUrl}`);
    
    if (!formattedAudioUrl) {
      console.error("No audio URL provided - formattedAudioUrl is null or empty");
      setError("No audio URL provided");
      return;
    }
    
    if (audioUrl === null || audioUrl === undefined) {
      console.error("audioUrl prop is null or undefined");
    } else if (audioUrl === '') {
      console.error("audioUrl prop is an empty string");
    }
    
    // Force reload the audio element when URL changes
    if (audioRef.current) {
      // console.log("Reloading audio element with new URL:", formattedAudioUrl);
      audioRef.current.pause();
      audioRef.current.src = formattedAudioUrl;
      audioRef.current.load();
      setError(null); // Clear any previous errors
      setIsEmptyAudio(false); // Reset empty audio state
    }
    
    fetch(formattedAudioUrl, { method: 'HEAD', cache: 'no-cache' })
      .then(response => {
        // console.log("Audio file HEAD request status:", response.status);
        if (!response.ok) {
          setError(`Audio file not found (${response.status})`);
          return null;
        }
        
        const contentLength = response.headers.get('Content-Length');
        const size = contentLength ? parseInt(contentLength, 10) : null;
        // console.log("Audio file size:", size, "bytes");
        setAudioSize(size);
        
        if (size !== null && size < 1024) {
          // console.log("Audio file is too small, likely a fallback silent MP3");
          setIsEmptyAudio(true);
          setError("Audio generation failed. Please try again with a shorter text.");
        } else if (size !== null && size > 1024) {
          // If we have a valid file, clear any errors and prepare the player
          setIsEmptyAudio(false);
          setError(null);
          
          // Refresh the audio element
          if (audioRef.current) {
            audioRef.current.load();
          }
        }
        
        return size;
      })
      .catch(err => {
        console.error("Error checking audio file:", err);
        setError("Could not verify audio file");
      });
    
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [audioUrl, formattedAudioUrl, volume, apiKeyError, isFallback, fallbackMessage]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    const handleError = (e: ErrorEvent) => {
      console.error("Audio playback error:", e);
      setError("Could not load audio. Please try again.");
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError as EventListener);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError as EventListener);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || isEmptyAudio) return;

    // console.log("Toggle play button clicked. Current state:", isPlaying ? "playing" : "paused");

    if (error) {
      // console.log("Attempting to reload audio after error");
      setError(null);
      audio.load();
    }

    if (isPlaying) {
      // console.log("Pausing audio");
      audio.pause();
    } else {
      // console.log("Playing audio from URL:", formattedAudioUrl);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // console.log("Audio playback started successfully");
          })
          .catch(e => {
            // console.error("Play error:", e);
            setError(`Playback failed: ${e.message}`);
          });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + seconds), audio.duration);
  };

  return (
    <div className="audio-player bg-[#121212] p-4 rounded-lg">
      {formattedAudioUrl && !isEmptyAudio && (
        <audio 
          ref={audioRef} 
          src={formattedAudioUrl} 
          preload="metadata"
          onCanPlay={() => console.log("Audio can play event")}
          // onLoadedData={() => console.log("Audio loaded data event")}
          onError={(e) => console.error("Audio element error event:", e)}
        />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button 
            onClick={togglePlay}
            disabled={!formattedAudioUrl || apiKeyError || isEmptyAudio || isFallback}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              !formattedAudioUrl || apiKeyError || isEmptyAudio || isFallback
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-[#8B1E3F] hover:bg-[#A93B5B]'
            }`}
          >
            {isEmptyAudio || isFallback ? <AlertCircle size={20} /> : (isPlaying ? <Pause size={20} /> : <Play size={20} />)}
          </button>
          <div className="ml-4">
            <h4 className="font-['Playfair_Display'] text-lg">{title}</h4>
            <p className="text-sm text-gray-400">Narrated by {narrator}</p>
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {error}
                {apiKeyError && (
                  <span className="block mt-1 text-xs">
                    The API key is invalid or has expired. Admin needs to update it.
                  </span>
                )}
                {(isEmptyAudio || isFallback) && (
                  <span className="block mt-1 text-xs">
                    The text might be too long or complex. Try with a shorter text.
                  </span>
                )}
              </p>
            )}
            {audioSize !== null && audioSize < 1024 && !error && (
              <p className="text-sm text-yellow-500 mt-1">
                Audio content unavailable. Text may be too long or complex.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Volume2 
            size={18} 
            className="text-gray-400 hover:text-white cursor-pointer transition-colors"
            onClick={() => setVolume(volume > 0 ? 0 : 1)}
          />
          <Settings size={18} className="text-gray-400 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>
      
      <div className="relative mb-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full accent-[#D9B08C]"
        />
        <div className="audio-wave absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center z-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <span 
              key={i} 
              style={{ 
                height: `${Math.floor(Math.random() * 15) + 3}px`,
                animationDelay: `${i * 0.1}s` 
              }}
              className="inline-block w-[3px] mx-[1px] bg-[#D9B08C]/50"
            ></span>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="mt-6 flex justify-between">
        <div className="flex space-x-3">
          <button 
            onClick={() => handleSkip(-10)}
            className="bg-[#121212] p-3 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Rewind size={18} />
          </button>
          <button 
            onClick={() => handleSkip(10)}
            className="bg-[#121212] p-3 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <FastForward size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
