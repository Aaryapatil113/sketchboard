import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSketches, formatDate, weekPhase, type Week } from "@/lib/data";
import { SketchCard } from "./SketchCard";
import { SketchDialog } from "./SketchDialog";
import { SubmitSketchDialog } from "./SubmitSketchDialog";

const phaseLabel = {
  upcoming: "Upcoming",
  submissions: "Submissions open",
  voting: "Voting open",
  closed: "Closed",
};

export function WeekHeader({ week }: { week: Week }) {
  const phase = weekPhase(week);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold uppercase tracking-widest text-primary">Week {week.week_number}</span>
        <span className="rounded-full border bg-card px-2.5 py-0.5 font-medium">{phaseLabel[phase]}</span>
      </div>
      <h1 className="text-4xl font-semibold md:text-5xl">{week.title}</h1>
      {week.prompt && <p className="max-w-2xl text-lg text-muted-foreground">{week.prompt}</p>}
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <div><dt className="inline font-medium text-foreground">Submissions close: </dt><dd className="inline">{formatDate(week.submission_deadline)}</dd></div>
        <div><dt className="inline font-medium text-foreground">Voting closes: </dt><dd className="inline">{formatDate(week.voting_deadline)}</dd></div>
      </dl>
    </div>
  );
}

export function WeekGallery({ week, userId }: { week: Week; userId: string }) {
  const phase = weekPhase(week);
  const locked = phase === "closed";
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: sketches = [], isLoading } = useQuery({
    queryKey: ["sketches", userId, week.id],
    queryFn: () => fetchSketches(userId, week.id),
  });
  const mine = sketches.find((s) => s.user_id === userId);
  const openSketch = sketches.find((s) => s.id === openId) ?? null;

  return (
    <section aria-labelledby={`gallery-${week.id}`} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={`gallery-${week.id}`} className="text-2xl font-semibold">
          {sketches.length} {sketches.length === 1 ? "sketch" : "sketches"}
        </h2>
        {phase === "submissions" && <SubmitSketchDialog week={week} userId={userId} existing={mine} />}
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading sketches…</p>
      ) : sketches.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No sketches yet{phase === "submissions" ? " — be the first to post one." : "."}
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sketches.map((s) => (
            <li key={s.id}>
              <SketchCard sketch={s} userId={userId} locked={locked} onOpen={() => setOpenId(s.id)} />
            </li>
          ))}
        </ul>
      )}
      <SketchDialog sketch={openSketch} userId={userId} locked={locked} onClose={() => setOpenId(null)} />
    </section>
  );
}
