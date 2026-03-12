"use client";

import {
  Loader2,
  Mic2,
  Music,
  Radio,
  Globe,
  Flame,
  Music3,
  Disc3,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { GENRES } from "@/hooks/useRadioMode";

// 장르 ID → 아이콘 + 색상 매핑
const GENRE_ICONS: Record<string, { Icon: LucideIcon; bg: string; color: string }> = {
  trot:    { Icon: Mic2,    bg: "bg-rose-500/10",   color: "text-rose-500" },
  ballad:  { Icon: Music,   bg: "bg-blue-500/10",   color: "text-blue-500" },
  "7080":  { Icon: Radio,   bg: "bg-amber-500/10",  color: "text-amber-500" },
  oldpop:  { Icon: Globe,   bg: "bg-emerald-500/10",color: "text-emerald-500" },
  latest:  { Icon: Flame,   bg: "bg-red-500/10",    color: "text-red-500" },
  classic: { Icon: Music3,  bg: "bg-violet-500/10", color: "text-violet-500" },
  jazz:    { Icon: Disc3,   bg: "bg-yellow-500/10", color: "text-yellow-600" },
  ccm:     { Icon: Heart,   bg: "bg-sky-500/10",    color: "text-sky-500" },
};

interface GenreCardsProps {
  onSelectGenre: (genreId: string) => void;
  loadingGenreId: string | null;
}

export function GenreCards({ onSelectGenre, loadingGenreId }: GenreCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {GENRES.map((genre) => {
        const meta = GENRE_ICONS[genre.id];
        const isLoading = loadingGenreId === genre.id;

        return (
          <button
            key={genre.id}
            onClick={() => onSelectGenre(genre.id)}
            disabled={loadingGenreId !== null}
            className="group flex flex-col items-center gap-3 p-5 rounded-xl border bg-card hover:bg-accent hover:border-border transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className={`size-11 rounded-xl flex items-center justify-center ${meta?.bg ?? "bg-muted"}`}>
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                meta && <meta.Icon className={`size-5 ${meta.color}`} />
              )}
            </div>
            <span className="text-sm font-medium leading-tight text-center">{genre.name}</span>
          </button>
        );
      })}
    </div>
  );
}
