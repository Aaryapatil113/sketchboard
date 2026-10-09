import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WeekGallery, WeekHeader } from "@/components/sketch/WeekGallery";

export const Route = createFileRoute("/_authenticated/weeks/$weekId")({
  head: () => ({
    meta: [
      { title: "Week gallery — SketchBoard" },
      { name: "description", content: "Browse and vote on this week's design sketches." },
      { property: "og:title", content: "Week gallery — SketchBoard" },
      { property: "og:description", content: "Browse and vote on this week's design sketches." },
    ],
  }),
  component: WeekPage,
});

function WeekPage() {
  const { weekId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const { data: week, isLoading } = useQuery({
    queryKey: ["week", weekId],
    queryFn: async () => (await supabase.from("weeks").select("*").eq("id", weekId).maybeSingle()).data,
  });

  return (
    <main id="main" className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All weeks
      </Link>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !week ? (
        <h1 className="text-3xl font-semibold">Week not found</h1>
      ) : (
        <>
          <WeekHeader week={week} />
          <WeekGallery week={week} userId={user.id} />
        </>
      )}
    </main>
  );
}
