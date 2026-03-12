"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RadioState } from "@/hooks/useRadioMode";

interface RadioBannerProps {
  radioState: RadioState;
  onStop: () => void;
}

export function RadioBanner({ radioState, onStop }: RadioBannerProps) {
  if (!radioState.active) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm">
      <span className="size-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
      <span className="font-medium shrink-0">
        {radioState.genreName} 라디오
      </span>
      <span className="text-muted-foreground text-xs shrink-0">
        {radioState.loadedCount}곡
      </span>
      {radioState.isLoadingMore && (
        <Loader2 className="size-3 animate-spin text-muted-foreground shrink-0" />
      )}
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
        onClick={onStop}
      >
        <X className="size-3 mr-1" />
        중지
      </Button>
    </div>
  );
}
