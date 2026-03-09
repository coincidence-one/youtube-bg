/**
 * Piped API 클라이언트
 * YouTube Data API 없이 메타데이터, 검색, 자동완성을 제공
 * 인스턴스 다운 시 자동 폴백
 */

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.in.projectsegfau.lt",
  "https://api.piped.projectsegfau.lt",
];

let workingInstance: string | null = null;

/**
 * Piped API fetch 래퍼 — 인스턴스 폴백 포함
 */
async function pipedFetch<T>(path: string): Promise<T | null> {
  // 작동 중인 인스턴스가 있으면 먼저 시도
  const instances = workingInstance
    ? [workingInstance, ...PIPED_INSTANCES.filter((i) => i !== workingInstance)]
    : [...PIPED_INSTANCES];

  for (const instance of instances) {
    try {
      const res = await fetch(`${instance}${path}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      workingInstance = instance;
      return data as T;
    } catch {
      continue;
    }
  }
  return null;
}

/** 인스턴스 초기화 (재시도용) */
export function resetInstance() {
  workingInstance = null;
}

// ─── 비디오 상세 ───

export interface PipedStream {
  title: string;
  description: string;
  uploader: string;
  uploaderUrl: string;
  duration: number;
  views: number;
  likes: number;
  dislikes: number;
  thumbnailUrl: string;
  subtitles: Array<{ url: string; mimeType: string; name: string; code: string }>;
}

export async function fetchVideoDetails(videoId: string): Promise<PipedStream | null> {
  return pipedFetch<PipedStream>(`/streams/${videoId}`);
}

// ─── 재생목록 ───

export interface PipedPlaylistVideo {
  url: string; // "/watch?v=xxx"
  title: string;
  uploaderName: string;
  duration: number;
  thumbnail: string;
}

export interface PipedPlaylist {
  name: string;
  uploader: string;
  thumbnailUrl: string;
  videos: number;
  relatedStreams: PipedPlaylistVideo[];
  nextpage: string | null;
}

export async function fetchPlaylistDetails(playlistId: string): Promise<PipedPlaylist | null> {
  return pipedFetch<PipedPlaylist>(`/playlists/${playlistId}`);
}

export async function fetchPlaylistNextPage(
  playlistId: string,
  nextpage: string
): Promise<{ relatedStreams: PipedPlaylistVideo[]; nextpage: string | null } | null> {
  return pipedFetch(`/nextpage/playlists/${playlistId}?nextpage=${encodeURIComponent(nextpage)}`);
}

/**
 * 재생목록의 모든 곡 메타데이터를 가져옴 (페이지네이션 포함)
 */
export async function fetchFullPlaylistMeta(
  playlistId: string
): Promise<{ name: string; uploader: string; videos: PipedPlaylistVideo[] } | null> {
  const first = await fetchPlaylistDetails(playlistId);
  if (!first) return null;

  const allVideos = [...first.relatedStreams];
  let nextpage = first.nextpage;

  // 페이지네이션 — 최대 10페이지 (약 1000곡)
  let pages = 0;
  while (nextpage && pages < 10) {
    const page = await fetchPlaylistNextPage(playlistId, nextpage);
    if (!page) break;
    allVideos.push(...page.relatedStreams);
    nextpage = page.nextpage;
    pages++;
  }

  return { name: first.name, uploader: first.uploader, videos: allVideos };
}

// ─── 검색 ───

export interface PipedSearchResult {
  url: string;
  title: string;
  uploaderName: string;
  uploaderUrl: string;
  duration: number;
  views: number;
  thumbnail: string;
  type: "stream" | "channel" | "playlist";
  videos?: number; // playlist일 때 곡 수
}

export async function searchVideos(
  query: string,
  filter: string = "music_songs"
): Promise<PipedSearchResult[]> {
  const data = await pipedFetch<{ items: PipedSearchResult[] }>(
    `/search?q=${encodeURIComponent(query)}&filter=${filter}`
  );
  return data?.items ?? [];
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  const data = await pipedFetch<string[]>(
    `/suggestions?query=${encodeURIComponent(query)}`
  );
  return data ?? [];
}

// ─── 헬퍼 ───

/** Piped URL (/watch?v=xxx)에서 videoId 추출 */
export function extractVideoIdFromPipedUrl(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/);
  return match?.[1] ?? null;
}
