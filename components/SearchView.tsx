"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  X,
  Loader2,
  ListMusic,
  Play,
  ListPlus,
  Music2,
  Flame,
  Tv,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  ytSearch,
  ytTrendingMusic,
  ytSuggestions,
  type SearchResult,
  type VideoItem,
} from "@/lib/youtube-api";
import { formatTime, extractPlaylistId } from "@/lib/youtube";
import { formatCount } from "@/lib/utils";

type SearchFilter = "all" | "music" | "playlist" | "channel";

const FILTER_TABS: { label: string; value: SearchFilter; icon: React.ReactNode }[] = [
  { label: "전체", value: "all", icon: null },
  { label: "음악", value: "music", icon: <Music2 className="size-3" /> },
  { label: "재생목록", value: "playlist", icon: <ListMusic className="size-3" /> },
  { label: "채널", value: "channel", icon: <Tv className="size-3" /> },
];

interface SearchViewProps {
  onLoadPlaylist: (playlistId: string) => void;
  onAddTrack: (
    videoId: string,
    meta: { title: string; duration?: number; uploader?: string },
    playNow?: boolean
  ) => void;
  onClose: () => void;
}

export function SearchView({ onLoadPlaylist, onAddTrack, onClose }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trending, setTrending] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 인기 음악 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTrendingLoading(true);
      try {
        const items = await ytTrendingMusic("KR", 20);
        if (!cancelled) setTrending(items);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setTrendingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 자동완성 (300ms debounce)
  useEffect(() => {
    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    suggestTimeoutRef.current = setTimeout(async () => {
      const s = await ytSuggestions(query);
      setSuggestions(s.slice(0, 6));
      setShowSuggestions(true);
    }, 300);

    return () => {
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    };
  }, [query]);

  // 검색 실행
  const handleSearch = useCallback(
    async (q: string, f?: SearchFilter) => {
      if (!q.trim()) return;
      setShowSuggestions(false);
      setLoading(true);
      setHasSearched(true);

      // 재생목록 URL인지 체크
      const playlistId = extractPlaylistId(q);
      if (playlistId && q.includes("list=")) {
        onLoadPlaylist(playlistId);
        onClose();
        return;
      }

      const activeFilter = f ?? filter;
      const res = await ytSearch(q, activeFilter, 20);
      setResults(res);
      setLoading(false);
    },
    [filter, onLoadPlaylist, onClose]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSelectSuggestion = (s: string) => {
    setQuery(s);
    setSuggestions([]);
    setShowSuggestions(false);
    handleSearch(s);
  };

  const handleFilterChange = (f: SearchFilter) => {
    setFilter(f);
    if (hasSearched && query.trim()) {
      handleSearch(query, f);
    }
  };

  const handleSelectResult = (result: SearchResult, playNow?: boolean) => {
    if (result.type === "playlist") {
      onLoadPlaylist(result.id);
      onClose();
    } else if (result.type === "stream") {
      onAddTrack(
        result.id,
        { title: result.title, duration: result.duration, uploader: result.uploaderName },
        playNow
      );
      if (playNow) onClose();
    }
  };

  const handlePlayTrending = (item: VideoItem, playNow?: boolean) => {
    onAddTrack(
      item.videoId,
      { title: item.title, duration: item.duration, uploader: item.channelTitle },
      playNow
    );
    if (playNow) onClose();
  };

  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-4">
      {/* 상단 바 */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="YouTube 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setSuggestions([]);
                setHasSearched(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}

          {/* 자동완성 드롭다운 */}
          {showSuggestions && suggestions.length > 0 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 flex items-center gap-2"
                  >
                    <Search className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </form>
        <Button variant="ghost" size="sm" onClick={onClose}>
          닫기
        </Button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
              filter === tab.value
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted/50 hover:bg-muted text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 검색 결과 */}
      {!loading && results.length > 0 && (
        <ScrollArea className="h-[400px] lg:h-[500px]">
          <div className="space-y-1 p-1">
            {results.map((result, i) => {
              const isStream = result.type === "stream";
              const isAdded = isStream ? addedIds.has(result.id) : false;

              return (
                <div
                  key={`${result.id}-${i}`}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-left transition-colors group"
                >
                  {/* 썸네일 */}
                  <button
                    onClick={() => handleSelectResult(result, true)}
                    className="relative shrink-0"
                  >
                    <img
                      src={result.thumbnail}
                      alt=""
                      className="w-24 h-14 rounded object-cover"
                    />
                    {isStream && result.duration > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[10px] px-1 rounded">
                        {formatTime(result.duration)}
                      </span>
                    )}
                    {result.type === "playlist" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                        <ListMusic className="size-5 text-white" />
                      </div>
                    )}
                    {result.type === "channel" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                        <Tv className="size-5 text-white" />
                      </div>
                    )}
                    {/* 재생 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 rounded transition-colors">
                      <Play className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                    </div>
                  </button>
                  {/* 정보 */}
                  <button
                    onClick={() => handleSelectResult(result, true)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.uploaderName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.type === "playlist" ? (
                        <span className="text-primary">{result.videos ?? 0}곡 재생목록</span>
                      ) : result.type === "channel" ? (
                        <span className="text-primary">채널</span>
                      ) : (
                        <>
                          {result.views > 0 && `조회수 ${formatCount(result.views)}`}
                        </>
                      )}
                    </p>
                  </button>
                  {/* 큐에 추가 버튼 (stream만) */}
                  {isStream && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`size-8 shrink-0 ${
                        isAdded
                          ? "text-primary"
                          : "text-muted-foreground opacity-0 group-hover:opacity-100"
                      } transition-all`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectResult(result, false);
                        setAddedIds((prev) => new Set(prev).add(result.id));
                      }}
                      title={isAdded ? "큐에 추가됨" : "큐에 추가"}
                    >
                      <ListPlus className="size-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* 빈 결과 (검색 후 결과 없음) */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search className="size-12 mb-4 opacity-30" />
          <p className="text-sm">검색 결과가 없습니다</p>
          <p className="text-xs mt-1 opacity-70">다른 검색어를 입력해보세요</p>
        </div>
      )}

      {/* 인기 음악 (검색 전 초기 화면) */}
      {!loading && !hasSearched && (
        <div>
          {/* 인기 음악 섹션 */}
          {trendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : trending.length > 0 ? (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Flame className="size-4 text-orange-500" />
                <h3 className="text-sm font-medium">인기 음악</h3>
              </div>
              <ScrollArea className="h-[400px] lg:h-[500px]">
                <div className="space-y-1 p-1">
                  {trending.map((item, i) => {
                    const isAdded = addedIds.has(item.videoId);

                    return (
                      <div
                        key={item.videoId}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-left transition-colors group"
                      >
                        {/* 순위 */}
                        <span className="text-xs text-muted-foreground w-5 text-center shrink-0 font-medium">
                          {i + 1}
                        </span>
                        {/* 썸네일 */}
                        <button
                          onClick={() => handlePlayTrending(item, true)}
                          className="relative shrink-0"
                        >
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-20 h-12 rounded object-cover"
                          />
                          {item.duration > 0 && (
                            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[10px] px-1 rounded">
                              {formatTime(item.duration)}
                            </span>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 rounded transition-colors">
                            <Play className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                          </div>
                        </button>
                        {/* 정보 */}
                        <button
                          onClick={() => handlePlayTrending(item, true)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.channelTitle}
                          </p>
                          {item.viewCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              조회수 {formatCount(item.viewCount)}
                            </p>
                          )}
                        </button>
                        {/* 큐에 추가 */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`size-8 shrink-0 ${
                            isAdded
                              ? "text-primary"
                              : "text-muted-foreground opacity-0 group-hover:opacity-100"
                          } transition-all`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTrending(item, false);
                            setAddedIds((prev) => new Set(prev).add(item.videoId));
                          }}
                          title={isAdded ? "큐에 추가됨" : "큐에 추가"}
                        >
                          <ListPlus className="size-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="size-12 mb-4 opacity-30" />
              <p className="text-sm">YouTube 검색</p>
              <p className="text-xs mt-1 opacity-70">재생목록이나 음악을 검색해보세요</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
