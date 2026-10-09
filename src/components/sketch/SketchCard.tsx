import type { Sketch } from "@/lib/data";
import { LikeButton } from "./LikeButton";
import { RankMarker } from "./RankMarker";

export function SketchCard({
  sketch,
  userId,
  locked,
  onOpen,
}: {
  sketch: Sketch;
  userId: string;
  locked: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sketch transition-shadow hover:shadow-lift">
      <button
        type="button"
        onClick={onOpen}
        className="relative block text-left focus-visible:outline-offset-[-3px]"
        aria-label={`Open ${sketch.title} by ${sketch.author}`}
      >
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {sketch.imageUrl ? (
            <img
              src={sketch.imageUrl}
              alt={sketch.alt_text}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : null}
        </div>
        <RankMarker rank={sketch.rank} likeCount={sketch.likeCount} className="absolute left-3 top-3" />
      </button>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold leading-tight">{sketch.title}</h3>
          <p className="truncate text-sm text-muted-foreground">{sketch.author}</p>
        </div>
        <LikeButton sketch={sketch} userId={userId} locked={locked} />
      </div>
    </article>
  );
}
