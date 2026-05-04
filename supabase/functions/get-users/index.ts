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
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const { data: profiles } = await supabase.from("profiles").select("id, full_name");
    const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

    const simplified = users.map((u) => ({
      id: u.id,
      email: u.email || "",
      full_name: profileMap.get(u.id) || null,
    }));

    return jsonResponse({ users: simplified });
  } catch (error) {
    console.error("get-users error:", error);
    return errorResponse((error as Error).message ?? "Server error", 500);
  }
});
