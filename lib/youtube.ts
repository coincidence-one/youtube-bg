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

/**
 * YouTube noembed API로 비디오 제목을 가져옵니다.
 * (oEmbed 래퍼, CORS 허용)
 */
export async function fetchVideoTitle(videoId: string): Promise<string | null> {
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
 * 여러 비디오의 제목을 병렬로 가져옵니다.
 * 이미 캐시된 것은 건너뜁니다.
 * rate limit 방지를 위해 배치 크기를 제한합니다.
 */
export async function fetchAllVideoTitles(
  videoIds: string[],
  existingTitles: Record<string, string>,
  onBatchComplete: (titles: Record<string, string>) => void,
  batchSize = 5,
): Promise<void> {
  const uncached = videoIds.filter((id) => !existingTitles[id]);
  if (uncached.length === 0) return;

  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (id) => {
        const title = await fetchVideoTitle(id);
        return [id, title] as const;
      })
    );

    const newTitles: Record<string, string> = {};
    for (const [id, title] of results) {
      if (title) newTitles[id] = title;
    }

    if (Object.keys(newTitles).length > 0) {
      onBatchComplete(newTitles);
    }
  }
}

/**
 * 초를 mm:ss 형식으로 변환합니다.
 */
export function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
