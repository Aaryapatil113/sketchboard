import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { fetchWeeks, formatDate } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SketchBoard" },
      { name: "description", content: "Create and manage weekly sketch prompts." },
      { property: "og:title", content: "Admin — SketchBoard" },
      { property: "og:description", content: "Create and manage weekly sketch prompts." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: weeks = [] } = useQuery({ queryKey: ["weeks"], queryFn: fetchWeeks });
  const [form, setForm] = useState({ week_number: "", title: "", prompt: "", submission_deadline: "", voting_deadline: "" });
  const [busy, setBusy] = useState(false);

  if (!isAdmin) {
    return (
      <main id="main" className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">This page is for instructors and TAs.</p>
      </main>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const sub = new Date(form.submission_deadline);
    const vote = new Date(form.voting_deadline);
    if (vote < sub) return toast.error("Voting deadline must be after the submission deadline.");
    setBusy(true);
    const { error } = await supabase.from("weeks").insert({
      week_number: Number(form.week_number),
      title: form.title.trim(),
      prompt: form.prompt.trim(),
      submission_deadline: sub.toISOString(),
      voting_deadline: vote.toISOString(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Week created");
    setForm({ week_number: "", title: "", prompt: "", submission_deadline: "", voting_deadline: "" });
    qc.invalidateQueries({ queryKey: ["weeks"] });
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Delete ${label}? All its sketches and likes will be removed.`)) return;
    const { error } = await supabase.from("weeks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["weeks"] });
  }

  return (
    <main id="main" className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_1.2fr]">
      <section aria-labelledby="new-week" className="rounded-xl border bg-card p-6 shadow-sketch">
        <h1 id="new-week" className="text-2xl font-semibold">Create a week</h1>
        <form onSubmit={create} className="mt-4 space-y-4">
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="wn">Week #</Label>
              <Input id="wn" type="number" min={1} value={form.week_number} onChange={set("week_number")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wt">Title</Label>
              <Input id="wt" value={form.title} onChange={set("title")} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp">Prompt / theme</Label>
            <Textarea id="wp" rows={3} value={form.prompt} onChange={set("prompt")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws">Submission deadline</Label>
            <Input id="ws" type="datetime-local" value={form.submission_deadline} onChange={set("submission_deadline")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wv">Voting deadline</Label>
            <Input id="wv" type="datetime-local" value={form.voting_deadline} onChange={set("voting_deadline")} required />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create week"}</Button>
        </form>
      </section>
      <section aria-labelledby="all-weeks" className="space-y-4">
        <h2 id="all-weeks" className="text-2xl font-semibold">All weeks</h2>
        {weeks.length === 0 ? (
          <p className="text-muted-foreground">No weeks yet.</p>
        ) : (
          <ul className="space-y-3">
            {weeks.map((w) => (
              <li key={w.id} className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
                <div>
                  <p className="font-semibold">Week {w.week_number}: {w.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Submit by {formatDate(w.submission_deadline)} · Vote by {formatDate(w.voting_deadline)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => remove(w.id, `Week ${w.week_number}`)}>Delete</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
