"use client";

import { useState } from "react";
import {
  Settings2,
  Gauge,
  Timer,
  TimerOff,
  ShieldCheck,
  ShieldOff,
  Video,
  Music2,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SleepTimerOption, SleepTimerState } from "@/hooks/useSleepTimer";

interface SettingsMenuProps {
  // 재생 속도
  playbackRate: number;
  onRateChange: (rate: number) => void;
  // 슬립 타이머
  timerState: SleepTimerState;
  onSetTimer: (minutes: SleepTimerOption) => void;
  // SponsorBlock
  sponsorBlockEnabled: boolean;
  sponsorBlockSegmentCount: number;
  onToggleSponsorBlock: () => void;
  // 영상 모드
  videoMode: boolean;
  onToggleVideoMode: () => void;
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_OPTIONS: { label: string; value: SleepTimerOption }[] = [
  { label: "15분", value: 15 },
  { label: "30분", value: 30 },
  { label: "45분", value: 45 },
  { label: "1시간", value: 60 },
  { label: "1.5시간", value: 90 },
];

const SHORTCUTS = [
  { keys: "Space", desc: "재생 / 정지" },
  { keys: "←", desc: "5초 뒤로" },
  { keys: "→", desc: "5초 앞으로" },
  { keys: "Shift+←", desc: "이전 곡" },
  { keys: "Shift+→", desc: "다음 곡" },
  { keys: "↑", desc: "볼륨 업" },
  { keys: "↓", desc: "볼륨 다운" },
  { keys: "M", desc: "음소거" },
  { keys: "V", desc: "영상/노래 모드" },
  { keys: "L", desc: "가사" },
  { keys: "S", desc: "검색" },
  { keys: "B", desc: "SponsorBlock" },
];

export function SettingsMenu({
  playbackRate,
  onRateChange,
  timerState,
  onSetTimer,
  sponsorBlockEnabled,
  sponsorBlockSegmentCount,
  onToggleSponsorBlock,
  videoMode,
  onToggleVideoMode,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const hasActiveState = playbackRate !== 1 || timerState.active || !sponsorBlockEnabled || videoMode;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={`size-8 ${hasActiveState ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onClick={() => setOpen(!open)}
        title="설정"
      >
        <Settings2 className="size-4" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 z-50 bg-popover border rounded-lg shadow-lg p-3 min-w-[260px] max-w-[300px]">
            {/* 재생 속도 */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                <Gauge className="size-3.5" />
                재생 속도
              </div>
              <div className="flex flex-wrap gap-1">
                {RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRateChange(r)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors
                      ${r === playbackRate
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                      }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t my-2" />

            {/* 슬립 타이머 */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                {timerState.active ? (
                  <Timer className="size-3.5 text-primary" />
                ) : (
                  <TimerOff className="size-3.5" />
                )}
                슬립 타이머
                {timerState.active && (
                  <span className="text-primary ml-auto">{timerState.remaining}분 남음</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {timerState.active && (
                  <button
                    onClick={() => onSetTimer(0)}
                    className="px-2 py-1 text-xs rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    끄기
                  </button>
                )}
                {SLEEP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSetTimer(opt.value)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors
                      ${timerState.active && timerState.selected === opt.value
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t my-2" />

            {/* SponsorBlock 토글 */}
            <button
              onClick={onToggleSponsorBlock}
              className="w-full flex items-center gap-2.5 px-1 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
            >
              {sponsorBlockEnabled ? (
                <ShieldCheck className="size-4 text-green-500 shrink-0" />
              ) : (
                <ShieldOff className="size-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm flex-1 text-left">SponsorBlock</span>
              {sponsorBlockEnabled && sponsorBlockSegmentCount > 0 && (
                <span className="text-[10px] text-green-500">{sponsorBlockSegmentCount}개 구간</span>
              )}
              <div
                className={`w-8 h-4.5 rounded-full transition-colors relative ${
                  sponsorBlockEnabled ? "bg-green-500" : "bg-muted"
                }`}
              >
                <div
                  className={`absolute top-0.5 size-3.5 rounded-full bg-white shadow transition-transform ${
                    sponsorBlockEnabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>

            {/* 영상 모드 토글 */}
            <button
              onClick={onToggleVideoMode}
              className="w-full flex items-center gap-2.5 px-1 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
            >
              {videoMode ? (
                <Video className="size-4 text-primary shrink-0" />
              ) : (
                <Music2 className="size-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm flex-1 text-left">
                {videoMode ? "영상 모드" : "노래 모드"}
              </span>
              <div
                className={`w-8 h-4.5 rounded-full transition-colors relative ${
                  videoMode ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`absolute top-0.5 size-3.5 rounded-full bg-white shadow transition-transform ${
                    videoMode ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>

            <div className="border-t my-2" />

            {/* 키보드 단축키 */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="w-full flex items-center gap-2.5 px-1 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
            >
              <Keyboard className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 text-left">키보드 단축키</span>
              <span className="text-xs text-muted-foreground">{showShortcuts ? "▲" : "▼"}</span>
            </button>

            {showShortcuts && (
              <div className="mt-1.5 space-y-1 pl-1">
                {SHORTCUTS.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between text-xs gap-3">
                    <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                      {s.keys}
                    </kbd>
                    <span className="text-muted-foreground">{s.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
