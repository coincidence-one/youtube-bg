"use client";

import { Music } from "lucide-react";
import type { TrackInfo as TrackInfoType } from "@/hooks/useYouTubePlayer";

interface TrackInfoProps {
  track: TrackInfoType | null;
  className?: string;
}

export function TrackInfo({ track, className = "" }: TrackInfoProps) {
  if (!track) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="size-12 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Music className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">재생 중인 곡이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={track.thumbnail}
        alt={track.title}
        className="size-12 rounded-md object-cover shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.author}</p>
      </div>
    </div>
  );
}
