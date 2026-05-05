import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authService } from "@/services/auth.service";

/**
 * Subscribes to auth state. Returns { user, session, loading }.
 * IMPORTANT: registers the onAuthStateChange listener BEFORE getSession()
 * to avoid missing initial events (Supabase best practice).
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const unsub = authService.onAuthStateChange((s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);
    });
    authService.getSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const user: User | null = session?.user ?? null;
  return { user, session, loading };
}
