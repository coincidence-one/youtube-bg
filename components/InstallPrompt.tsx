"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "ytbg-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(true); // 기본 숨김

  // 이미 설치된 앱인지 체크
  useEffect(() => {
    // standalone이면 이미 설치됨
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // 이전에 닫았으면 숨김
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "true") return;
    } catch {}

    setDismissed(false);

    // iOS Safari 감지
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setShowIOSGuide(true);
    }
  }, []);

  // Android/Chrome: beforeinstallprompt 이벤트
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {}
  }, []);

  // 숨김 조건: 이미 닫았거나, 설치 이벤트 없고 iOS도 아닐 때
  if (dismissed || (!deferredPrompt && !showIOSGuide)) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border shadow-lg">
        <Download className="size-5 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          {deferredPrompt ? (
            <>
              <p className="text-sm font-medium">앱으로 설치하기</p>
              <p className="text-xs text-muted-foreground">
                홈 화면에 추가하면 더 편하게 사용해요
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">홈 화면에 추가</p>
              <p className="text-xs text-muted-foreground">
                공유 버튼 → &quot;홈 화면에 추가&quot;를 눌러주세요
              </p>
            </>
          )}
        </div>
        {deferredPrompt && (
          <Button size="sm" className="shrink-0 h-8 text-xs" onClick={handleInstall}>
            설치
          </Button>
        )}
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground p-1"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
