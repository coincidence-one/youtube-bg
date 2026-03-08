"use client";

import { Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaybackSpeedProps {
  rate: number;
  onRateChange: (rate: number) => void;
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function PlaybackSpeed({ rate, onRateChange }: PlaybackSpeedProps) {
  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 gap-1 text-xs ${rate !== 1 ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
      >
        <Gauge className="size-3.5" />
        {rate}x
      </Button>
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-popover border rounded-lg shadow-lg p-1 min-w-[80px]">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">재생 속도</p>
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => onRateChange(r)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors
                ${r === rate ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
