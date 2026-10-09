import { Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleLike, type Sketch } from "@/lib/data";

export function LikeButton({
  sketch,
  userId,
  locked,
  size = "sm",
}: {
  sketch: Sketch;
  userId: string;
  locked: boolean;
  size?: "sm" | "lg";
}) {
  const qc = useQueryClient();
  const own = sketch.user_id === userId;
  const m = useMutation({
    mutationFn: () => toggleLike(sketch, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sketches"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const disabled = locked || own || m.isPending;
  const reason = locked ? "Voting closed" : own ? "Your sketch" : sketch.likedByMe ? "Remove like" : "Like";

  return (
    <button
      type="button"
      onClick={() => m.mutate()}
      disabled={disabled}
      aria-pressed={sketch.likedByMe}
      aria-label={`${reason}: ${sketch.title}. ${sketch.likeCount} ${sketch.likeCount === 1 ? "like" : "likes"}`}
      title={reason}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
        size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1.5 text-sm",
        sketch.likedByMe
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-card text-foreground hover:bg-accent",
        disabled && "cursor-not-allowed opacity-70 hover:bg-card",
        disabled && sketch.likedByMe && "hover:bg-primary",
      )}
    >
      <Heart className={cn("h-4 w-4", sketch.likedByMe && "fill-current")} aria-hidden />
      <span>{sketch.likeCount}</span>
    </button>
  );
}
