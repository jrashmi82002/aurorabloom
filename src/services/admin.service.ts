import { supabase } from "@/integrations/supabase/client";

/**
 * Admin service — invokes hardened edge functions. The functions verify
 * admin role server-side via requireAdmin().
 */
export const adminService = {
  async listUsers() {
    const { data, error } = await supabase.functions.invoke("get-users", {});
    if (error) throw error;
    return (data?.users ?? []) as Array<{ id: string; email: string; full_name: string | null }>;
  },

  async listProUsers() {
    const { data, error } = await supabase.functions.invoke("get-pro-users", {});
    if (error) throw error;
    return data?.users ?? [];
  },

  async broadcastEmail(subject: string, message: string) {
    const { data, error } = await supabase.functions.invoke("broadcast-email", {
      body: { subject, message },
    });
    if (error) throw error;
    return data;
  },

  async targetedEmail(emails: string[], subject: string, message: string) {
    const { error } = await supabase.functions.invoke("send-targeted-email", {
      body: { emails, subject, message },
    });
    if (error) throw error;
  },

  async proAction(payload: { requestId: string; action: "approve" | "reject"; tier?: "monthly" | "yearly" }) {
    const { data, error } = await supabase.functions.invoke("admin-pro-action", { body: payload });
    if (error) throw error;
    return data;
  },
};
