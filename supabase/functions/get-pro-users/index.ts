import { handlePreflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = createServiceClient();

    const { data: proProfiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, pro_subscription_status, pro_subscription_ends_at")
      .in("pro_subscription_status", ["monthly", "yearly"]);
    if (error) throw error;

    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));

    const proUsers = (proProfiles || []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) || null,
    }));

    return jsonResponse({ users: proUsers });
  } catch (error) {
    console.error("get-pro-users error:", error);
    return errorResponse((error as Error).message ?? "Server error", 500);
  }
});
