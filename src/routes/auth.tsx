import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAllowedEmail } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SketchBoard" },
      { name: "description", content: "Sign in to SketchBoard with your Northeastern email." },
      { property: "og:title", content: "Sign in — SketchBoard" },
      { property: "og:description", content: "Sign in to SketchBoard with your Northeastern email." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!isAllowedEmail(email)) return setError("Please use your @northeastern.edu email address.");
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } },
      });
      if (error) setError(error.message);
      else setInfo("Check your inbox to confirm your email, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(error.message);
      else navigate({ to: "/" });
    }
    setBusy(false);
  }

  return (
    <main id="main" className="mx-auto grid max-w-md px-4 py-16">
      <div className="rounded-xl border bg-card p-8 shadow-lift">
        <h1 className="text-3xl font-semibold">Welcome to SketchBoard</h1>
        <p className="mt-2 text-muted-foreground">Post weekly sketches and vote for your classmates’ best work.</p>
        <Tabs value={mode} onValueChange={(v) => { setMode(v); setError(null); setInfo(null); }} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value={mode}>
            <form onSubmit={submit} className="mt-4 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Northeastern email</Label>
                <Input id="email" type="email" placeholder="you@northeastern.edu" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              {info && <p role="status" className="text-sm text-foreground">{info}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
