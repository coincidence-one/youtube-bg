"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, ListMusic, Play, ListPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { searchVideos, fetchSuggestions, type PipedSearchResult } from "@/lib/piped";
import { formatTime, extractPlaylistId } from "@/lib/youtube";
import { formatCount } from "@/lib/utils";

interface SearchViewProps {
  onLoadPlaylist: (playlistId: string) => void;
  onClose: () => void;
}

export function SearchView({ onLoadPlaylist, onClose }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<PipedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 자동완성 (300ms debounce)
  useEffect(() => {
    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    suggestTimeoutRef.current = setTimeout(async () => {
      const s = await fetchSuggestions(query);
      setSuggestions(s.slice(0, 6));
      setShowSuggestions(true);
    }, 300);

    return () => {
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    };
  }, [query]);

  // 검색 실행
  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setLoading(true);

    // 재생목록 URL인지 체크
    const playlistId = extractPlaylistId(q);
    if (playlistId && q.includes("list=")) {
      onLoadPlaylist(playlistId);
      onClose();
      return;
    }

    const res = await searchVideos(q, "music_songs");
    setResults(res);
    setLoading(false);
  }, [onLoadPlaylist, onClose]);

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

  const handleSelectResult = (result: PipedSearchResult) => {
    if (result.type === "playlist") {
      // /playlist?list=xxx 형식
      const match = result.url.match(/list=([^&]+)/);
      if (match) {
        onLoadPlaylist(match[1]);
        onClose();
      }
    }
    // stream 타입은 현재 개별 비디오 재생 지원 안 함 → 향후 큐에 추가 가능
  };

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
              onClick={() => { setQuery(""); setResults([]); setSuggestions([]); }}
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

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 결과 목록 */}
      {!loading && results.length > 0 && (
        <ScrollArea className="h-[400px] lg:h-[500px]">
          <div className="space-y-1 p-1">
            {results.map((result, i) => (
              <button
                key={`${result.url}-${i}`}
                onClick={() => handleSelectResult(result)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-left transition-colors"
              >
                {/* 썸네일 */}
                <div className="relative shrink-0">
                  <img
                    src={result.thumbnail}
                    alt=""
                    className="w-24 h-14 rounded object-cover"
                  />
                  {result.type === "stream" && result.duration > 0 && (
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[10px] px-1 rounded">
                      {formatTime(result.duration)}
                    </span>
                  )}
                  {result.type === "playlist" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                      <ListMusic className="size-5 text-white" />
                    </div>
                  )}
                </div>
                {/* 정보 */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{result.uploaderName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.type === "playlist" ? (
                      <span className="text-primary">{result.videos ?? 0}곡 재생목록</span>
                    ) : (
                      <>
                        {result.views > 0 && `조회수 ${formatCount(result.views)}`}
                      </>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* 빈 결과 */}
      {!loading && results.length === 0 && query && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search className="size-12 mb-4 opacity-30" />
          <p className="text-sm">검색어를 입력하고 Enter를 누르세요</p>
          <p className="text-xs mt-1 opacity-70">YouTube 영상이나 재생목록을 검색할 수 있습니다</p>
        </div>
      )}

      {/* 초기 상태 */}
      {!loading && results.length === 0 && !query && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search className="size-12 mb-4 opacity-30" />
          <p className="text-sm">YouTube 검색</p>
          <p className="text-xs mt-1 opacity-70">재생목록이나 음악을 검색해보세요</p>
        </div>
      )}
    </div>
  );
}
