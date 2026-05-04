import { z, ZodSchema } from "https://esm.sh/zod@3.23.8";
import { errorResponse } from "./cors.ts";

export { z };

/**
 * Parses the request body against a zod schema. Returns the typed value or a
 * 400 Response that the caller should early-return.
 */
export async function parseJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<T | Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "Invalid request: " +
        JSON.stringify(parsed.error.flatten().fieldErrors),
      400,
    );
  }
  return parsed.data;
}
