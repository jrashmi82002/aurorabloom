// Hot-cache adapter.
//
// One interface, two backends:
//   • Upstash Redis (REST)  — used automatically when UPSTASH_REDIS_REST_URL +
//     UPSTASH_REDIS_REST_TOKEN are configured. Sub-ms reads, native TTL.
//   • Postgres `hot_cache`  — the default. No extra service, ~20-50ms reads.
//
// Callers never care which one is live, so switching to Redis later is a
// config change, not a rewrite.

import { createServiceClient } from "./supabase.ts";

const REDIS_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
export const redisEnabled = Boolean(REDIS_URL && REDIS_TOKEN);

export interface CacheEntry {
  payload: Record<string, unknown>;
  input_hash?: string | null;
  computed_at?: string;
}

const key = (userId: string, kind: string) => `hot:${kind}:${userId}`;

async function redisCmd(cmd: unknown[]): Promise<unknown> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  const json = await res.json();
  return json.result;
}

/** Write a cache entry. Always persists to Postgres (durable) and mirrors to Redis when enabled. */
export async function writeCache(
  userId: string,
  kind: string,
  entry: CacheEntry,
  ttlSeconds = 60 * 60 * 24 * 7,
): Promise<void> {
  const computedAt = entry.computed_at ?? new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const service = createServiceClient();
  const { error } = await service.from("hot_cache").upsert(
    {
      user_id: userId,
      kind,
      payload: entry.payload,
      input_hash: entry.input_hash ?? null,
      computed_at: computedAt,
      expires_at: expiresAt,
    },
    { onConflict: "user_id,kind" },
  );
  if (error) throw error;

  if (redisEnabled) {
    try {
      await redisCmd([
        "SET",
        key(userId, kind),
        JSON.stringify({ ...entry, computed_at: computedAt }),
        "EX",
        String(ttlSeconds),
      ]);
    } catch (e) {
      console.error("redis mirror write failed (non-fatal):", e);
    }
  }
}

/** Read a cache entry — Redis first when enabled, Postgres as the source of truth. */
export async function readCache(
  userId: string,
  kind: string,
): Promise<CacheEntry | null> {
  if (redisEnabled) {
    try {
      const raw = await redisCmd(["GET", key(userId, kind)]);
      if (typeof raw === "string") return JSON.parse(raw) as CacheEntry;
    } catch (e) {
      console.error("redis read failed, falling back to postgres:", e);
    }
  }

  const service = createServiceClient();
  const { data } = await service
    .from("hot_cache")
    .select("payload, input_hash, computed_at")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();

  if (!data) return null;
  return {
    payload: (data.payload ?? {}) as Record<string, unknown>,
    input_hash: data.input_hash,
    computed_at: data.computed_at,
  };
}
