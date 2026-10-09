import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { fetchSketches, fetchWeeks, splitWeeks, type Week } from "@/lib/data";
import { WeekGallery, WeekHeader } from "@/components/sketch/WeekGallery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SketchBoard — Weekly design sketches" },
      { name: "description", content: "Post weekly design sketches, vote for the best, and browse the class archive." },
      { property: "og:title", content: "SketchBoard — Weekly design sketches" },
      { property: "og:description", content: "Post weekly design sketches, vote for the best, and browse the class archive." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <main id="main" className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading…</main>;
  if (!user) {
    return (
      <main id="main" className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Design studio · Weekly</p>
        <h1 className="mt-4 text-5xl font-semibold md:text-6xl">Sketch it. Share it. Pick the best.</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Every week a new prompt. Post your sketch, like your classmates’ work, and see who lands in the Hall of Fame.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/auth">Sign in with your Northeastern email</Link>
        </Button>
      </main>
    );
  }
  return <Dashboard userId={user.id} />;
}

function Dashboard({ userId }: { userId: string }) {
  const { data: weeks = [], isLoading } = useQuery({ queryKey: ["weeks"], queryFn: fetchWeeks });
  const { current, otherOpen, archive } = splitWeeks(weeks);

  if (isLoading) return <main id="main" className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading…</main>;

  return (
    <main id="main" className="mx-auto max-w-6xl space-y-16 px-4 py-12">
      {current ? (
        <div className="space-y-10">
          <WeekHeader week={current} />
          <WeekGallery week={current} userId={userId} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <h1 className="text-3xl font-semibold">No active week</h1>
          <p className="mt-2 text-muted-foreground">Check back soon — your instructor will post the next prompt.</p>
        </div>
      )}

      {otherOpen.length > 0 && (
        <section aria-labelledby="open-heading" className="space-y-4">
          <h2 id="open-heading" className="text-2xl font-semibold">Also open</h2>
          <WeekList weeks={otherOpen} userId={userId} />
        </section>
      )}

      <section aria-labelledby="archive-heading" className="space-y-4">
        <h2 id="archive-heading" className="text-2xl font-semibold">Archive</h2>
        {archive.length === 0 ? (
          <p className="text-muted-foreground">Past weeks will appear here once voting closes.</p>
        ) : (
          <WeekList weeks={archive} userId={userId} />
        )}
      </section>
    </main>
  );
}

function WeekList({ weeks, userId }: { weeks: Week[]; userId: string }) {
  const { data: all = [] } = useQuery({ queryKey: ["sketches", userId, "all"], queryFn: () => fetchSketches(userId) });
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {weeks.map((w) => {
        const winner = all.find((s) => s.week_id === w.id && s.rank === 1 && s.likeCount > 0);
        return (
          <li key={w.id}>
            <Link
              to="/weeks/$weekId"
              params={{ weekId: w.id }}
              className="flex h-full gap-4 rounded-lg border bg-card p-4 shadow-sketch transition-shadow hover:shadow-lift"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {winner?.imageUrl && <img src={winner.imageUrl} alt={winner.alt_text} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Week {w.week_number}</p>
                <h3 className="truncate text-lg font-semibold">{w.title}</h3>
                {winner ? (
                  <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-gold-foreground" aria-hidden />
                    <span className="sr-only">Winner:</span> {winner.title} · {winner.author}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">View sketches</p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
