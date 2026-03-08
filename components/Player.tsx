"use client";

import { cn } from "@/lib/utils";

interface PlayerProps {
  id: string;
  videoMode: boolean;
}

/**
 * YouTube IFrame 플레이어 컨테이너.
 * videoMode=false: 화면 밖에 숨김 (오디오만 재생)
 * videoMode=true: 영상을 보여줌 (16:9 비율)
 */
export function Player({ id, videoMode }: PlayerProps) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        videoMode
          ? "w-full aspect-video rounded-lg bg-black"
          : "fixed -top-[9999px] -left-[9999px] size-[1px]"
      )}
    >
      <div id={id} className="size-full" />
    </div>
  );
}
