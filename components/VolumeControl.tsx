"use client";

import { Volume2, Volume1, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="group/vol flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={onToggleMute}
      >
        <VolumeIcon className="size-4" />
      </Button>
      <div className="w-0 overflow-hidden opacity-0 group-hover/vol:w-24 group-hover/vol:opacity-100 transition-all duration-200">
        <Slider
          value={[isMuted ? 0 : volume]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => onVolumeChange(Array.isArray(value) ? value[0] : value)}
          className="w-24"
        />
      </div>
    </div>
  );
}
