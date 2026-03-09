"use client";

import { useEffect, useState } from "react";
import { fetchVideoVotes, type VideoVotes } from "@/lib/ryd";

export function useVideoVotes(videoId: string | null) {
  const [votes, setVotes] = useState<VideoVotes | null>(null);

  useEffect(() => {
    if (!videoId) {
      setVotes(null);
      return;
    }

    let cancelled = false;
    fetchVideoVotes(videoId).then((v) => {
      if (!cancelled) setVotes(v);
    });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  return votes;
}
