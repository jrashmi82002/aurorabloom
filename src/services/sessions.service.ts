import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TherapySession = Database["public"]["Tables"]["therapy_sessions"]["Row"];
export type TherapyMessage = Database["public"]["Tables"]["therapy_messages"]["Row"];

export const sessionsService = {
  async listForUser(userId: string): Promise<TherapySession[]> {
    const { data, error } = await supabase
      .from("therapy_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async get(id: string): Promise<TherapySession | null> {
    const { data, error } = await supabase
      .from("therapy_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async messages(sessionId: string): Promise<TherapyMessage[]> {
    const { data, error } = await supabase
      .from("therapy_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  isCurrentMonth(startedAt: string | null): boolean {
    if (!startedAt) return true;
    const d = new Date(startedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  },

  async canStart(userId: string) {
    const { data, error } = await supabase.rpc("can_user_start_session", {
      user_id_param: userId,
    });
    if (error) throw error;
    return data as { allowed: boolean; is_pro: boolean; reason?: string; sessions_remaining?: number };
  },
};
