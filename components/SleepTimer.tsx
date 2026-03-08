"use client";

import { Timer, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SleepTimerOption, SleepTimerState } from "@/hooks/useSleepTimer";

interface SleepTimerProps {
  timerState: SleepTimerState;
  onSetTimer: (minutes: SleepTimerOption) => void;
}

const OPTIONS: { label: string; value: SleepTimerOption }[] = [
  { label: "끄기", value: 0 },
  { label: "15분", value: 15 },
  { label: "30분", value: 30 },
  { label: "45분", value: 45 },
  { label: "1시간", value: 60 },
  { label: "1.5시간", value: 90 },
];

export function SleepTimer({ timerState, onSetTimer }: SleepTimerProps) {
  return (
    <div className="flex items-center gap-1">
      {timerState.active ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-primary"
          onClick={() => onSetTimer(0)}
        >
          <Timer className="size-3.5" />
          {timerState.remaining}분
        </Button>
      ) : (
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <TimerOff className="size-4" />
          </Button>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
            <div className="bg-popover border rounded-lg shadow-lg p-1 min-w-[100px]">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">슬립 타이머</p>
              {OPTIONS.filter((o) => o.value > 0).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSetTimer(opt.value)}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
