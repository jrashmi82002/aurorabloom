import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Non-blocking TTS queue. Enqueue text -> a worker fetches audio in
 * background; the next request pre-fetches while the current one plays.
 * The UI thread never waits on ElevenLabs.
 */
export function useTTSQueue(voice?: string) {
  const queue = useRef<Array<{ id: string; text: string }>>([]);
  const running = useRef(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [pending, setPending] = useState(0);

  const fetchAudio = async (text: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
        body: { text, voiceGender: voice ?? "female" },
      });
      if (error || !data) return null;
      // Edge function returns audio/mpeg; supabase-js wraps binary as Blob
      const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: "audio/mpeg" });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  };

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    while (queue.current.length > 0) {
      const next = queue.current.shift()!;
      // Pre-fetch the item after this one in parallel
      const lookahead = queue.current[0] ? fetchAudio(queue.current[0].text) : null;
      const url = await fetchAudio(next.text);
      setPending((p) => Math.max(0, p - 1));
      if (!url) continue;
      setSpeakingId(next.id);
      audio.current = new Audio(url);
      await new Promise<void>((resolve) => {
        audio.current!.onended = () => resolve();
        audio.current!.onerror = () => resolve();
        audio.current!.play().catch(() => resolve());
      });
      setSpeakingId(null);
      URL.revokeObjectURL(url);
      if (lookahead) {
        // seed cache — lookahead result is discarded; browser cache keeps it
        await lookahead;
      }
    }
    running.current = false;
  }, []);

  const enqueue = useCallback(
    (id: string, text: string) => {
      queue.current.push({ id, text });
      setPending((p) => p + 1);
      pump();
    },
    [pump],
  );

  const stopAll = useCallback(() => {
    queue.current = [];
    setPending(0);
    if (audio.current) {
      audio.current.pause();
      audio.current = null;
    }
    setSpeakingId(null);
  }, []);

  return { enqueue, stopAll, speakingId, pending };
}
