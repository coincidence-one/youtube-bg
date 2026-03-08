"use client";

export function PlaylistSkeleton() {
  return (
    <div className="space-y-2 p-1 animate-pulse">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="w-12 h-9 rounded bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
