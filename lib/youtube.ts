import {
  fetchFullPlaylistMeta,
  extractVideoIdFromPipedUrl,
} from "./piped";

/**
 * YouTube URL에서 재생목록 ID를 추출합니다.
 * 지원 형식:
 * - https://www.youtube.com/playlist?list=PLxxxxxx
 * - https://www.youtube.com/watch?v=xxx&list=PLxxxxxx
 * - https://music.youtube.com/playlist?list=PLxxxxxx
 * - https://youtu.be/xxx?list=PLxxxxxx
 */
export function extractPlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const listParam = parsed.searchParams.get("list");
    if (listParam) return listParam;
  } catch {
    // URL이 아닌 경우 직접 playlist ID로 시도
    if (/^[A-Za-z0-9_-]+$/.test(url.trim())) {
      return url.trim();
    }
  }
  return null;
}

/**
 * 비디오 ID로 YouTube 썸네일 URL을 생성합니다.
 */
export function getThumbnailUrl(
  videoId: string,
  quality: "default" | "mqdefault" | "hqdefault" | "maxresdefault" = "mqdefault"
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

// ─── 트랙 메타데이터 ───

export interface TrackMeta {
  title: string;
  duration?: number;
  uploader?: string;
}

/**
 * Piped API로 재생목록의 모든 곡 메타데이터를 가져옵니다.
 * 실패 시 noembed.com 폴백
 */
export async function fetchAllTrackMeta(
  playlistId: string,
  videoIds: string[],
  existingMeta: Record<string, TrackMeta>,
  onBatchComplete: (meta: Record<string, TrackMeta>) => void,
): Promise<void> {
  // 1차: Piped API — 한번에 전체 가져오기
  try {
    const playlist = await fetchFullPlaylistMeta(playlistId);
    if (playlist && playlist.videos.length > 0) {
      const meta: Record<string, TrackMeta> = {};
      for (const v of playlist.videos) {
        const vid = extractVideoIdFromPipedUrl(v.url);
        if (vid && !existingMeta[vid]) {
          meta[vid] = {
            title: v.title,
            duration: v.duration > 0 ? v.duration : undefined,
            uploader: v.uploaderName || undefined,
          };
        }
      }
      if (Object.keys(meta).length > 0) {
        onBatchComplete(meta);
      }
      return; // 성공 시 폴백 불필요
    }
  } catch {
    // Piped 실패 → 폴백
  }

  // 2차: noembed.com 폴백 (기존 로직)
  await fetchAllVideoTitlesFallback(videoIds, existingMeta, onBatchComplete);
}

/**
 * noembed.com으로 비디오 제목을 가져옵니다. (폴백용)
 */
async function fetchVideoTitleFallback(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.title || null;
  } catch {
    return null;
  }
}

/**
 * noembed.com으로 여러 비디오 제목을 배치로 가져옵니다. (폴백용)
 */
async function fetchAllVideoTitlesFallback(
  videoIds: string[],
  existingMeta: Record<string, TrackMeta>,
  onBatchComplete: (meta: Record<string, TrackMeta>) => void,
  batchSize = 5,
): Promise<void> {
  const uncached = videoIds.filter((id) => !existingMeta[id]);
  if (uncached.length === 0) return;

  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (id) => {
        const title = await fetchVideoTitleFallback(id);
        return [id, title] as const;
      })
    );

    const newMeta: Record<string, TrackMeta> = {};
    for (const [id, title] of results) {
      if (title) newMeta[id] = { title };
    }

    if (Object.keys(newMeta).length > 0) {
      onBatchComplete(newMeta);
    }
  }
}

// ─── 유틸리티 ───

/**
 * 초를 mm:ss 형식으로 변환합니다.
 */
export function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
