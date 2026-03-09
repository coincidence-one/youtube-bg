/**
 * Return YouTube Dislike API 클라이언트
 * https://returnyoutubedislikeapi.com
 */

export interface VideoVotes {
  likes: number;
  dislikes: number;
  viewCount: number;
  rating: number;
}

/**
 * 비디오의 좋아요/싫어요 수를 가져옴
 */
export async function fetchVideoVotes(videoId: string): Promise<VideoVotes | null> {
  try {
    const res = await fetch(
      `https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      likes: data.likes ?? 0,
      dislikes: data.dislikes ?? 0,
      viewCount: data.viewCount ?? 0,
      rating: data.rating ?? 0,
    };
  } catch {
    return null;
  }
}
