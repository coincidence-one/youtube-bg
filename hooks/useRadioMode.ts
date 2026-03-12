"use client";

import { useCallback, useRef, useState } from "react";
import { ytSearch, type SearchResult } from "@/lib/youtube-api";

// ─── 장르 정의 ───

export interface Genre {
  id: string;
  name: string;
  queries: string[];
}

export const GENRES: Genre[] = [
  {
    id: "trot",
    name: "트로트",
    queries: ["트로트 인기곡 모음", "트로트 명곡 메들리", "트로트 최신 인기곡"],
  },
  {
    id: "ballad",
    name: "발라드",
    queries: ["한국 발라드 명곡 모음", "감성 발라드 플레이리스트", "발라드 인기곡 모음"],
  },
  {
    id: "7080",
    name: "7080 가요",
    queries: ["7080 가요 모음", "추억의 가요 명곡", "7080 히트곡 메들리"],
  },
  {
    id: "oldpop",
    name: "올드팝",
    queries: ["올드팝 명곡 모음", "80s 90s pop hits", "추억의 팝송 메들리"],
  },
  {
    id: "latest",
    name: "최신 가요",
    queries: ["최신 가요 인기차트 2025", "2025 인기곡 모음", "신곡 모음 플레이리스트"],
  },
  {
    id: "classic",
    name: "클래식",
    queries: ["클래식 명곡 모음", "편안한 클래식 피아노", "클래식 음악 연주"],
  },
  {
    id: "jazz",
    name: "재즈",
    queries: ["재즈 명곡 카페", "보사노바 재즈", "smooth jazz playlist"],
  },
  {
    id: "ccm",
    name: "CCM/찬송가",
    queries: ["CCM 모음 은혜", "찬송가 연주 모음", "은혜로운 찬양 모음"],
  },
];

// ─── 라디오 상태 ───

export interface RadioState {
  active: boolean;
  genreId: string | null;
  genreName: string | null;
  loadedCount: number;
  isLoadingMore: boolean;
}

export interface UseRadioModeReturn {
  radioState: RadioState;
  startRadio: (genreId: string) => Promise<void>;
  stopRadio: () => void;
  checkAndLoadMore: (currentIndex: number, playlistLength: number) => void;
}

// ─── 훅 ───

export function useRadioMode(
  addExternalTrack: (
    videoId: string,
    meta: { title: string; duration?: number; uploader?: string },
    playNow?: boolean
  ) => void,
  toggleShuffle: () => void,
  shuffleState: boolean
): UseRadioModeReturn {
  const [radioState, setRadioState] = useState<RadioState>({
    active: false,
    genreId: null,
    genreName: null,
    loadedCount: 0,
    isLoadingMore: false,
  });

  const queryIndexRef = useRef(0);
  const loadedVideoIdsRef = useRef(new Set<string>());
  const genreRef = useRef<Genre | null>(null);
  const isLoadingRef = useRef(false);

  /** 검색 결과를 트랙으로 추가 (중복 제거) */
  const addTracksFromResults = useCallback(
    (results: SearchResult[], playFirst: boolean) => {
      let firstPlayed = false;
      let addedCount = 0;

      for (const result of results) {
        if (result.type !== "stream") continue;
        if (loadedVideoIdsRef.current.has(result.id)) continue;

        loadedVideoIdsRef.current.add(result.id);
        addExternalTrack(
          result.id,
          {
            title: result.title,
            duration: result.duration,
            uploader: result.uploaderName,
          },
          playFirst && !firstPlayed
        );
        if (!firstPlayed) firstPlayed = true;
        addedCount++;
      }

      return addedCount;
    },
    [addExternalTrack]
  );

  /** 다음 쿼리로 곡 더 로드 */
  const loadMoreTracks = useCallback(async () => {
    const genre = genreRef.current;
    if (!genre || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setRadioState((prev) => ({ ...prev, isLoadingMore: true }));

    try {
      const queryIdx = queryIndexRef.current % genre.queries.length;
      const query = genre.queries[queryIdx];
      queryIndexRef.current++;

      const results = await ytSearch(query, "music", 30);
      const added = addTracksFromResults(results, false);

      setRadioState((prev) => ({
        ...prev,
        loadedCount: prev.loadedCount + added,
        isLoadingMore: false,
      }));
    } catch (e) {
      console.warn("Radio: failed to load more tracks:", e);
      setRadioState((prev) => ({ ...prev, isLoadingMore: false }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [addTracksFromResults]);

  /** 라디오 시작 */
  const startRadio = useCallback(
    async (genreId: string) => {
      const genre = GENRES.find((g) => g.id === genreId);
      if (!genre) return;

      // 상태 초기화
      genreRef.current = genre;
      queryIndexRef.current = 0;
      loadedVideoIdsRef.current = new Set();
      isLoadingRef.current = true;

      setRadioState({
        active: true,
        genreId: genre.id,
        genreName: genre.name,
        loadedCount: 0,
        isLoadingMore: true,
      });

      try {
        // 첫 배치 로드
        const query = genre.queries[0];
        queryIndexRef.current = 1;
        const results = await ytSearch(query, "music", 30);
        const added = addTracksFromResults(results, true);

        // 셔플 ON
        if (!shuffleState) {
          toggleShuffle();
        }

        setRadioState((prev) => ({
          ...prev,
          loadedCount: added,
          isLoadingMore: false,
        }));
      } catch (e) {
        console.warn("Radio: failed to start:", e);
        setRadioState((prev) => ({ ...prev, isLoadingMore: false }));
      } finally {
        isLoadingRef.current = false;
      }
    },
    [addTracksFromResults, toggleShuffle, shuffleState]
  );

  /** 라디오 중지 (재생은 유지) */
  const stopRadio = useCallback(() => {
    genreRef.current = null;
    loadedVideoIdsRef.current = new Set();
    queryIndexRef.current = 0;
    setRadioState({
      active: false,
      genreId: null,
      genreName: null,
      loadedCount: 0,
      isLoadingMore: false,
    });
  }, []);

  /** 현재 인덱스 체크 → 곡이 얼마 안 남으면 자동 추가 로드 */
  const checkAndLoadMore = useCallback(
    (currentIndex: number, playlistLength: number) => {
      if (!radioState.active) return;
      if (isLoadingRef.current) return;

      // 남은 곡이 5곡 이하면 추가 로드
      const remaining = playlistLength - currentIndex - 1;
      if (remaining <= 5) {
        loadMoreTracks();
      }
    },
    [radioState.active, loadMoreTracks]
  );

  return {
    radioState,
    startRadio,
    stopRadio,
    checkAndLoadMore,
  };
}
