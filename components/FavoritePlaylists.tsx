"use client";

import { useState, useEffect } from "react";
import { Star, Trash2, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  loadFavorites,
  saveFavorite,
  removeFavorite,
  isFavorite,
  type FavoritePlaylist,
} from "@/lib/favorites";
import { getThumbnailUrl } from "@/lib/youtube";

interface FavoritePlaylistsProps {
  currentPlaylistId: string | null;
  playlist: string[];
  onLoadPlaylist: (playlistId: string) => void;
  onFavoritesChange?: () => void;
}

export function FavoritePlaylists({
  currentPlaylistId,
  playlist,
  onLoadPlaylist,
  onFavoritesChange,
}: FavoritePlaylistsProps) {
  const [open, setOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoritePlaylist[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // 즐겨찾기 목록 갱신
  useEffect(() => {
    setFavorites(loadFavorites());
    if (currentPlaylistId) {
      setIsSaved(isFavorite(currentPlaylistId));
    }
  }, [open, currentPlaylistId]);

  const handleToggleFavorite = () => {
    if (!currentPlaylistId) return;
    if (isSaved) {
      removeFavorite(currentPlaylistId);
      setIsSaved(false);
    } else {
      saveFavorite({
        id: currentPlaylistId,
        name: `재생목록 (${playlist.length}곡)`,
        trackCount: playlist.length,
        addedAt: Date.now(),
        thumbnail: playlist[0] ? getThumbnailUrl(playlist[0], "default") : undefined,
      });
      setIsSaved(true);
    }
    setFavorites(loadFavorites());
    onFavoritesChange?.();
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavorite(id);
    if (id === currentPlaylistId) setIsSaved(false);
    setFavorites(loadFavorites());
    onFavoritesChange?.();
  };

  return (
    <div className="flex items-center gap-1">
      {/* 현재 재생목록 즐겨찾기 토글 */}
      {currentPlaylistId && playlist.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className={`size-8 ${isSaved ? "text-yellow-500" : "text-muted-foreground hover:text-foreground"}`}
          onClick={handleToggleFavorite}
          title={isSaved ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
        >
          <Star className={`size-4 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      )}

      {/* 즐겨찾기 목록 드롭다운 */}
      {favorites.length > 0 && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(!open)}
            title="즐겨찾기 목록"
          >
            <Library className="size-4" />
          </Button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute top-full right-0 mt-2 z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[280px] max-h-[400px] overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                  즐겨찾기 ({favorites.length})
                </p>
                {favorites.map((fav) => (
                  <button
                    key={fav.id}
                    onClick={() => {
                      onLoadPlaylist(fav.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors
                      ${fav.id === currentPlaylistId ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  >
                    {fav.thumbnail ? (
                      <img
                        src={fav.thumbnail}
                        alt=""
                        className="w-10 h-7 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-7 rounded bg-muted shrink-0 flex items-center justify-center">
                        <Star className="size-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">{fav.name}</p>
                      <p className="text-[10px] text-muted-foreground">{fav.trackCount}곡</p>
                    </div>
                    <button
                      onClick={(e) => handleRemove(e, fav.id)}
                      className="shrink-0 p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
