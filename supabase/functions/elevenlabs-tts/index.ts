import { handlePreflight, corsHeaders, errorResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { parseJsonBody, z } from "../_shared/validation.ts";

const VOICE_MAP: Record<string, string> = {
  maya: "EXAVITQu4vr4xnSDxMaL",
  marcus: "onwK4e9ZLuTAKqWW03F9",
  priya: "cgSgspJ2msm6clMCkdW9",
  arjun: "TX3LPaxmHKxFdv7VOQHJ",
  eleanor: "Xb7hH8MSUJpSbSDYk0k2",
  james: "JBFqnCBsd6RMkjVDRZzb",
  krishna: "TX3LPaxmHKxFdv7VOQHJ",
  female: "EXAVITQu4vr4xnSDxMaL",
  male: "onwK4e9ZLuTAKqWW03F9",
};

const BodySchema = z.object({
  text: z.string().trim().min(1).max(5000),
  voiceGender: z.string().max(50).optional(),
});

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const body = await parseJsonBody(req, BodySchema);
  if (body instanceof Response) return body;

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return errorResponse("ELEVENLABS_API_KEY is not configured", 500);

    const voiceId = VOICE_MAP[body.voiceGender ?? "maya"] || VOICE_MAP.maya;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: body.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return errorResponse("TTS generation failed", 500);
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    console.error("elevenlabs-tts error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
  }
});
