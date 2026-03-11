"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { loadFavorites, saveFavorite, type FavoritePlaylist } from "@/lib/favorites";

// ------- 타입 -------

export interface UserPreferences {
  volume: number;
  playbackRate: number;
  videoMode: boolean;
  sponsorBlockEnabled: boolean;
  lastPlaylistId: string | null;
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
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncPreferences: (prefs: Partial<UserPreferences>) => void;
  syncFavorites: (favorites: FavoritePlaylist[]) => void;
}

// ------- 상수 -------

const STORAGE_KEY = "ytbg-state";
const SB_KEY = "ytbg-sb-enabled";
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

// ------- 훅 -------

/** Supabase 미설정 시 반환하는 noop 객체 */
const NOOP_RETURN: UseUserSyncReturn = {
  user: null,
  isLoading: false,
  signIn: async () => {},
  signOut: async () => {},
  syncPreferences: () => {},
  syncFavorites: () => {},
};

export function useUserSync(): UseUserSyncReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const supabaseRef = useRef(createClient());
  const prefTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const favTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergedRef = useRef(false);

  // ------ Supabase 미설정 시 즉시 반환 ------
  // (훅 규칙상 조건부 return은 안 되지만, 모든 훅이 위에서 호출된 후이므로 OK)

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
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // 클라우드 우선 → localStorage에 반영
      writeLocalPrefs({
        volume: cloudPrefs.volume,
        playbackRate: cloudPrefs.playback_rate,
        videoMode: cloudPrefs.video_mode,
        sponsorBlockEnabled: cloudPrefs.sponsor_block_enabled,
        lastPlaylistId: cloudPrefs.last_playlist_id,
      });
    } else {
      // 첫 로그인 → localStorage 값으로 클라우드 초기화
      await supabase.from("user_preferences").upsert({
        id: userId,
        volume: localPrefs.volume,
        playback_rate: localPrefs.playbackRate,
        video_mode: localPrefs.videoMode,
        sponsor_block_enabled: localPrefs.sponsorBlockEnabled,
        last_playlist_id: localPrefs.lastPlaylistId,
      });
    }

    // 2) 즐겨찾기 병합
    const { data: cloudFavs } = await supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", userId);

    const localFavs = loadFavorites();
    const cloudMap = new Map((cloudFavs ?? []).map((f: DbFavorite) => [f.playlist_id, f]));
    const localMap = new Map(localFavs.map((f) => [f.id, f]));

    // 로컬에만 있는 항목 → 클라우드에 추가
    const toInsert: DbFavorite[] = [];
    for (const [pid, fav] of localMap) {
      if (!cloudMap.has(pid)) {
        toInsert.push({
          user_id: userId,
          playlist_id: pid,
          name: fav.name,
          track_count: fav.trackCount,
          thumbnail: fav.thumbnail ?? null,
          added_at: fav.addedAt,
        });
      }
    }
    if (toInsert.length > 0) {
      await supabase.from("user_favorites").insert(toInsert);
    }

    // 클라우드에만 있는 항목 → localStorage에 추가
    for (const [, cf] of cloudMap) {
      if (!localMap.has(cf.playlist_id)) {
        saveFavorite({
          id: cf.playlist_id,
          name: cf.name,
          trackCount: cf.track_count,
          addedAt: cf.added_at,
          thumbnail: cf.thumbnail ?? undefined,
        });
      }
    }
  }

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

  // ------ 즐겨찾기 동기화 (디바운스) ------
  const syncFavorites = useCallback(
    (favorites: FavoritePlaylist[]) => {
      const supabase = supabaseRef.current;
      if (!user || !supabase) return;
      if (favTimerRef.current) clearTimeout(favTimerRef.current);

      favTimerRef.current = setTimeout(async () => {
        // 현재 클라우드 상태 가져오기
        const { data: cloudFavs } = await supabase
          .from("user_favorites")
          .select("playlist_id")
          .eq("user_id", user.id);

        const cloudIds = new Set((cloudFavs ?? []).map((f: { playlist_id: string }) => f.playlist_id));
        const localIds = new Set(favorites.map((f) => f.id));

        // 삭제할 항목
        const toDelete = [...cloudIds].filter((id) => !localIds.has(id));
        if (toDelete.length > 0) {
          await supabase
            .from("user_favorites")
            .delete()
            .eq("user_id", user.id)
            .in("playlist_id", toDelete);
        }

        // upsert
        const toUpsert = favorites.map((f) => ({
          user_id: user.id,
          playlist_id: f.id,
          name: f.name,
          track_count: f.trackCount,
          thumbnail: f.thumbnail ?? null,
          added_at: f.addedAt,
        }));

        if (toUpsert.length > 0) {
          await supabase
            .from("user_favorites")
            .upsert(toUpsert, { onConflict: "user_id,playlist_id" });
        }
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
    mergedRef.current = false;
  }, []);

  // Supabase 미설정 시 noop 반환
  if (!isSupabaseConfigured) {
    return NOOP_RETURN;
  }

  return { user, isLoading, signIn, signOut, syncPreferences, syncFavorites };
}
