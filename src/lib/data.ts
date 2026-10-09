import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Week = Tables<"weeks">;
export type Phase = "upcoming" | "submissions" | "voting" | "closed";

export type Sketch = Tables<"submissions"> & {
  author: string;
  likeCount: number;
  likedByMe: boolean;
  imageUrl: string | null;
  rank: number;
};

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/png", "image/jpeg"];

export function weekPhase(w: Week, now = Date.now()): Phase {
  if (now <= new Date(w.submission_deadline).getTime()) return "submissions";
  if (now <= new Date(w.voting_deadline).getTime()) return "voting";
  return "closed";
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function fetchWeeks(): Promise<Week[]> {
  const { data, error } = await supabase.from("weeks").select("*").order("week_number", { ascending: false });
  if (error) throw error;
  return data;
}

/** Current = lowest-numbered week still open; otherwise none. */
export function splitWeeks(weeks: Week[]) {
  const open = weeks.filter((w) => weekPhase(w) !== "closed").sort((a, b) => a.week_number - b.week_number);
  const current = open[0] ?? null;
  const otherOpen = open.slice(1);
  const archive = weeks.filter((w) => weekPhase(w) === "closed");
  return { current, otherOpen, archive };
}

/** Ranked by likes desc, ties to earliest submission. */
export function rankSketches<T extends { likeCount: number; created_at: string }>(list: T[]) {
  return [...list]
    .sort((a, b) => b.likeCount - a.likeCount || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export async function fetchSketches(userId: string, weekId?: string): Promise<Sketch[]> {
  let q = supabase.from("submissions").select("*, profiles(full_name), likes(user_id)");
  if (weekId) q = q.eq("week_id", weekId);
  const { data, error } = await q;
  if (error) throw error;

  const paths = data.map((s) => s.image_path);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("sketches").createSignedUrls(paths, 60 * 60);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }

  const mapped = data.map(({ profiles, likes, ...s }) => ({
    ...s,
    author: profiles?.full_name ?? "Unknown",
    likeCount: likes.length,
    likedByMe: likes.some((l) => l.user_id === userId),
    imageUrl: urls.get(s.image_path) ?? null,
    rank: 0,
  }));

  // rank within each week
  const byWeek = new Map<string, typeof mapped>();
  mapped.forEach((s) => byWeek.set(s.week_id, [...(byWeek.get(s.week_id) ?? []), s]));
  return [...byWeek.values()].flatMap((list) => rankSketches(list));
}

export async function toggleLike(sketch: Sketch, userId: string) {
  if (sketch.likedByMe) {
    const { error } = await supabase.from("likes").delete().eq("submission_id", sketch.id).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("likes").insert({ submission_id: sketch.id, user_id: userId });
    if (error) throw error;
  }
}
