"use client";

import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/youtube";
import { CATEGORY_INFO, type SponsorSegment, type SponsorCategory } from "@/lib/sponsorblock";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  className?: string;
  segments?: SponsorSegment[];
}

export function ProgressBar({ currentTime, duration, onSeek, className = "", segments }: ProgressBarProps) {
  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">
        {formatTime(currentTime)}
      </span>
      <div className="relative flex-1">
        {/* SponsorBlock 세그먼트 마커 */}
        {segments && duration > 0 && segments.map((seg) => {
          const left = (seg.segment[0] / duration) * 100;
          const width = Math.max(((seg.segment[1] - seg.segment[0]) / duration) * 100, 0.5);
          const color = CATEGORY_INFO[seg.category as SponsorCategory]?.color ?? "#888";
          return (
            <div
              key={seg.UUID}
              className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full opacity-70 z-0 pointer-events-none"
              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
              title={CATEGORY_INFO[seg.category as SponsorCategory]?.label ?? seg.category}
            />
          );
        })}
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
          className="relative z-10"
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  );
}
