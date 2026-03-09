/**
 * SponsorBlock API 클라이언트
 * 스폰서/인트로/아웃트로 등의 구간 정보를 가져옴
 * https://sponsor.ajay.app
 */

export interface SponsorSegment {
  segment: [number, number]; // [startTime, endTime]
  category: string;
  UUID: string;
}

export type SponsorCategory =
  | "sponsor"
  | "selfpromo"
  | "interaction"
  | "intro"
  | "outro"
  | "preview"
  | "music_offtopic"
  | "filler";

export const CATEGORY_INFO: Record<SponsorCategory, { color: string; label: string }> = {
  sponsor: { color: "#00d400", label: "광고" },
  selfpromo: { color: "#ffff00", label: "자체 홍보" },
  interaction: { color: "#cc00ff", label: "구독/좋아요 알림" },
  intro: { color: "#00ffff", label: "인트로" },
  outro: { color: "#0202ed", label: "아웃트로" },
  preview: { color: "#008fd6", label: "미리보기" },
  music_offtopic: { color: "#ff9900", label: "음악 외 구간" },
  filler: { color: "#7300FF", label: "불필요 구간" },
};

export const DEFAULT_CATEGORIES: SponsorCategory[] = [
  "sponsor",
  "selfpromo",
  "interaction",
  "intro",
  "outro",
];

/**
 * 비디오의 SponsorBlock 세그먼트를 가져옴
 */
export async function fetchSkipSegments(
  videoId: string,
  categories: string[] = DEFAULT_CATEGORIES
): Promise<SponsorSegment[]> {
  try {
    const cats = JSON.stringify(categories);
    const res = await fetch(
      `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=${encodeURIComponent(cats)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.status === 404) return []; // 이 영상에 세그먼트 없음
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
