"use client";

import { useState } from "react";
import { Loader2, Radio } from "lucide-react";
import { GENRES, type Genre } from "@/hooks/useRadioMode";

interface GenreCardsProps {
  onSelectGenre: (genreId: string) => void;
  loadingGenreId: string | null;
}

export function GenreCards({ onSelectGenre, loadingGenreId }: GenreCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="size-5 text-primary" />
        <h3 className="text-lg font-semibold">장르별 라디오</h3>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        장르를 선택하면 자동으로 음악이 재생됩니다
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {GENRES.map((genre) => (
          <GenreCard
            key={genre.id}
            genre={genre}
            isLoading={loadingGenreId === genre.id}
            disabled={loadingGenreId !== null}
            onSelect={() => onSelectGenre(genre.id)}
          />
        ))}
      </div>
    </div>
  );
}

function GenreCard({
  genre,
  isLoading,
  disabled,
  onSelect,
}: {
  genre: Genre;
  isLoading: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-2xl p-5 min-h-[120px]
        flex flex-col items-center justify-center gap-2
        bg-gradient-to-br ${genre.gradient}
        text-white shadow-lg
        transition-all duration-200
        hover:scale-[1.03] hover:shadow-xl
        active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute -top-4 -right-4 size-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-white/10" />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        {isLoading ? (
          <Loader2 className="size-10 animate-spin" />
        ) : (
          <span className="text-4xl" role="img" aria-label={genre.name}>
            {genre.emoji}
          </span>
        )}
        <span className="text-base font-bold tracking-wide">{genre.name}</span>
        <span className="text-xs opacity-80 font-medium">라디오</span>
      </div>
    </button>
  );
}
