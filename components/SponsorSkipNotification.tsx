"use client";

import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { CATEGORY_INFO, type SponsorCategory } from "@/lib/sponsorblock";

interface SponsorSkipNotificationProps {
  category: string | null;
  onDismiss: () => void;
}

export function SponsorSkipNotification({ category, onDismiss }: SponsorSkipNotificationProps) {
  useEffect(() => {
    if (!category) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [category, onDismiss]);

  if (!category) return null;

  const info = CATEGORY_INFO[category as SponsorCategory];

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/95 border shadow-lg backdrop-blur-md text-sm"
      >
        <ShieldCheck className="size-4 text-green-500 shrink-0" />
        <span className="whitespace-nowrap">
          {info?.label ?? category} 구간 건너뜀
        </span>
      </div>
    </div>
  );
}
