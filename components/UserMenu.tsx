"use client";

import { useState, useEffect } from "react";
import { UserCircle, LogOut, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

interface UserMenuProps {
  user: User | null;
  isLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function UserMenu({ user, isLoading, onSignIn, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || isLoading) {
    return <Button variant="ghost" size="icon" className="size-8" />;
  }

  // 비로그인 — 로그인 버튼
  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={onSignIn}
        title="Google로 로그인"
      >
        <UserCircle className="size-4" />
      </Button>
    );
  }

  // 로그인 — 아바타 + 드롭다운
  const avatarUrl = user.user_metadata?.avatar_url;
  const email = user.email ?? "";
  const name = user.user_metadata?.full_name ?? email.split("@")[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="size-8 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors flex items-center justify-center"
        title={name}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-8 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <UserCircle className="size-5 text-primary" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 z-50 bg-popover border rounded-lg shadow-lg p-3 min-w-[220px]">
            {/* 사용자 정보 */}
            <div className="flex items-center gap-3 mb-3 pb-3 border-b">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle className="size-6 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{email}</p>
              </div>
            </div>

            {/* 동기화 상태 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Cloud className="size-3.5 text-green-500" />
              <span>클라우드 동기화 활성</span>
            </div>

            {/* 로그아웃 */}
            <button
              onClick={() => {
                onSignOut();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="size-3.5" />
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
