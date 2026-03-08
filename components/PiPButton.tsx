"use client";

import { useCallback, useRef, useState } from "react";
import { PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrackInfo } from "@/hooks/useYouTubePlayer";

interface PiPButtonProps {
  track: TrackInfo | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Document Picture-in-Picture API를 사용한 미니 플레이어.
 * Chrome 116+ 지원. 지원하지 않는 브라우저에서는 버튼이 숨겨집니다.
 */
export function PiPButton({
  track,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
}: PiPButtonProps) {
  const [isPiP, setIsPiP] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported =
    typeof window !== "undefined" && "documentPictureInPicture" in window;

  // PiP 창 내부 UI 업데이트
  const updatePiPContent = useCallback(
    (doc: Document) => {
      if (!track) return;
      const titleEl = doc.getElementById("pip-title");
      const artistEl = doc.getElementById("pip-artist");
      const thumbEl = doc.getElementById("pip-thumb") as HTMLImageElement | null;
      const playBtn = doc.getElementById("pip-play");

      if (titleEl) titleEl.textContent = track.title;
      if (artistEl) artistEl.textContent = track.author;
      if (thumbEl) thumbEl.src = track.thumbnail;
      if (playBtn) playBtn.textContent = isPlaying ? "⏸" : "▶";
    },
    [track, isPlaying]
  );

  // PiP 열기/닫기
  const togglePiP = useCallback(async () => {
    if (!isSupported) return;

    if (isPiP && pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      setIsPiP(false);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      return;
    }

    try {
      // @ts-expect-error Document PiP API
      const pipWindow: Window = await window.documentPictureInPicture.requestWindow({
        width: 360,
        height: 200,
      });
      pipWindowRef.current = pipWindow;

      const doc = pipWindow.document;

      // 스타일
      const style = doc.createElement("style");
      style.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: #09090b;
          color: #fafafa;
          overflow: hidden;
        }
        .container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 16px;
          gap: 12px;
        }
        .track-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-height: 0;
        }
        .thumb {
          width: 80px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
          background: #27272a;
          flex-shrink: 0;
        }
        .info {
          flex: 1;
          min-width: 0;
        }
        .title {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        .artist {
          font-size: 12px;
          color: #a1a1aa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          padding-bottom: 4px;
        }
        .btn {
          background: none;
          border: none;
          color: #fafafa;
          cursor: pointer;
          font-size: 18px;
          padding: 8px;
          border-radius: 50%;
          line-height: 1;
          transition: background 0.15s;
        }
        .btn:hover { background: rgba(255,255,255,0.1); }
        .btn-play {
          background: #a78bfa;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .btn-play:hover { background: #8b5cf6; }
      `;
      doc.head.appendChild(style);

      // HTML
      const container = doc.createElement("div");
      container.className = "container";
      container.innerHTML = `
        <div class="track-info">
          <img id="pip-thumb" class="thumb" src="${track?.thumbnail ?? ""}" alt="" />
          <div class="info">
            <div id="pip-title" class="title">${track?.title ?? ""}</div>
            <div id="pip-artist" class="artist">${track?.author ?? ""}</div>
          </div>
        </div>
        <div class="controls">
          <button class="btn" id="pip-prev">⏮</button>
          <button class="btn btn-play" id="pip-play">${isPlaying ? "⏸" : "▶"}</button>
          <button class="btn" id="pip-next">⏭</button>
        </div>
      `;
      doc.body.appendChild(container);

      // 이벤트 연결
      doc.getElementById("pip-prev")?.addEventListener("click", onPrevious);
      doc.getElementById("pip-play")?.addEventListener("click", onTogglePlay);
      doc.getElementById("pip-next")?.addEventListener("click", onNext);

      setIsPiP(true);

      pipWindow.addEventListener("pagehide", () => {
        setIsPiP(false);
        pipWindowRef.current = null;
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      });
    } catch (err) {
      console.error("PiP error:", err);
    }
  }, [isSupported, isPiP, track, isPlaying, onTogglePlay, onNext, onPrevious]);

  // PiP 내용 실시간 업데이트
  const pipDoc = pipWindowRef.current?.document;
  if (pipDoc) {
    updatePiPContent(pipDoc);
  }

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`size-8 ${isPiP ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
      onClick={togglePiP}
      title={isPiP ? "PiP 닫기" : "미니 플레이어 (PiP)"}
    >
      <PictureInPicture2 className="size-4" />
    </Button>
  );
}
