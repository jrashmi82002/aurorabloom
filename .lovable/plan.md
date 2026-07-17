
# Plan: Scaling, Caching, RAG on Clinical Guides & Safe Tone

Six focused changes. Each is independent — you can approve all or a subset.

---

## 1. `therapy_messages` growth — archival + summarization

**Problem:** table grows unbounded; every session fetch pulls all messages.

**Fix (schema + code):**
- Add `session_summaries` table: `session_id`, `user_id`, `summary_text`, `key_themes[]`, `emotional_arc`, `message_count_at_summary`, `updated_at`.
- Add `is_archived boolean default false` + `archived_at` to `therapy_messages`.
- Edge function `summarize-session` (invoked when a session ends OR when message_count crosses a threshold like 40): calls Gemini to compress the transcript into ~300 tokens, writes to `session_summaries`, sets `is_archived=true` on the compressed messages.
- Cron job (pg_cron nightly): summarize sessions older than 30 days that aren't summarized yet.
- Add composite index `(user_id, is_archived, started_at desc)` and `(session_id, created_at)` on `therapy_messages` — if missing.
- Later (only when volume actually demands it) we can partition by `date_trunc('month', created_at)`. Not doing that now — premature.

---

## 2. Persona caching — stale-while-revalidate

**Problem:** `MyPersona.tsx` regenerates from scratch on every mount.

**Fix:**
- Add `persona_cache` table: `user_id (PK)`, `persona_text`, `mbti`, `character_match`, `generated_at`, `input_hash` (hash of session_count + last_message_id + diary_count).
- `MyPersona` flow:
  1. Read cache instantly → render (with a subtle "updating…" badge if stale).
  2. Compute current `input_hash` client-side; if it differs from cached OR `generated_at > 7 days`, fire background regeneration via `generate-persona` edge function.
  3. On success, upsert cache + swap in UI without unmounting.
- Cache read is <50ms vs. current ~5-15s Gemini call.

---

## 3. Chat context — rolling summary instead of full history

**Problem:** every message sends full transcript to Gemini → cost + latency + context bloat.

**Fix (in `therapy-chat` edge function + client):**
- Keep only last **12 messages** verbatim in the prompt.
- Prepend a `rolling_summary` string (stored in `therapy_sessions.rolling_summary` column, new).
- Every 10 user messages, edge function updates `rolling_summary` = Gemini("compress prior summary + these 10 msgs into ≤200 tokens, preserve emotional themes, unresolved threads, named people").
- Client caches `rolling_summary` in `localStorage` per session so it survives reloads without a DB hit.
- Result: prompt size stays flat regardless of session length.

---

## 4. TTS queue — non-blocking audio

**Problem:** UI awaits ElevenLabs synchronously; a slow response freezes the "speak" action.

**Fix:**
- Client-side queue in a `useTTSQueue` hook: FIFO of `{text, id}`. Worker processes one at a time, streams audio as it arrives, next request pre-fetches in parallel.
- Show a small "🔊 queued" indicator per bubble; user can continue chatting.
- Optional: for long assistant messages, split by sentence → parallel TTS calls → play sequentially (first sentence audible in ~1s instead of ~5s).
- No server-side job queue needed at current scale (ElevenLabs is already async-friendly). Note: a real background job system (Inngest) is documented as a future step if you outgrow ElevenLabs' rate limits.

---

## 5. Clinical-guide RAG (embeddings)

**Problem:** Maya's advice isn't grounded in any actual clinical framework.

**Fix:**
- Enable `pgvector` extension.
- New table `clinical_docs`: `id`, `source` (e.g. "APA Clinical Practice Guideline for Depression 2019"), `chunk_text`, `embedding vector(3072)`, `page`, `citation_url`.
- Admin uploads PDFs to a new private `clinical-guides` storage bucket.
- Edge function `ingest-clinical-doc`: parses PDF (via existing document parser flow), chunks into ~800-char pieces, embeds via `google/gemini-embedding-001` through Lovable AI gateway, inserts rows.
- `match_clinical_docs(query_embedding, k)` SQL function → cosine similarity.
- In `therapy-chat`: embed user's last message, retrieve top 3 chunks, inject as `<clinical_context>` in system prompt with instruction: "Use this as reference; do not quote verbatim; adapt to conversational tone."
- **Which guides to seed** (public/redistributable): APA Clinical Practice Guidelines (depression, PTSD), NICE guidelines (anxiety, depression), WHO mhGAP Intervention Guide, SAMHSA TIP series. You upload the PDFs — I'll wire ingestion. Do not seed paywalled DSM-5 content.

---

## 6. Reframed tone + safety disclaimers

**Problem:** current prompt can pathologize; no medical disclaimer on heavy topics.

**Fix (system prompt update in `therapy-chat`):**
- Replace deficit language ("you have anxiety") with growth framing ("you're navigating a stretch of heightened worry — building tolerance here is what recovery looks like").
- Add rule: never say "you have [disorder]". Say "you're recovering from…" or "focusing on [X] would strengthen this further."
- **Precaution mode:** if user mentions symptoms matching serious flags (suicidal ideation, self-harm, psychosis cues, severe panic, substance withdrawal), prepend the AI response with a rendered warning banner:
  > ⚠️ **Please read:** This is a wellness companion, not a doctor. What you're describing deserves a licensed professional's attention. Please reach out to a therapist, physician, or a crisis line ([iCall India: 9152987821](tel:9152987821), or your local equivalent).
- Server detects trigger keywords + Gemini classifier → returns `{safety_level: "info" | "caution" | "critical"}` alongside message.
- Client renders banner above bubble when `caution` or `critical`.
- Always-on footer under chat: *"Maya offers reflection, not diagnosis. For persistent or severe symptoms, consult a licensed professional."*

---

## Technical section (for reference)

**New tables:** `session_summaries`, `persona_cache`, `clinical_docs`
**New columns:** `therapy_sessions.rolling_summary`, `therapy_messages.is_archived`, `therapy_messages.archived_at`
**New edge functions:** `summarize-session`, `generate-persona`, `ingest-clinical-doc`
**New storage bucket:** `clinical-guides` (private)
**New extension:** `pgvector`
**Cron:** nightly session summarizer
**Client:** `useTTSQueue`, `MyPersona` SWR pattern, safety banner component, chat prompt trimming

---

## Suggested order (if you want to phase it)

1. **Reframe tone + safety banner** (fastest, biggest UX win, no schema)
2. **Persona cache** (removes a big latency pain point)
3. **Rolling summary in chat** (cost + latency win)
4. **TTS queue** (client-only, no backend)
5. **Session archival** (schema + cron)
6. **Clinical RAG** (biggest lift — requires you to upload PDFs)

---

**Reply with which items to build** (e.g. "do 1, 2, 6" or "all"). For #6 I'll also need you to say yes to enabling `pgvector` and creating the `clinical-guides` bucket — then upload the PDFs you want ingested.
