"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getThumbnailUrl, fetchAllVideoTitles } from "@/lib/youtube";

export type RepeatMode = "off" | "all" | "one";

export interface TrackInfo {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
}

export interface PlayerState {
  isReady: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  currentTrack: TrackInfo | null;
  currentIndex: number;
  playlist: string[];
  shuffle: boolean;
  repeat: RepeatMode;
  playbackRate: number;
  /** videoId -> title 매핑 (재생된 곡들의 제목 캐시) */
  trackTitles: Record<string, string>;
  /** 현재 로드된 재생목록 ID */
  playlistId: string | null;
  /** 영상/노래 모드 (true=영상, false=노래) */
  videoMode: boolean;
  /** 다음에 재생할 곡 인덱스 큐 */
  queue: number[];
}

const STORAGE_KEY = "ytbg-state";

interface SavedState {
  playlistId: string | null;
  volume: number;
  playbackRate: number;
  trackTitles: Record<string, string>;
  videoMode: boolean;
}

function loadSavedState(): Partial<SavedState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveState(data: SavedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const INITIAL_STATE: PlayerState = {
  isReady: false,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  isMuted: false,
  currentTrack: null,
  currentIndex: -1,
  playlist: [],
  shuffle: false,
  repeat: "off",
  playbackRate: 1,
  trackTitles: {},
  playlistId: null,
  videoMode: false,
  queue: [],
};

export function useYouTubePlayer(containerId: string) {
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // localStorage에서 복원
  const [state, setState] = useState<PlayerState>(() => {
    const saved = loadSavedState();
    return {
      ...INITIAL_STATE,
      volume: saved.volume ?? INITIAL_STATE.volume,
      playbackRate: saved.playbackRate ?? INITIAL_STATE.playbackRate,
      trackTitles: saved.trackTitles ?? {},
      playlistId: saved.playlistId ?? null,
      videoMode: saved.videoMode ?? INITIAL_STATE.videoMode,
    };
  });

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    saveState({
      playlistId: state.playlistId,
      volume: state.volume,
      playbackRate: state.playbackRate,
      trackTitles: state.trackTitles,
      videoMode: state.videoMode,
    });
  }, [state.playlistId, state.volume, state.playbackRate, state.trackTitles, state.videoMode]);

  // 재생목록 로드 시 모든 곡 제목 일괄 가져오기
  const titleFetchRef = useRef<string>("");
  useEffect(() => {
    if (state.playlist.length === 0) return;
    // 동일 재생목록 재요청 방지
    const key = state.playlist.join(",");
    if (titleFetchRef.current === key) return;
    titleFetchRef.current = key;

    let cancelled = false;
    fetchAllVideoTitles(
      state.playlist,
      state.trackTitles,
      (newTitles) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          trackTitles: { ...prev.trackTitles, ...newTitles },
        }));
      }
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.playlist]);

  // YouTube IFrame API 스크립트 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.YT?.Player) return;

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  }, []);

  // 진행률 업데이트 인터벌
  const startProgressInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const currentTime = player.getCurrentTime() || 0;
        const duration = player.getDuration() || 0;
        setState((prev) => ({ ...prev, currentTime, duration }));
      } catch {
        // Player not ready
      }
    }, 500);
  }, []);

  const stopProgressInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 현재 트랙 정보 업데이트 + 제목 캐싱
  const updateTrackInfo = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const data = player.getVideoData();
      if (data?.video_id) {
        const track: TrackInfo = {
          videoId: data.video_id,
          title: data.title || "Unknown",
          author: data.author || "Unknown",
          thumbnail: getThumbnailUrl(data.video_id),
        };
        const playlist = player.getPlaylist() || [];
        const currentIndex = player.getPlaylistIndex() ?? -1;

        setState((prev) => ({
          ...prev,
          currentTrack: track,
          playlist,
          currentIndex,
          // 재생된 곡의 제목을 캐시에 저장
          trackTitles: {
            ...prev.trackTitles,
            [data.video_id]: data.title || "Unknown",
          },
        }));

        // Media Session API
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.author,
            artwork: [
              {
                src: getThumbnailUrl(data.video_id, "hqdefault"),
                sizes: "480x360",
                type: "image/jpeg",
              },
              {
                src: getThumbnailUrl(data.video_id, "mqdefault"),
                sizes: "320x180",
                type: "image/jpeg",
              },
            ],
          });
        }
      }
    } catch {
      // Player not ready
    }
  }, []);

  // 플레이어 생성
  const initPlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const createPlayer = () => {
      playerRef.current = new YT.Player(containerId, {
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setState((prev) => ({ ...prev, isReady: true }));
            if (playerRef.current) {
              playerRef.current.setVolume(state.volume);
            }
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            const playerState = event.data;
            if (playerState === YT.PlayerState.PLAYING) {
              setState((prev) => ({ ...prev, isPlaying: true, isLoading: false }));
              startProgressInterval();
              updateTrackInfo();
              // 저장된 재생속도 적용
              if (playerRef.current) {
                const rate = state.playbackRate;
                if (rate !== 1) {
                  playerRef.current.setPlaybackRate(rate);
                }
              }
            } else if (playerState === YT.PlayerState.PAUSED) {
              setState((prev) => ({ ...prev, isPlaying: false }));
              stopProgressInterval();
            } else if (playerState === YT.PlayerState.ENDED) {
              setState((prev) => {
                if (prev.repeat === "one") {
                  playerRef.current?.seekTo(0, true);
                  playerRef.current?.playVideo();
                  return prev;
                }
                // 큐에 곡이 있으면 큐에서 재생
                if (prev.queue.length > 0) {
                  const nextIndex = prev.queue[0];
                  playerRef.current?.playVideoAt(nextIndex);
                  return { ...prev, queue: prev.queue.slice(1) };
                }
                return { ...prev, isPlaying: false };
              });
            } else if (playerState === YT.PlayerState.BUFFERING) {
              setState((prev) => ({ ...prev, isLoading: true }));
              updateTrackInfo();
            } else if (playerState === YT.PlayerState.CUED) {
              setState((prev) => ({ ...prev, isLoading: false }));
              updateTrackInfo();
            }
          },
          onError: (event: YT.OnErrorEvent) => {
            console.error("YouTube Player Error:", event.data);
            if (playerRef.current) {
              playerRef.current.nextVideo();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, startProgressInterval, stopProgressInterval, updateTrackInfo]);

  // 컴포넌트 마운트 시 플레이어 생성
  useEffect(() => {
    initPlayer();
    return () => {
      stopProgressInterval();
      playerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Media Session API 핸들러 등록
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => {
      playerRef.current?.playVideo();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      playerRef.current?.pauseVideo();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      playerRef.current?.previousVideo();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      playerRef.current?.nextVideo();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) {
        playerRef.current?.seekTo(details.seekTime, true);
      }
    });
  }, []);

  // 재생목록 로드
  const loadPlaylist = useCallback((playlistId: string) => {
    const player = playerRef.current;
    if (!player) return;
    setState((prev) => ({ ...prev, isLoading: true, playlistId }));
    player.loadPlaylist({
      list: playlistId,
      listType: "playlist",
    });
  }, []);

  // 재생/정지
  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const ps = player.getPlayerState();
    if (ps === YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, []);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  // 다음/이전
  const next = useCallback(() => {
    playerRef.current?.nextVideo();
  }, []);

  const previous = useCallback(() => {
    playerRef.current?.previousVideo();
  }, []);

  // 특정 곡으로 이동
  const playAt = useCallback((index: number) => {
    playerRef.current?.playVideoAt(index);
  }, []);

  // 볼륨
  const setVolume = useCallback((vol: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(vol);
    if (vol > 0 && player.isMuted()) {
      player.unMute();
    }
    setState((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setState((prev) => ({ ...prev, isMuted: false }));
    } else {
      player.mute();
      setState((prev) => ({ ...prev, isMuted: true }));
    }
  }, []);

  // 탐색
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setState((prev) => ({ ...prev, currentTime: seconds }));
  }, []);

  // 셔플
  const toggleShuffle = useCallback(() => {
    setState((prev) => {
      const newShuffle = !prev.shuffle;
      playerRef.current?.setShuffle(newShuffle);
      return { ...prev, shuffle: newShuffle };
    });
  }, []);

  // 반복
  const cycleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const currentIdx = modes.indexOf(prev.repeat);
      const nextMode = modes[(currentIdx + 1) % modes.length];
      if (nextMode === "all" || nextMode === "one") {
        playerRef.current?.setLoop(true);
      } else {
        playerRef.current?.setLoop(false);
      }
      return { ...prev, repeat: nextMode };
    });
  }, []);

  // 영상/노래 모드 전환
  const toggleVideoMode = useCallback(() => {
    setState((prev) => ({ ...prev, videoMode: !prev.videoMode }));
  }, []);

  // 큐 관리
  const addToQueue = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, index],
    }));
  }, []);

  const removeFromQueue = useCallback((queueIndex: number) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== queueIndex),
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => ({ ...prev, queue: [] }));
  }, []);

  // 재생 속도
  const setPlaybackRate = useCallback((rate: number) => {
    const player = playerRef.current;
    if (player) {
      player.setPlaybackRate(rate);
    }
    setState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  return {
    state,
    loadPlaylist,
    togglePlay,
    play,
    pause,
    next,
    previous,
    playAt,
    setVolume,
    toggleMute,
    seekTo,
    toggleShuffle,
    cycleRepeat,
    setPlaybackRate,
    toggleVideoMode,
    addToQueue,
    removeFromQueue,
    clearQueue,
  };
}
