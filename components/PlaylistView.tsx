"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Music, Play, Pause, Search, X, ListPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getThumbnailUrl, formatTime } from "@/lib/youtube";
import { PlaylistSkeleton } from "./PlaylistSkeleton";
import type { TrackMeta } from "@/lib/youtube";

interface PlaylistViewProps {
  playlist: string[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  trackMeta: Record<string, TrackMeta>;
  queue: number[];
  onPlayAt: (index: number) => void;
  onAddToQueue: (index: number) => void;
}

export function PlaylistView({
  playlist,
  currentIndex,
  isPlaying,
  isLoading,
  trackMeta,
  queue,
  onPlayAt,
  onAddToQueue,
}: PlaylistViewProps) {
  const [search, setSearch] = useState("");
  const currentRef = useRef<HTMLButtonElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(currentIndex);

  // 곡이 바뀔 때 현재 곡으로 자동 스크롤
  useEffect(() => {
    if (currentIndex !== prevIndexRef.current && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  // 큐에 들어있는 인덱스 Set
  const queueSet = useMemo(() => new Set(queue), [queue]);

  // 검색 필터링 결과
  const filteredItems = useMemo(() => {
    if (!search.trim()) return null; // null = 필터 없음, 전체 표시
    const query = search.toLowerCase();
    return playlist
      .map((videoId, index) => ({ videoId, index }))
      .filter(({ videoId, index }) => {
        const title = trackMeta[videoId]?.title || `Track ${index + 1}`;
        return title.toLowerCase().includes(query);
      });
  }, [search, playlist, trackMeta]);

  if (isLoading && playlist.length === 0) {
    return <PlaylistSkeleton />;
  }

  if (playlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Music className="size-12 mb-4 opacity-30" />
        <p className="text-sm">재생목록을 로드해주세요</p>
        <p className="text-xs mt-1 opacity-70">YouTube 재생목록 URL을 위에 붙여넣으세요</p>
      </div>
    );
  }

  const renderTrack = (videoId: string, index: number) => {
    const isCurrent = index === currentIndex;
    const isQueued = queueSet.has(index);
    const meta = trackMeta[videoId];
    const title = meta?.title;
    const duration = meta?.duration;
    return (
      <div
        key={`${videoId}-${index}`}
        className={`flex items-center gap-1 rounded-md transition-colors
          ${isCurrent ? "bg-primary/10" : "hover:bg-muted/50"}`}
      >
        <button
          ref={isCurrent ? currentRef : undefined}
          onClick={() => onPlayAt(index)}
          className={`flex-1 flex items-center gap-3 px-3 py-2 text-left min-w-0
            ${isCurrent ? "text-primary" : ""}`}
        >
          <div className="relative shrink-0">
            <img
              src={getThumbnailUrl(videoId, "default")}
              alt=""
              className="w-12 h-9 rounded object-cover"
            />
            {isCurrent && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                {isPlaying ? (
                  <Pause className="size-3 text-white" />
                ) : (
                  <Play className="size-3 text-white ml-0.5" />
                )}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm truncate ${isCurrent ? "font-medium" : ""}`}>
              {title || `Track ${index + 1}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {index + 1}
              {duration && duration > 0 && (
                <span className="ml-1.5 opacity-70">{formatTime(duration)}</span>
              )}
              {isQueued && (
                <span className="ml-1.5 text-primary text-[10px]">• 큐</span>
              )}
            </p>
          </div>
        </button>
        {/* 큐 추가 버튼 (현재 곡이 아닌 경우만) */}
        {!isCurrent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(index);
            }}
            className={`shrink-0 p-1.5 mr-1 rounded transition-colors
              ${isQueued ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
            title={isQueued ? "큐에 추가됨" : "다음에 재생"}
          >
            <ListPlus className="size-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 검색 바 */}
      <div className="relative mb-2 shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="곡 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border bg-transparent outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* 검색 결과 카운트 / 큐 정보 */}
      <div className="flex items-center justify-between mb-1 px-1">
        {filteredItems ? (
          <p className="text-[10px] text-muted-foreground">
            {filteredItems.length}개 결과
          </p>
        ) : queue.length > 0 ? (
          <p className="text-[10px] text-primary">
            큐: {queue.length}곡 대기 중
          </p>
        ) : (
          <div />
        )}
      </div>

      {/* 곡 리스트 */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="space-y-0.5 p-1">
          {filteredItems
            ? filteredItems.map(({ videoId, index }) => renderTrack(videoId, index))
            : playlist.map((videoId, index) => renderTrack(videoId, index))}
          {filteredItems && filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-xs">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
