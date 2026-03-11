/**
 * YouTube Data API v3 + Piped API 하이브리드 클라이언트
 * - API 키가 있으면 YouTube Data API v3 우선 사용
 * - 없거나 실패 시 Piped API 폴백
 */

import {
  searchVideos as pipedSearch,
  fetchSuggestions as pipedSuggestions,
  type PipedSearchResult,
} from "./piped";

// ─── 설정 ───

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YT_BASE = "https://www.googleapis.com/youtube/v3";

export const isYouTubeApiConfigured = Boolean(YT_API_KEY);

// ─── 공통 타입 ───

export interface SearchResult {
  id: string; // videoId or playlistId or channelId
  url: string;
  title: string;
  uploaderName: string;
  uploaderUrl: string;
  duration: number; // seconds (0 for non-video)
  views: number;
  thumbnail: string;
  type: "stream" | "channel" | "playlist";
  videos?: number; // playlist일 때 곡 수
}

export interface VideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: number;
  viewCount: number;
  publishedAt: string;
}

export interface PlaylistItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  position: number;
}

export interface PlaylistInfo {
  playlistId: string;
  title: string;
  thumbnail: string;
  itemCount: number;
  channelTitle: string;
}

// ─── 내부 헬퍼 ───

async function ytFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  if (!YT_API_KEY) throw new Error("No YouTube API key");
  const qs = new URLSearchParams({ ...params, key: YT_API_KEY });
  const res = await fetch(`${YT_BASE}/${endpoint}?${qs}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`YouTube API ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

/** ISO 8601 duration (PT1H2M3S) → 초 변환 */
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || "0") * 3600) +
    (parseInt(m[2] || "0") * 60) +
    (parseInt(m[3] || "0"));
}

// ─── 검색 ───

interface YTSearchItem {
  id: { kind: string; videoId?: string; playlistId?: string; channelId?: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
    channelId: string;
    liveBroadcastContent: string;
  };
}

interface YTSearchResponse {
  items: YTSearchItem[];
  pageInfo: { totalResults: number };
}

type SearchFilter = "all" | "music" | "playlist" | "channel";

const FILTER_MAP: Record<SearchFilter, { type?: string; videoCategoryId?: string; filter?: string }> = {
  all: {},
  music: { type: "video", videoCategoryId: "10" },
  playlist: { type: "playlist" },
  channel: { type: "channel" },
};

export async function ytSearch(
  query: string,
  filter: SearchFilter = "all",
  maxResults = 20
): Promise<SearchResult[]> {
  // YouTube API v3 시도
  if (isYouTubeApiConfigured) {
    try {
      const filterOpts = FILTER_MAP[filter];
      const params: Record<string, string> = {
        part: "snippet",
        q: query,
        maxResults: String(maxResults),
        regionCode: "KR",
        relevanceLanguage: "ko",
      };
      if (filterOpts.type) params.type = filterOpts.type;
      if (filterOpts.videoCategoryId) params.videoCategoryId = filterOpts.videoCategoryId;

      const data = await ytFetch<YTSearchResponse>("search", params);

      // 비디오 결과에 duration 정보 추가
      const videoIds = data.items
        .filter((i) => i.id.videoId)
        .map((i) => i.id.videoId!);

      let durationMap = new Map<string, number>();
      let viewMap = new Map<string, number>();
      if (videoIds.length > 0) {
        const details = await ytVideoDetails(videoIds);
        durationMap = new Map(details.map((d) => [d.videoId, d.duration]));
        viewMap = new Map(details.map((d) => [d.videoId, d.viewCount]));
      }

      return data.items
        .filter((i) => i.snippet.liveBroadcastContent === "none" || !i.id.videoId)
        .map((item): SearchResult => {
          const vid = item.id.videoId;
          const pid = item.id.playlistId;
          const cid = item.id.channelId;
          const thumb = item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "";

          if (vid) {
            return {
              id: vid,
              url: `/watch?v=${vid}`,
              title: decodeHtmlEntities(item.snippet.title),
              uploaderName: item.snippet.channelTitle,
              uploaderUrl: `/channel/${item.snippet.channelId}`,
              duration: durationMap.get(vid) ?? 0,
              views: viewMap.get(vid) ?? 0,
              thumbnail: thumb,
              type: "stream",
            };
          } else if (pid) {
            return {
              id: pid,
              url: `/playlist?list=${pid}`,
              title: decodeHtmlEntities(item.snippet.title),
              uploaderName: item.snippet.channelTitle,
              uploaderUrl: `/channel/${item.snippet.channelId}`,
              duration: 0,
              views: 0,
              thumbnail: thumb,
              type: "playlist",
            };
          } else {
            return {
              id: cid ?? "",
              url: `/channel/${cid}`,
              title: decodeHtmlEntities(item.snippet.title),
              uploaderName: item.snippet.channelTitle,
              uploaderUrl: `/channel/${cid}`,
              duration: 0,
              views: 0,
              thumbnail: thumb,
              type: "channel",
            };
          }
        });
    } catch (e) {
      console.warn("YouTube API search failed, falling back to Piped:", e);
    }
  }

  // Piped 폴백
  const pipedFilter = filter === "music" ? "music_songs" : filter === "playlist" ? "playlists" : "all";
  const pipedResults = await pipedSearch(query, pipedFilter);
  return pipedResults.map(pipedToSearchResult);
}

// ─── 인기 음악 (트렌딩) ───

interface YTVideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
    publishedAt: string;
  };
  contentDetails: { duration: string };
  statistics: { viewCount: string };
}

interface YTVideoListResponse {
  items: YTVideoItem[];
}

export async function ytTrendingMusic(regionCode = "KR", maxResults = 20): Promise<VideoItem[]> {
  if (!isYouTubeApiConfigured) return [];

  try {
    const data = await ytFetch<YTVideoListResponse>("videos", {
      part: "snippet,contentDetails,statistics",
      chart: "mostPopular",
      videoCategoryId: "10",
      regionCode,
      maxResults: String(maxResults),
    });

    return data.items.map((item) => ({
      videoId: item.id,
      title: decodeHtmlEntities(item.snippet.title),
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
      duration: parseDuration(item.contentDetails.duration),
      viewCount: parseInt(item.statistics.viewCount || "0"),
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (e) {
    console.warn("YouTube trending failed:", e);
    return [];
  }
}

// ─── 비디오 상세 ───

export async function ytVideoDetails(videoIds: string[]): Promise<VideoItem[]> {
  if (!isYouTubeApiConfigured || videoIds.length === 0) return [];

  // API는 최대 50개씩
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const results: VideoItem[] = [];
  for (const chunk of chunks) {
    try {
      const data = await ytFetch<YTVideoListResponse>("videos", {
        part: "snippet,contentDetails,statistics",
        id: chunk.join(","),
      });
      results.push(
        ...data.items.map((item) => ({
          videoId: item.id,
          title: decodeHtmlEntities(item.snippet.title),
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
          duration: parseDuration(item.contentDetails.duration),
          viewCount: parseInt(item.statistics.viewCount || "0"),
          publishedAt: item.snippet.publishedAt,
        }))
      );
    } catch (e) {
      console.warn("YouTube video details failed:", e);
    }
  }

  return results;
}

// ─── 재생목록 아이템 ───

interface YTPlaylistItemSnippet {
  title: string;
  channelTitle: string;
  thumbnails: { medium?: { url: string }; default?: { url: string } };
  resourceId: { videoId: string };
  position: number;
}

interface YTPlaylistItemsResponse {
  items: Array<{ snippet: YTPlaylistItemSnippet }>;
  nextPageToken?: string;
}

export async function ytPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
  if (!isYouTubeApiConfigured) return [];

  const allItems: PlaylistItem[] = [];
  let pageToken = "";

  // 최대 10페이지 (500곡)
  for (let page = 0; page < 10; page++) {
    try {
      const params: Record<string, string> = {
        part: "snippet",
        playlistId,
        maxResults: "50",
      };
      if (pageToken) params.pageToken = pageToken;

      const data = await ytFetch<YTPlaylistItemsResponse>("playlistItems", params);
      allItems.push(
        ...data.items.map((item) => ({
          videoId: item.snippet.resourceId.videoId,
          title: decodeHtmlEntities(item.snippet.title),
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
          position: item.snippet.position,
        }))
      );

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    } catch (e) {
      console.warn("YouTube playlist items failed:", e);
      break;
    }
  }

  return allItems;
}

// ─── 채널 재생목록 ───

interface YTPlaylistSnippet {
  title: string;
  channelTitle: string;
  thumbnails: { medium?: { url: string }; default?: { url: string } };
}

interface YTPlaylistsResponse {
  items: Array<{
    id: string;
    snippet: YTPlaylistSnippet;
    contentDetails: { itemCount: number };
  }>;
}

export async function ytChannelPlaylists(channelId: string): Promise<PlaylistInfo[]> {
  if (!isYouTubeApiConfigured) return [];

  try {
    const data = await ytFetch<YTPlaylistsResponse>("playlists", {
      part: "snippet,contentDetails",
      channelId,
      maxResults: "25",
    });

    return data.items.map((item) => ({
      playlistId: item.id,
      title: decodeHtmlEntities(item.snippet.title),
      thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
      itemCount: item.contentDetails.itemCount,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (e) {
    console.warn("YouTube channel playlists failed:", e);
    return [];
  }
}

// ─── 자동완성 (Piped 전용 — YouTube API에 없음) ───

export async function ytSuggestions(query: string): Promise<string[]> {
  return pipedSuggestions(query);
}

// ─── 유틸리티 ───

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Piped 결과 → 통합 SearchResult 변환 */
function pipedToSearchResult(p: PipedSearchResult): SearchResult {
  const videoIdMatch = p.url.match(/[?&]v=([^&]+)/);
  const playlistIdMatch = p.url.match(/list=([^&]+)/);

  return {
    id: videoIdMatch?.[1] ?? playlistIdMatch?.[1] ?? p.url,
    url: p.url,
    title: p.title,
    uploaderName: p.uploaderName,
    uploaderUrl: p.uploaderUrl,
    duration: p.duration,
    views: p.views,
    thumbnail: p.thumbnail,
    type: p.type,
    videos: p.videos,
  };
}
