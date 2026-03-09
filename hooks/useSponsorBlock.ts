"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSkipSegments, type SponsorSegment, type SponsorCategory } from "@/lib/sponsorblock";

interface SponsorBlockState {
  segments: SponsorSegment[];
  isLoading: boolean;
  lastSkippedCategory: string | null;
  enabled: boolean;
}

const SB_ENABLED_KEY = "ytbg-sb-enabled";

function loadEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(SB_ENABLED_KEY);
    return v !== "false";
  } catch {
    return true;
  }
}

export function useSponsorBlock(videoId: string | null) {
  const [state, setState] = useState<SponsorBlockState>({
    segments: [],
    isLoading: false,
    lastSkippedCategory: null,
    enabled: loadEnabled(),
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // videoId 변경 시 세그먼트 fetch
  useEffect(() => {
    if (!videoId || !stateRef.current.enabled) {
      setState((prev) => ({ ...prev, segments: [], isLoading: false }));
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, lastSkippedCategory: null }));

    fetchSkipSegments(videoId).then((segments) => {
      if (!cancelled) {
        setState((prev) => ({ ...prev, segments, isLoading: false }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // 현재 시간이 스킵 구간에 있는지 체크 → 건너뛸 위치 반환
  const checkSegment = useCallback((currentTime: number): number | null => {
    if (!stateRef.current.enabled) return null;

    for (const seg of stateRef.current.segments) {
      const [start, end] = seg.segment;
      // 구간 시작 후 0.5초 이내에만 스킵 (이미 지나간 구간은 무시)
      if (currentTime >= start && currentTime < start + 1.5 && currentTime < end - 0.5) {
        setState((prev) => ({
          ...prev,
          lastSkippedCategory: seg.category,
        }));
        return end;
      }
    }
    return null;
  }, []);

  // 알림 닫기
  const clearNotification = useCallback(() => {
    setState((prev) => ({ ...prev, lastSkippedCategory: null }));
  }, []);

  // ON/OFF 토글
  const toggleEnabled = useCallback(() => {
    setState((prev) => {
      const newEnabled = !prev.enabled;
      try {
        localStorage.setItem(SB_ENABLED_KEY, String(newEnabled));
      } catch {
        // ignore
      }
      return { ...prev, enabled: newEnabled };
    });
  }, []);

  return {
    segments: state.segments,
    isLoading: state.isLoading,
    lastSkippedCategory: state.lastSkippedCategory,
    enabled: state.enabled,
    checkSegment,
    clearNotification,
    toggleEnabled,
  };
}
