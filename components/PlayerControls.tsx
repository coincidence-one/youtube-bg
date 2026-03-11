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
  large?: boolean;
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
  large = false,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
}: PlayerControlsProps) {
  const sideBtn = large ? "size-11" : "size-8";
  const sideIcon = large ? "size-6" : "size-4";
  const mainBtn = large ? "size-14" : "size-9";
  const mainIcon = large ? "size-6" : "size-4";

  return (
    <div className={`flex items-center ${large ? "gap-3" : "gap-1 md:gap-2"}`}>
      <Button
        variant="ghost"
        size="icon"
        className={`${sideBtn} hidden sm:inline-flex ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onClick={onToggleShuffle}
        disabled={!hasTrack}
      >
        <Shuffle className={sideIcon} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={sideBtn}
        onClick={onPrevious}
        disabled={!hasTrack}
      >
        <SkipBack className={sideIcon} />
      </Button>

      <Button
        variant="default"
        size="icon"
        className={`${mainBtn} rounded-full`}
        onClick={onTogglePlay}
        disabled={!hasTrack}
      >
        {isPlaying ? (
          <Pause className={mainIcon} />
        ) : (
          <Play className={`${mainIcon} ml-0.5`} />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={sideBtn}
        onClick={onNext}
        disabled={!hasTrack}
      >
        <SkipForward className={sideIcon} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={`${sideBtn} hidden sm:inline-flex ${repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onClick={onCycleRepeat}
        disabled={!hasTrack}
      >
        {repeat === "one" ? (
          <Repeat1 className={sideIcon} />
        ) : (
          <Repeat className={sideIcon} />
        )}
      </Button>
    </div>
  );
}
