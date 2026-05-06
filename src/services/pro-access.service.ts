import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProAccessRequest = Database["public"]["Tables"]["pro_access_requests"]["Row"];

export const proAccessService = {
  async myRequest(userId: string): Promise<ProAccessRequest | null> {
    const { data, error } = await supabase
      .from("pro_access_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(userId: string, email: string, reason: string) {
    const { data, error } = await supabase
      .from("pro_access_requests")
      .insert({ user_id: userId, email, reason, status: "pending" })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Subscribe to UPDATEs on the current user's profile (e.g. pro status grants).
   */
  subscribeToProfile(userId: string, onUpdate: (newRow: any, oldRow: any) => void): () => void {
    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => onUpdate(payload.new, payload.old),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
