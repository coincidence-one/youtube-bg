"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic2, Loader2, AArrowUp, AArrowDown } from "lucide-react";
import { fetchLyrics, parseSyncedLyrics, type SyncedLine } from "@/lib/lyrics";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ytbg-lyrics-large";

interface LyricsViewProps {
  title: string;
  artist: string;
  currentTime: number;
}

export function LyricsView({ title, artist, currentTime }: LyricsViewProps) {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [largeText, setLargeText] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const currentLineRef = useRef<HTMLParagraphElement>(null);
  const fetchKeyRef = useRef("");

  const toggleLargeText = () => {
    setLargeText((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // 곡이 바뀌면 가사 새로 검색
  useEffect(() => {
    if (!title || !artist) return;
    const key = `${title}::${artist}`;
    if (fetchKeyRef.current === key) return;
    fetchKeyRef.current = key;

    setLoading(true);
    setLyrics(null);
    setSyncedLines(null);
    setError(false);

    fetchLyrics(title, artist).then((result) => {
      if (fetchKeyRef.current !== key) return;
      setLoading(false);
      if (!result) {
        setError(true);
        return;
      }
      if (result.syncedLyrics) {
        setSyncedLines(parseSyncedLyrics(result.syncedLyrics));
      }
      if (result.plainLyrics) {
        setLyrics(result.plainLyrics);
      }
      if (!result.syncedLyrics && !result.plainLyrics) {
        setError(true);
      }
    });
  }, [title, artist]);

  // 현재 싱크 라인 인덱스
  const currentLineIndex = useMemo(() => {
    if (!syncedLines) return -1;
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (syncedLines[i].time <= currentTime) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [syncedLines, currentTime]);

  // 현재 라인으로 자동 스크롤
  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIndex]);

  // 글씨 크기 토글 버튼
  const fontSizeToggle = (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-1 right-1 size-7 text-muted-foreground hover:text-foreground z-10"
      onClick={toggleLargeText}
      title={largeText ? "작은 글씨" : "큰 글씨"}
    >
      {largeText ? <AArrowDown className="size-4" /> : <AArrowUp className="size-4" />}
    </Button>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="size-6 animate-spin mb-2" />
        <p className="text-xs">가사 검색 중...</p>
      </div>
    );
  }

  if (error || (!lyrics && !syncedLines)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Mic2 className="size-8 opacity-30 mb-2" />
        <p className="text-xs">가사를 찾을 수 없습니다</p>
      </div>
    );
  }

  // 싱크 가사 (노래방 스타일)
  if (syncedLines && syncedLines.length > 0) {
    return (
      <div className="relative h-full">
        {fontSizeToggle}
        <ScrollArea className="h-full">
          <div className={`${largeText ? "space-y-4" : "space-y-3"} p-4 pt-8`}>
            {syncedLines.map((line, i) => (
              <p
                key={i}
                ref={i === currentLineIndex ? currentLineRef : undefined}
                className={`transition-all duration-300 cursor-default ${
                  i === currentLineIndex
                    ? `text-primary font-semibold ${largeText ? "text-xl" : "text-base"}`
                    : i < currentLineIndex
                    ? `text-muted-foreground/40 ${largeText ? "text-base" : "text-sm"}`
                    : `text-muted-foreground ${largeText ? "text-base" : "text-sm"}`
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // 일반 가사
  return (
    <div className="relative h-full">
      {fontSizeToggle}
      <ScrollArea className="h-full">
        <div className={`p-4 pt-8 whitespace-pre-wrap text-muted-foreground leading-relaxed ${
          largeText ? "text-base" : "text-sm"
        }`}>
          {lyrics}
        </div>
      </ScrollArea>
    </div>
  );
}
