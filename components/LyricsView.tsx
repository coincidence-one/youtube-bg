"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic2, Loader2 } from "lucide-react";
import { fetchLyrics, parseSyncedLyrics, type SyncedLine } from "@/lib/lyrics";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const currentLineRef = useRef<HTMLParagraphElement>(null);
  const fetchKeyRef = useRef("");

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
      <ScrollArea className="h-full">
        <div className="space-y-3 p-4">
          {syncedLines.map((line, i) => (
            <p
              key={i}
              ref={i === currentLineIndex ? currentLineRef : undefined}
              className={`transition-all duration-300 cursor-default ${
                i === currentLineIndex
                  ? "text-primary font-semibold text-base"
                  : i < currentLineIndex
                  ? "text-muted-foreground/40 text-sm"
                  : "text-muted-foreground text-sm"
              }`}
            >
              {line.text}
            </p>
          ))}
        </div>
      </ScrollArea>
    );
  }

  // 일반 가사
  return (
    <ScrollArea className="h-full">
      <div className="p-4 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
        {lyrics}
      </div>
    </ScrollArea>
  );
}
