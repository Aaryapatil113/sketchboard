import { Award, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const styles: Record<number, { cls: string; label: string }> = {
  1: { cls: "bg-gold text-gold-foreground", label: "Gold, 1st place" },
  2: { cls: "bg-silver text-silver-foreground", label: "Silver, 2nd place" },
  3: { cls: "bg-bronze text-bronze-foreground", label: "Bronze, 3rd place" },
};

export function RankMarker({ rank, likeCount, className }: { rank: number; likeCount: number; className?: string }) {
  const s = styles[rank];
  if (!s || likeCount === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sketch",
        s.cls,
        className,
      )}
    >
      {rank === 1 ? <Trophy className="h-3.5 w-3.5" aria-hidden /> : <Award className="h-3.5 w-3.5" aria-hidden />}
      {rank === 1 ? "Top Design" : `#${rank}`}
      <span className="sr-only">— {s.label}</span>
    </span>
  );
}
