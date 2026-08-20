// Background recompute worker for the hot cache.
//
// Invoked (fire-and-forget) after a user finishes something that changes their
// data — a chat session, a journal entry, a quiz, a saved painting — and safe to
// call on a schedule too. The user never waits on this: the UI reads whatever is
// already in the cache while this refreshes it behind them.
//
// Safety rails (see background-job rules):
//   • bounded batch per run
//   • single-flight DB lease
//   • idempotent per-job status marking
//   • circuit breaker: 402/403 pause the whole worker, repeated 429s park it
//   • every entry point checks the paused state first (one probe job allowed)

import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { writeCache } from "../_shared/cache-store.ts";

const JOB_NAME = "cache-worker";
const BATCH_SIZE = 5;
const LEASE_MINUTES = 3;
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Job {
  id: string;
  user_id: string;
  kind: string;
}

async function callGateway(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`gateway ${res.status}: ${body}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// ---- payload builders -------------------------------------------------------

async function buildProfileStats(userId: string) {
  const service = createServiceClient();
  const [sessionsRes, diaryRes, profileRes] = await Promise.all([
    service
      .from("therapy_sessions")
      .select("id, therapy_type, message_count, started_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(100),
    service
      .from("diary_entries")
      .select("mood_sticker, theme, entry_date")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(60),
    service.from("profiles").select("full_name, username, created_at").eq("id", userId).maybeSingle(),
  ]);

  const sessions = sessionsRes.data ?? [];
  const diary = diaryRes.data ?? [];
  const typeCounts: Record<string, number> = {};
  for (const s of sessions) typeCounts[s.therapy_type] = (typeCounts[s.therapy_type] ?? 0) + 1;
  const moodCounts: Record<string, number> = {};
  for (const d of diary) if (d.mood_sticker) moodCounts[d.mood_sticker] = (moodCounts[d.mood_sticker] ?? 0) + 1;

  return {
    name: profileRes.data?.full_name || profileRes.data?.username || "",
    member_since: profileRes.data?.created_at ?? null,
    total_sessions: sessions.length,
    total_messages: sessions.reduce((n, s) => n + (s.message_count ?? 0), 0),
    therapy_type_counts: typeCounts,
    mood_counts: moodCounts,
    diary_entries: diary.length,
    last_session_at: sessions[0]?.started_at ?? null,
    themes: [...new Set(diary.map((d) => d.theme).filter(Boolean))].slice(0, 8),
  };
}

async function buildPersona(userId: string, apiKey: string) {
  const service = createServiceClient();
  const stats = await buildProfileStats(userId);

  const { data: sessions } = await service
    .from("therapy_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(5);

  const samples: string[] = [];
  for (const s of sessions ?? []) {
    const { data: msgs } = await service
      .from("therapy_messages")
      .select("content")
      .eq("session_id", s.id)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(5);
    for (const m of msgs ?? []) samples.push(m.content);
  }

  const hasEnoughData = stats.total_messages >= 10;

  const prompt = `You are a thoughtful, poetic personality analyst. Write a warm 300-400 word persona reflection in second person ("You are..."), poetic and deeply personal, with metaphors, ending with a relevant Bhagavad Gita quote.

User data:
- Name: ${stats.name || "Dear soul"}
- Sessions: ${stats.total_sessions}, Messages: ${stats.total_messages}
- Therapy types: ${JSON.stringify(stats.therapy_type_counts)}
- Diary moods: ${Object.keys(stats.mood_counts).join(", ") || "none yet"}
- Diary themes: ${stats.themes.join(", ") || "none"}
- Things they've shared: ${samples.join(" | ").slice(0, 600) || "not much yet"}

Cover: who they are, their strengths, their growth pattern, their emotional landscape, ${
    hasEnoughData
      ? `and a character they remind you of — pick ONE that genuinely matches how they write, from sports legends (Dhoni, Kohli, Messi, Serena, Sachin), anime (Naruto, Goku, Mikasa, Itachi, Tanjiro, Luffy, Hinata), Indian mythology (Arjuna, Krishna, Hanuman, Draupadi, Karna), Bollywood (Rancho, Naina, Rani), or Hollywood (Batman, Hermione, Captain America, Mulan, Forrest Gump). Explain in 2-3 sentences exactly why. Elizabeth Bennet, Mr. Darcy and Jane Eyre are permanently BANNED.`
      : `and 2-3 emerging personality hints ("As we get to know you better, I sense...") — do NOT assign a fictional character yet, tease that it's coming.`
  }
Then a gentle insight about their soul.

Use recovery-focused language: never say they "have" a condition; say they are navigating or strengthening something. Never say there isn't enough data — always write the full reflection.`;

  const text = await callGateway(prompt, apiKey);
  return { persona_text: text, stats };
}

async function buildReport(userId: string, apiKey: string) {
  const stats = await buildProfileStats(userId);
  const prompt = `Write a compassionate monthly wellness reflection (200-250 words) for someone using a self-reflection companion app.

Their activity: ${stats.total_sessions} sessions, ${stats.total_messages} messages, ${stats.diary_entries} journal entries. Therapy modes: ${JSON.stringify(stats.therapy_type_counts)}. Moods logged: ${JSON.stringify(stats.mood_counts)}. Themes: ${stats.themes.join(", ") || "none yet"}.

Structure: what showed up this month, what is strengthening, one focus area framed as growth ("focusing on X would strengthen this further"), and one small practice for next month. Recovery-focused language only — never diagnose, never label. This is reflection, not medical advice.`;

  const summary = await callGateway(prompt, apiKey);
  return { summary, stats };
}

// ---- worker ----------------------------------------------------------------

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  const service = createServiceClient();
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.error("LOVABLE_API_KEY is not configured");
    return jsonResponse({ error: "AI is not configured" }, 500);
  }

  // 1. Paused-state guard + single-flight lease (atomic, in SQL).
  const { data: state } = await service
    .from("job_state")
    .select("paused_reason")
    .eq("name", JOB_NAME)
    .maybeSingle();

  const paused = Boolean(state?.paused_reason);

  const { data: leased, error: leaseErr } = await service.rpc("acquire_job_lease", {
    _name: JOB_NAME,
    _minutes: LEASE_MINUTES,
  });
  if (leaseErr) {
    console.error("lease acquisition failed:", leaseErr);
    return jsonResponse({ error: "lease failed" }, 500);
  }
  if (!leased) return jsonResponse({ skipped: "another run holds the lease" });


  // While paused we process at most ONE probe job to detect recovery.
  const limit = paused ? 1 : BATCH_SIZE;

  let processed = 0;
  let pausedNow: string | null = null;

  try {
    const { data: jobs } = await service
      .from("cache_jobs")
      .select("id, user_id, kind")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    const queue: Job[] = jobs ?? [];
    if (queue.length === 0) {
      return jsonResponse({ processed: 0, idle: true, paused });
    }

    for (const job of queue) {
      // Claim the job so a concurrent/rerun does not redo it.
      const { data: claimed } = await service
        .from("cache_jobs")
        .update({ status: "processing" })
        .eq("id", job.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (!claimed) continue;

      try {
        let payload: Record<string, unknown>;
        if (job.kind === "profile_stats") payload = await buildProfileStats(job.user_id);
        else if (job.kind === "persona") payload = await buildPersona(job.user_id, apiKey);
        else if (job.kind === "report") payload = await buildReport(job.user_id, apiKey);
        else throw new Error(`unknown kind ${job.kind}`);

        await writeCache(job.user_id, job.kind, {
          payload,
          input_hash: null,
        });

        await service
          .from("cache_jobs")
          .update({ status: "done", processed_at: new Date().toISOString() })
          .eq("id", job.id);
        processed++;

        // A successful run clears any earlier pause (credits topped up etc).
        if (paused) {
          await service
            .from("job_state")
            .update({ paused_reason: null, paused_at: null })
            .eq("name", JOB_NAME);
        }
      } catch (e) {
        const status = (e as { status?: number }).status;
        const message = (e as Error).message ?? "unknown error";
        console.error(`job ${job.id} (${job.kind}) failed:`, message);

        await service
          .from("cache_jobs")
          .update({
            status: "failed",
            last_error: message.slice(0, 500),
            attempts: 1,
            processed_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        // Circuit breaker — stop the whole run, do not burn the queue.
        if (status === 402 || status === 403 || status === 429) {
          pausedNow =
            status === 429
              ? "rate limited — will retry on the next run"
              : status === 402
                ? "AI credits exhausted — add credits to resume background insights"
                : "AI access blocked by workspace policy";
          break;
        }
      }
    }
  } finally {
    await service
      .from("job_state")
      .update({
        locked_until: null,
        paused_reason: pausedNow ?? (paused && processed > 0 ? null : state?.paused_reason ?? null),
        paused_at: pausedNow ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("name", JOB_NAME);
  }

  return jsonResponse({ processed, paused: pausedNow ?? paused });
});
