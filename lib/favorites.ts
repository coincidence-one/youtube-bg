/**
 * 재생목록 즐겨찾기 관리 (localStorage)
 */

const FAVORITES_KEY = "ytbg-favorites";

export interface FavoritePlaylist {
  id: string;
  name: string;
  trackCount: number;
  addedAt: number;
  thumbnail?: string;
}

export function loadFavorites(): FavoritePlaylist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function saveFavorite(playlist: FavoritePlaylist): void {
  const favorites = loadFavorites();
  const index = favorites.findIndex((f) => f.id === playlist.id);
  if (index >= 0) {
    favorites[index] = playlist;
  } else {
    favorites.unshift(playlist);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function removeFavorite(playlistId: string): void {
  const favorites = loadFavorites().filter((f) => f.id !== playlistId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(playlistId: string): boolean {
  return loadFavorites().some((f) => f.id === playlistId);
}
