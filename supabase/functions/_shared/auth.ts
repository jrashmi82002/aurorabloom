import { createUserClient, createServiceClient } from "./supabase.ts";
import { errorResponse } from "./cors.ts";

export interface AuthContext {
  userId: string;
  email: string | null;
  authHeader: string;
}

/**
 * Verifies the request JWT using getClaims() and returns the auth context.
 * Returns a Response (401) on failure — caller should early-return it.
 */
export async function requireUser(
  req: Request,
): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401);
  }

  const userClient = createUserClient(authHeader);
  const token = authHeader.replace("Bearer ", "");

  // Prefer getClaims() — it verifies the JWT signature locally without an
  // extra round-trip and works with the new signing-keys system.
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return errorResponse("Unauthorized", 401);
  }

  return {
    userId: data.claims.sub as string,
    email: (data.claims.email as string) ?? null,
    authHeader,
  };
}

/**
 * Verifies the caller is an authenticated admin. Returns AuthContext on
 * success or a Response (401/403) on failure.
 */
export async function requireAdmin(
  req: Request,
): Promise<AuthContext | Response> {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const service = createServiceClient();
  const { data: roleData, error } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !roleData) {
    return errorResponse("Admin access required", 403);
  }
  return auth;
}
