"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onToggleVideoMode: () => void;
  onToggleLyrics: () => void;
  hasTrack: boolean;
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onNext,
  onPrevious,
  onVolumeUp,
  onVolumeDown,
  onToggleMute,
  onSeekForward,
  onSeekBackward,
  onToggleVideoMode,
  onToggleLyrics,
  hasTrack,
}: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // input/textarea에서는 동작하지 않음
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (!hasTrack) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          onTogglePlay();
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            onNext();
          } else {
            onSeekForward();
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            onPrevious();
          } else {
            onSeekBackward();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          onVolumeUp();
          break;
        case "ArrowDown":
          e.preventDefault();
          onVolumeDown();
          break;
        case "m":
        case "M":
          onToggleMute();
          break;
        case "v":
        case "V":
          onToggleVideoMode();
          break;
        case "l":
        case "L":
          onToggleLyrics();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    onTogglePlay,
    onNext,
    onPrevious,
    onVolumeUp,
    onVolumeDown,
    onToggleMute,
    onSeekForward,
    onSeekBackward,
    onToggleVideoMode,
    onToggleLyrics,
    hasTrack,
  ]);
}
