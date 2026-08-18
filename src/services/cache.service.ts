import { supabase } from "@/integrations/supabase/client";

export type CacheKind = "persona" | "report" | "profile_stats";

export interface HotEntry<T = any> {
  payload: T;
  computed_at: string;
  stale: boolean;
}

const STALE_AFTER_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const LOCAL_PREFIX = "hot_cache:";

/**
 * Hot read: a single indexed row lookup, no AI call in the render path.
 * Falls back to a localStorage mirror so a reload paints instantly even offline.
 */
export const cacheService = {
  async read<T = any>(userId: string, kind: CacheKind): Promise<HotEntry<T> | null> {
    const localKey = `${LOCAL_PREFIX}${kind}:${userId}`;

    try {
      const { data } = await supabase
        .from("hot_cache")
        .select("payload, computed_at")
        .eq("user_id", userId)
        .eq("kind", kind)
        .maybeSingle();

      if (data?.payload) {
        const entry: HotEntry<T> = {
          payload: data.payload as T,
          computed_at: data.computed_at,
          stale: Date.now() - new Date(data.computed_at).getTime() > STALE_AFTER_MS,
        };
        try {
          localStorage.setItem(localKey, JSON.stringify(entry));
        } catch {}
        return entry;
      }
    } catch (e) {
      console.error("hot cache read failed:", e);
    }

    try {
      const raw = localStorage.getItem(localKey);
      if (raw) return JSON.parse(raw) as HotEntry<T>;
    } catch {}
    return null;
  },

  /**
   * Mark an insight stale and kick the background worker.
   * Call this when the user *finishes* something (session closed, journal saved,
   * quiz submitted, activity completed) — never on every chat message.
   */
  async markDirty(kinds: CacheKind[], reason: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let queued = false;
      for (const kind of kinds) {
        const { error } = await supabase.rpc("enqueue_cache_job", {
          _kind: kind,
          _reason: reason,
        });
        if (!error) queued = true;
      }

      // Gated kick: only invoke the worker when we actually queued something.
      if (queued) {
        supabase.functions
          .invoke("cache-worker", { body: { reason } })
          .catch((e) => console.error("cache worker kick failed:", e));
      }
    } catch (e) {
      console.error("markDirty failed:", e);
    }
  },
};
