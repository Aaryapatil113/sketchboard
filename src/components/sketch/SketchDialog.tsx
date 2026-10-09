import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Sketch } from "@/lib/data";
import { LikeButton } from "./LikeButton";
import { RankMarker } from "./RankMarker";

export function SketchDialog({
  sketch,
  userId,
  locked,
  onClose,
}: {
  sketch: Sketch | null;
  userId: string;
  locked: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!sketch} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {sketch && (
          <>
            <div className="overflow-hidden rounded-md bg-muted">
              {sketch.imageUrl && (
                <img src={sketch.imageUrl} alt={sketch.alt_text} className="max-h-[65vh] w-full object-contain" />
              )}
            </div>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <RankMarker rank={sketch.rank} likeCount={sketch.likeCount} />
              </div>
              <DialogTitle className="font-display text-2xl">{sketch.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">by {sketch.author}</p>
              <DialogDescription className="whitespace-pre-wrap text-base text-foreground">
                {sketch.description || "No description."}
              </DialogDescription>
            </DialogHeader>
            <div>
              <LikeButton sketch={sketch} userId={userId} locked={locked} size="lg" />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
