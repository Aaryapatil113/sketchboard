import { Link, useNavigate } from "@tanstack/react-router";
import { PenTool } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const linkCls = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground";
const activeCls = { className: "text-foreground underline decoration-primary decoration-2 underline-offset-8" };

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="border-b bg-paper/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 rounded-md">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <PenTool className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display text-xl font-semibold">SketchBoard</span>
        </Link>
        {user && (
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
            <Link to="/" className={linkCls} activeProps={activeCls} activeOptions={{ exact: true }}>Weeks</Link>
            <Link to="/hall-of-fame" className={linkCls} activeProps={activeCls}>Hall of Fame</Link>
            {isAdmin && <Link to="/admin" className={linkCls} activeProps={activeCls}>Admin</Link>}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              Sign out
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
