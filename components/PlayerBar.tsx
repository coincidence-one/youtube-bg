"use client";

import { TrackInfo } from "./TrackInfo";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";
import type { PlayerState, RepeatMode } from "@/hooks/useYouTubePlayer";
import type { TrackInfo as TrackInfoType } from "@/hooks/useYouTubePlayer";

interface PlayerBarProps {
  state: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export function PlayerBar({
  state,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onSeek,
  onVolumeChange,
  onToggleMute,
}: PlayerBarProps) {
  const hasTrack = state.currentTrack !== null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      {/* 모바일: 간단한 프로그레스 인디케이터 */}
      {hasTrack && (
        <div className="block md:hidden h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: state.duration > 0 ? `${(state.currentTime / state.duration) * 100}%` : "0%",
            }}
          />
        </div>
      )}

      <div className="mx-auto max-w-screen-2xl px-4 py-2 md:py-3">
        {/* 데스크탑/태블릿 레이아웃 */}
        <div className="hidden md:grid md:grid-cols-[1fr_2fr_1fr] items-center gap-4">
          <TrackInfo track={state.currentTrack} />

          <div className="flex flex-col items-center gap-1">
            <PlayerControls
              isPlaying={state.isPlaying}
              shuffle={state.shuffle}
              repeat={state.repeat}
              hasTrack={hasTrack}
              onTogglePlay={onTogglePlay}
              onNext={onNext}
              onPrevious={onPrevious}
              onToggleShuffle={onToggleShuffle}
              onCycleRepeat={onCycleRepeat}
            />
            <ProgressBar
              currentTime={state.currentTime}
              duration={state.duration}
              onSeek={onSeek}
              className="max-w-md"
            />
          </div>

          <div className="flex justify-end">
            <VolumeControl
              volume={state.volume}
              isMuted={state.isMuted}
              onVolumeChange={onVolumeChange}
              onToggleMute={onToggleMute}
            />
          </div>
        </div>

        {/* 모바일 레이아웃 */}
        <div className="flex md:hidden items-center gap-3">
          <TrackInfo track={state.currentTrack} className="flex-1 min-w-0" />
          <PlayerControls
            isPlaying={state.isPlaying}
            shuffle={state.shuffle}
            repeat={state.repeat}
            hasTrack={hasTrack}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onPrevious={onPrevious}
            onToggleShuffle={onToggleShuffle}
            onCycleRepeat={onCycleRepeat}
          />
        </div>
      </div>
    </div>
  );
}
