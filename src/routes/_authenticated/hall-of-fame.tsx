import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchSketches, fetchWeeks, weekPhase } from "@/lib/data";
import { SketchCard } from "@/components/sketch/SketchCard";
import { SketchDialog } from "@/components/sketch/SketchDialog";

export const Route = createFileRoute("/_authenticated/hall-of-fame")({
  head: () => ({
    meta: [
      { title: "Hall of Fame — SketchBoard" },
      { name: "description", content: "Every week's winning design sketch." },
      { property: "og:title", content: "Hall of Fame — SketchBoard" },
      { property: "og:description", content: "Every week's winning design sketch." },
    ],
  }),
  component: HallOfFame,
});

function HallOfFame() {
  const { user } = Route.useRouteContext();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: weeks = [] } = useQuery({ queryKey: ["weeks"], queryFn: fetchWeeks });
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["sketches", user.id, "all"],
    queryFn: () => fetchSketches(user.id),
  });

  const closed = weeks.filter((w) => weekPhase(w) === "closed");
  const winners = closed
    .map((w) => ({ week: w, sketch: all.find((s) => s.week_id === w.id && s.rank === 1 && s.likeCount > 0) }))
    .filter((x) => x.sketch);
  const open = winners.find((w) => w.sketch!.id === openId)?.sketch ?? null;

  return (
    <main id="main" className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Winners</p>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Hall of Fame</h1>
        <p className="mt-3 text-lg text-muted-foreground">The top-voted design from every completed week.</p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : winners.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No winners yet. They’ll appear here once a week’s voting closes.
        </p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {winners.map(({ week, sketch }) => (
            <li key={week.id} className="space-y-2">
              <Link to="/weeks/$weekId" params={{ weekId: week.id }} className="rounded text-sm font-semibold uppercase tracking-widest text-primary hover:underline">
                Week {week.week_number} · {week.title}
              </Link>
              <SketchCard sketch={sketch!} userId={user.id} locked onOpen={() => setOpenId(sketch!.id)} />
            </li>
          ))}
        </ul>
      )}
      <SketchDialog sketch={open} userId={user.id} locked onClose={() => setOpenId(null)} />
    </main>
  );
}
