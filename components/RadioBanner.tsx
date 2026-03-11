"use client";

import { Radio, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RadioState } from "@/hooks/useRadioMode";

interface RadioBannerProps {
  radioState: RadioState;
  onStop: () => void;
}

export function RadioBanner({ radioState, onStop }: RadioBannerProps) {
  if (!radioState.active) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-xl shrink-0">{radioState.genreEmoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {radioState.genreName} 라디오
          </p>
          <p className="text-xs text-muted-foreground">
            {radioState.loadedCount}곡 로드됨
            {radioState.isLoadingMore && (
              <span className="inline-flex items-center gap-1 ml-1.5">
                <Loader2 className="size-3 animate-spin" />
                추가 로드 중...
              </span>
            )}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 h-8 px-3 text-xs gap-1"
        onClick={onStop}
      >
        <X className="size-3.5" />
        중지
      </Button>
    </div>
  );
}
