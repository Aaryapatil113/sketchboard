import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ALLOWED_DOMAIN = "@northeastern.edu";

export function isAllowedEmail(email: string) {
  return email.trim().toLowerCase().endsWith(ALLOWED_DOMAIN);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const roles = useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.role);
    },
  });

  return { user, loading, isAdmin: roles.data?.includes("admin") ?? false };
}
