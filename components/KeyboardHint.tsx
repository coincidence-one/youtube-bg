"use client";

import { useState } from "react";
import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHORTCUTS = [
  { keys: "Space", desc: "재생 / 정지" },
  { keys: "←", desc: "5초 뒤로" },
  { keys: "→", desc: "5초 앞으로" },
  { keys: "Shift + ←", desc: "이전 곡" },
  { keys: "Shift + →", desc: "다음 곡" },
  { keys: "↑", desc: "볼륨 업" },
  { keys: "↓", desc: "볼륨 다운" },
  { keys: "M", desc: "음소거 토글" },
  { keys: "V", desc: "영상/노래 모드 전환" },
  { keys: "L", desc: "가사 표시 토글" },
];

export function KeyboardHint() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        <Keyboard className="size-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 z-50 bg-popover border rounded-lg shadow-lg p-3 min-w-[200px]">
            <p className="text-xs font-semibold mb-2">키보드 단축키</p>
            <div className="space-y-1.5">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="flex items-center justify-between text-xs gap-4">
                  <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                    {s.keys}
                  </kbd>
                  <span className="text-muted-foreground">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
