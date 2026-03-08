/**
 * 가사 검색 (lrclib.net API)
 * - 싱크 가사(LRC) + 일반 가사 지원
 * - CORS 허용
 */

interface LyricsResult {
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export async function fetchLyrics(
  title: string,
  artist: string
): Promise<LyricsResult | null> {
  try {
    // YouTube 제목에서 불필요한 접미사 정리
    const cleanTitle = title
      .replace(/\s*\(.*?(official|music|video|lyric|audio|mv|hd|4k|visualizer|live).*?\)/gi, "")
      .replace(/\s*\[.*?(official|music|video|lyric|audio|mv|hd|4k|visualizer|live).*?\]/gi, "")
      .replace(/\s*[-|].*?(official|music|video|lyric|audio|mv|visualizer).*$/gi, "")
      .replace(/\s*ft\.?\s*.*/gi, "")
      .replace(/\s*feat\.?\s*.*/gi, "")
      .trim();

    const cleanArtist = artist
      .replace(/\s*-\s*Topic$/i, "")
      .replace(/VEVO$/i, "")
      .trim();

    const params = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: cleanArtist,
    });

    const res = await fetch(`https://lrclib.net/api/search?${params}`, {
      headers: { "User-Agent": "YTBG Player v1.0" },
    });
    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    // 첫 번째 결과 사용
    return {
      plainLyrics: results[0].plainLyrics || null,
      syncedLyrics: results[0].syncedLyrics || null,
    };
  } catch {
    return null;
  }
}

/**
 * LRC 싱크 가사를 파싱합니다.
 * 형식: [mm:ss.xx] 가사 텍스트
 */
export interface SyncedLine {
  time: number; // 초 단위
  text: string;
}

export function parseSyncedLyrics(synced: string): SyncedLine[] {
  const lines: SyncedLine[] = [];
  for (const line of synced.split("\n")) {
    const match = line.match(/^\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const hundredths = parseInt(match[3]);
      const time = minutes * 60 + seconds + hundredths / 100;
      const text = match[4].trim();
      if (text) {
        lines.push({ time, text });
      }
    }
  }
  return lines;
}
