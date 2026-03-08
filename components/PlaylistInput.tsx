"use client";

import { useState } from "react";
import { ListVideo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractPlaylistId } from "@/lib/youtube";

interface PlaylistInputProps {
  onLoadPlaylist: (playlistId: string) => void;
  isLoading: boolean;
}

export function PlaylistInput({ onLoadPlaylist, isLoading }: PlaylistInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const playlistId = extractPlaylistId(url.trim());
    if (!playlistId) {
      setError("올바른 YouTube 재생목록 URL을 입력해주세요.");
      return;
    }

    onLoadPlaylist(playlistId);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ListVideo className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="YouTube 재생목록 URL을 붙여넣으세요..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            className="pl-10 h-11"
          />
        </div>
        <Button type="submit" disabled={!url.trim() || isLoading} className="h-11 px-6">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "로드"
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
