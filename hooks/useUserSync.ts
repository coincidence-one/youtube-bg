"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ------- 타입 -------

export interface UserPreferences {
  volume: number;
  playbackRate: number;
  videoMode: boolean;
  sponsorBlockEnabled: boolean;
  lastPlaylistId: string | null;
}

export interface FavoritePlaylist {
  id: string;
  name: string;
  trackCount: number;
  addedAt: number;
  thumbnail?: string;
}

interface DbPreferences {
  id: string;
  volume: number;
  playback_rate: number;
  video_mode: boolean;
  sponsor_block_enabled: boolean;
  last_playlist_id: string | null;
  updated_at: string;
}

interface DbFavorite {
  id?: number;
  user_id: string;
  playlist_id: string;
  name: string;
  track_count: number;
  thumbnail: string | null;
  added_at: number;
}

export interface UseUserSyncReturn {
  user: User | null;
  isLoading: boolean;
  favorites: FavoritePlaylist[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncPreferences: (prefs: Partial<UserPreferences>) => void;
  addFavorite: (fav: FavoritePlaylist) => Promise<void>;
  removeFavorite: (playlistId: string) => Promise<void>;
  isFavorite: (playlistId: string) => boolean;
}

// ------- 상수 -------

const STORAGE_KEY = "ytbg-state";
const SB_KEY = "ytbg-sb-enabled";
const LEGACY_FAV_KEY = "ytbg-favorites";
const SYNC_DEBOUNCE = 500;

// ------- 헬퍼 -------

function readLocalPrefs(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const sbRaw = localStorage.getItem(SB_KEY);
    return {
      volume: parsed.volume ?? 80,
      playbackRate: parsed.playbackRate ?? 1,
      videoMode: parsed.videoMode ?? false,
      sponsorBlockEnabled: sbRaw !== null ? sbRaw !== "false" : true,
      lastPlaylistId: parsed.playlistId ?? null,
    };
  } catch {
    return {
      volume: 80,
      playbackRate: 1,
      videoMode: false,
      sponsorBlockEnabled: true,
      lastPlaylistId: null,
    };
  }
}

function writeLocalPrefs(prefs: Partial<UserPreferences>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (prefs.volume !== undefined) parsed.volume = prefs.volume;
    if (prefs.playbackRate !== undefined) parsed.playbackRate = prefs.playbackRate;
    if (prefs.videoMode !== undefined) parsed.videoMode = prefs.videoMode;
    if (prefs.lastPlaylistId !== undefined) parsed.playlistId = prefs.lastPlaylistId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    if (prefs.sponsorBlockEnabled !== undefined) {
      localStorage.setItem(SB_KEY, String(prefs.sponsorBlockEnabled));
    }
  } catch {
    // 무시
  }
}

function dbToFav(db: DbFavorite): FavoritePlaylist {
  return {
    id: db.playlist_id,
    name: db.name,
    trackCount: db.track_count,
    addedAt: db.added_at,
    thumbnail: db.thumbnail ?? undefined,
  };
}

// ------- 훅 -------

/** Supabase 미설정 시 반환하는 noop 객체 */
const NOOP_RETURN: UseUserSyncReturn = {
  user: null,
  isLoading: false,
  favorites: [],
  signIn: async () => {},
  signOut: async () => {},
  syncPreferences: () => {},
  addFavorite: async () => {},
  removeFavorite: async () => {},
  isFavorite: () => false,
};

export function useUserSync(): UseUserSyncReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [favorites, setFavorites] = useState<FavoritePlaylist[]>([]);
  const supabaseRef = useRef(createClient());
  const prefTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergedRef = useRef(false);

  // ------ Auth 초기화 ------
  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
      // 이미 로그인된 상태면 즐겨찾기 로드
      if (data.user) {
        fetchFavorites(data.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (event === "SIGNED_IN" && newUser) {
        mergedRef.current = false;
        mergeOnLogin(newUser.id);
      }
      if (event === "SIGNED_OUT") {
        setFavorites([]);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------ 즐겨찾기 로드 ------
  async function fetchFavorites(userId: string) {
    const supabase = supabaseRef.current;
    if (!supabase) return;

    const { data } = await supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (data) {
      setFavorites(data.map(dbToFav));
    }
  }

  // ------ 로그인 시 병합 ------
  async function mergeOnLogin(userId: string) {
    if (mergedRef.current) return;
    mergedRef.current = true;

    const supabase = supabaseRef.current;
    if (!supabase) return;

    // 1) 클라우드 설정 가져오기
    const { data: cloudPrefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("id", userId)
      .single<DbPreferences>();

    const localPrefs = readLocalPrefs();

    if (cloudPrefs) {
      writeLocalPrefs({
        volume: cloudPrefs.volume,
        playbackRate: cloudPrefs.playback_rate,
        videoMode: cloudPrefs.video_mode,
        sponsorBlockEnabled: cloudPrefs.sponsor_block_enabled,
        lastPlaylistId: cloudPrefs.last_playlist_id,
      });
    } else {
      await supabase.from("user_preferences").upsert({
        id: userId,
        volume: localPrefs.volume,
        playback_rate: localPrefs.playbackRate,
        video_mode: localPrefs.videoMode,
        sponsor_block_enabled: localPrefs.sponsorBlockEnabled,
        last_playlist_id: localPrefs.lastPlaylistId,
      });
    }

    // 2) 일회성 마이그레이션: localStorage 즐겨찾기 → Supabase
    try {
      const localRaw = localStorage.getItem(LEGACY_FAV_KEY);
      if (localRaw) {
        const localFavs: FavoritePlaylist[] = JSON.parse(localRaw);
        if (localFavs.length > 0) {
          const toUpsert = localFavs.map((f) => ({
            user_id: userId,
            playlist_id: f.id,
            name: f.name,
            track_count: f.trackCount,
            thumbnail: f.thumbnail ?? null,
            added_at: f.addedAt,
          }));
          await supabase
            .from("user_favorites")
            .upsert(toUpsert, { onConflict: "user_id,playlist_id" });
        }
        localStorage.removeItem(LEGACY_FAV_KEY);
      }
    } catch {
      // 마이그레이션 실패는 무시
    }

    // 3) 클라우드 즐겨찾기 로드
    await fetchFavorites(userId);
  }

  // ------ 즐겨찾기 CRUD ------
  const addFavorite = useCallback(
    async (fav: FavoritePlaylist) => {
      const supabase = supabaseRef.current;
      if (!user || !supabase) return;

      // 낙관적 업데이트
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === fav.id);
        if (exists) return prev;
        return [fav, ...prev];
      });

      // Supabase upsert
      await supabase.from("user_favorites").upsert(
        {
          user_id: user.id,
          playlist_id: fav.id,
          name: fav.name,
          track_count: fav.trackCount,
          thumbnail: fav.thumbnail ?? null,
          added_at: fav.addedAt,
        },
        { onConflict: "user_id,playlist_id" }
      );
    },
    [user]
  );

  const removeFavorite = useCallback(
    async (playlistId: string) => {
      const supabase = supabaseRef.current;
      if (!user || !supabase) return;

      // 낙관적 업데이트
      setFavorites((prev) => prev.filter((f) => f.id !== playlistId));

      // Supabase delete
      await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("playlist_id", playlistId);
    },
    [user]
  );

  const isFavorite = useCallback(
    (playlistId: string) => {
      return favorites.some((f) => f.id === playlistId);
    },
    [favorites]
  );

  // ------ 설정 동기화 (디바운스) ------
  const syncPreferences = useCallback(
    (prefs: Partial<UserPreferences>) => {
      const supabase = supabaseRef.current;
      if (!user || !supabase) return;
      if (prefTimerRef.current) clearTimeout(prefTimerRef.current);

      prefTimerRef.current = setTimeout(async () => {
        const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (prefs.volume !== undefined) update.volume = prefs.volume;
        if (prefs.playbackRate !== undefined) update.playback_rate = prefs.playbackRate;
        if (prefs.videoMode !== undefined) update.video_mode = prefs.videoMode;
        if (prefs.sponsorBlockEnabled !== undefined) update.sponsor_block_enabled = prefs.sponsorBlockEnabled;
        if (prefs.lastPlaylistId !== undefined) update.last_playlist_id = prefs.lastPlaylistId;

        await supabase
          .from("user_preferences")
          .upsert({ id: user.id, ...update });
      }, SYNC_DEBOUNCE);
    },
    [user]
  );

  // ------ 로그인/로그아웃 ------
  const signIn = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setFavorites([]);
    mergedRef.current = false;
  }, []);

  // Supabase 미설정 시 noop 반환
  if (!isSupabaseConfigured) {
    return NOOP_RETURN;
  }

  return {
    user,
    isLoading,
    favorites,
    signIn,
    signOut,
    syncPreferences,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}
