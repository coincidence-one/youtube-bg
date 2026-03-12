"use client";

import { Loader2 } from "lucide-react";
import { GENRES } from "@/hooks/useRadioMode";

interface GenreCardsProps {
  onSelectGenre: (genreId: string) => void;
  loadingGenreId: string | null;
}

export function GenreCards({ onSelectGenre, loadingGenreId }: GenreCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {GENRES.map((genre) => (
        <button
          key={genre.id}
          onClick={() => onSelectGenre(genre.id)}
          disabled={loadingGenreId !== null}
          className="group flex flex-col items-center gap-2.5 p-5 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:border-primary/30 transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {loadingGenreId === genre.id ? (
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-3xl leading-none" role="img" aria-label={genre.name}>
              {genre.emoji}
            </span>
          )}
          <span className="text-sm font-medium leading-tight text-center">{genre.name}</span>
        </button>
      ))}
    </div>
  );
}
