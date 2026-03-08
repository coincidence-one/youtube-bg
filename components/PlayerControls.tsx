"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RepeatMode } from "@/hooks/useYouTubePlayer";

interface PlayerControlsProps {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  hasTrack: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
}

export function PlayerControls({
  isPlaying,
  shuffle,
  repeat,
  hasTrack,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
}: PlayerControlsProps) {
  return (
    <div className="flex items-center gap-1 md:gap-2">
      <Button
        variant="ghost"
        size="icon"
        className={`size-8 hidden sm:inline-flex ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onClick={onToggleShuffle}
        disabled={!hasTrack}
      >
        <Shuffle className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={onPrevious}
        disabled={!hasTrack}
      >
        <SkipBack className="size-4" />
      </Button>

      <Button
        variant="default"
        size="icon"
        className="size-9 rounded-full"
        onClick={onTogglePlay}
        disabled={!hasTrack}
      >
        {isPlaying ? (
          <Pause className="size-4" />
        ) : (
          <Play className="size-4 ml-0.5" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={onNext}
        disabled={!hasTrack}
      >
        <SkipForward className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={`size-8 hidden sm:inline-flex ${repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onClick={onCycleRepeat}
        disabled={!hasTrack}
      >
        {repeat === "one" ? (
          <Repeat1 className="size-4" />
        ) : (
          <Repeat className="size-4" />
        )}
      </Button>
    </div>
  );
}
