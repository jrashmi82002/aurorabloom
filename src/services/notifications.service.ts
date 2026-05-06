import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export const notificationsService = {
  async list(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) throw error;
  },

  async markAllRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Subscribe to realtime INSERTs on notifications for a specific user.
   * Returns an unsubscribe function.
   */
  subscribe(userId: string, onInsert: (n: Notification) => void): () => void {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onInsert(payload.new as Notification),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
