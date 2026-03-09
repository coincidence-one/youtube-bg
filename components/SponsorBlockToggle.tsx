"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SponsorBlockToggleProps {
  enabled: boolean;
  segmentCount: number;
  onToggle: () => void;
}

export function SponsorBlockToggle({ enabled, segmentCount, onToggle }: SponsorBlockToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`size-8 ${enabled ? "text-green-500 hover:text-green-600" : "text-muted-foreground hover:text-foreground"}`}
      onClick={onToggle}
      title={
        enabled
          ? `SponsorBlock ON${segmentCount > 0 ? ` (${segmentCount}개 구간)` : ""}`
          : "SponsorBlock OFF"
      }
    >
      {enabled ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}
    </Button>
  );
}
