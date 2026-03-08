"use client";

import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/youtube";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  className?: string;
}

export function ProgressBar({ currentTime, duration, onSeek, className = "" }: ProgressBarProps) {
  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">
        {formatTime(currentTime)}
      </span>
      <Slider
        value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
        min={0}
        max={100}
        step={0.1}
        onValueChange={(value) => {
          const val = Array.isArray(value) ? value[0] : value;
          if (duration > 0) {
            onSeek((val / 100) * duration);
          }
        }}
        className="flex-1"
      />
      <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  );
}
