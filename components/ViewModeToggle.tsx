"use client";

import { Video, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewModeToggleProps {
  videoMode: boolean;
  onToggle: () => void;
}

export function ViewModeToggle({ videoMode, onToggle }: ViewModeToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-foreground"
      onClick={onToggle}
      title={videoMode ? "노래 모드로 전환" : "영상 모드로 전환"}
    >
      {videoMode ? (
        <Music2 className="size-4" />
      ) : (
        <Video className="size-4" />
      )}
    </Button>
  );
}
