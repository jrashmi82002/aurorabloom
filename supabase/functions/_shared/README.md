# Shared Edge Function Utilities

Centralized helpers used by every function in `supabase/functions/`.

- `cors.ts` — CORS headers, preflight handler, JSON/error response helpers.
- `supabase.ts` — Factory for service-role and user-scoped Supabase clients.
- `auth.ts` — `requireUser()` / `requireAdmin()` using `getClaims()` for JWT verification.
- `validation.ts` — `parseJsonBody(req, zodSchema)` wrapper for input validation.

## Standard function shape

```ts
import { handlePreflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { parseJsonBody, z } from "../_shared/validation.ts";

const BodySchema = z.object({ /* ... */ });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const body = await parseJsonBody(req, BodySchema);
  if (body instanceof Response) return body;

  try {
    // ...business logic using auth.userId / body...
    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse((e as Error).message ?? "Server error", 500);
  }
});
```
