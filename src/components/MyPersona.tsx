import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const MyPersona = () => {
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState<string>("");
  const [mbtiResult, setMbtiResult] = useState<string | null>(null);

  useEffect(() => {
    loadMbtiResult();
    generatePersona();
  }, []);

  const loadMbtiResult = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Check localStorage for MBTI result
      const stored = localStorage.getItem(`mbti_result_${user.id}`);
      if (stored) setMbtiResult(stored);
    } catch {}
  };

  const generatePersona = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Gather all user data
      const [profileRes, sessionsRes, diaryRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("therapy_sessions").select("id, therapy_type, message_count, started_at").eq("user_id", user.id).order("started_at", { ascending: false }).limit(50),
        supabase.from("diary_entries").select("content, mood_sticker, theme, entry_date").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(20),
      ]);

      const profile = profileRes.data;
      const sessions = sessionsRes.data || [];
      const diary = diaryRes.data || [];

      // Get some recent messages for deeper insight
      let recentMessages: any[] = [];
      const sessionWithIds = sessions.slice(0, 5);
      for (const s of sessionWithIds) {
        const { data: msgs } = await supabase
          .from("therapy_messages")
          .select("content, role")
          .eq("session_id", s.id)
          .eq("role", "user")
          .order("created_at", { ascending: false })
          .limit(5);
        if (msgs) recentMessages.push(...msgs);
      }

      const therapyTypes = sessions.map(s => s.therapy_type);
      const typeCounts: Record<string, number> = {};
      therapyTypes.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });

      const totalSessions = sessions.length;
      const totalMessages = sessions.reduce((sum, s) => sum + (s.message_count || 0), 0);
      const moods = diary.map(d => d.mood_sticker).filter(Boolean);
      const diaryThemes = diary.map(d => d.theme).filter(Boolean);
      const userMessages = recentMessages.map(m => m.content).slice(0, 10);

      const storedMbti = localStorage.getItem(`mbti_result_${user.id}`);

      const hasEnoughData = totalMessages >= 10;

      const prompt = `You are a thoughtful, poetic personality analyst. Based on this person's therapy journey, create a beautiful, detailed persona reflection.

User Data:
- Name: ${profile?.full_name || profile?.username || "Dear soul"}
- Total sessions: ${totalSessions}, Total messages: ${totalMessages}
- Therapy types used: ${JSON.stringify(typeCounts)}
- Recent diary moods: ${moods.join(", ") || "No diary entries yet"}
- Diary themes: ${diaryThemes.join(", ") || "None"}
- Sample of what they've shared: ${userMessages.join(" | ").slice(0, 500) || "Not much data yet"}
${storedMbti ? `- MBTI Personality Type: ${storedMbti}` : ""}

Write a warm, beautifully themed persona reflection (300-400 words) that covers:
1. **Who they are** - Their personality type, emotional depth, and character. Even with minimal data, infer positive traits from the fact they sought therapy (courage, self-awareness, desire to grow).
2. **Their strengths** - Highlight key character strengths like bravery, curiosity, kindness, resilience, empathy. Be specific and affirming.
3. **Their growth pattern** - How they approach healing and self-improvement
4. **Their emotional landscape** - The feelings they navigate and how they handle them
${hasEnoughData ? `5. **A character they remind you of** - You MUST pick from one of these categories based on who fits best. NEVER use "Elizabeth Bennet" — that is BANNED.
   Pick ONE character from these categories that BEST matches their actual personality traits, communication style, and emotional patterns:
   - **Sports legends**: Dhoni (calm under pressure), Virat Kohli (passionate/intense), Messi (quiet genius), Serena Williams (fierce determination), Sachin (dedicated perfectionist)
   - **Anime/Manga**: Naruto (never gives up), Goku (pure-hearted warrior), Mikasa (protective/loyal), Itachi (self-sacrificing), Tanjiro (empathetic fighter), Luffy (free-spirited leader), Hinata (quiet courage)
   - **Indian mythology**: Arjuna (seeker of truth), Krishna (playful wisdom), Hanuman (devoted strength), Draupadi (fierce justice), Karna (generous warrior)
   - **Bollywood/Indian cinema**: Rancho from 3 Idiots (curious rebel), Kabir Singh (intense lover), Naina from YJHD (transformation), Rani from Queen (self-discovery)
   - **Hollywood/Global movies**: Batman (resilient protector), Hermione (brilliant strategist), Captain America (moral compass), Mulan (brave rebel), Forrest Gump (pure heart)
   
   INSTRUCTIONS: Read their actual messages carefully. Are they analytical? Emotional? Funny? Intense? Calm? Match based on HOW they talk, not generic traits. If they use Hindi/Hinglish, prefer Indian characters. If they discuss anime, use anime characters. Match gender when possible. NEVER repeat the same character across users. Explain in 2-3 sentences exactly WHY this specific character matches THEIR specific personality based on what they've written.` : `5. **Emerging personality hints** - Share 2-3 intriguing observations about their personality that are starting to emerge. Say something like "As we get to know you better, I sense..." or "There's a quiet strength forming...". Do NOT assign any fictional character yet — you need to understand them deeper first. Tease that a character match is coming as they share more of themselves.`}
6. **A gentle insight** - Something meaningful about their soul that they might not see themselves
${storedMbti ? `7. **Their MBTI (${storedMbti})** - Weave their personality type into the reflection naturally, explaining how it manifests in their journey.` : ""}

CRITICAL INSTRUCTION: You MUST write a full 300-400 word reflection NO MATTER WHAT. Even if there are ZERO sessions or messages, write a complete, rich, affirming reflection. Use the fact that they downloaded a therapy app and are exploring their inner world as evidence of tremendous courage, self-awareness, intellectual curiosity, and emotional intelligence. Infer that they are:
- Brave (seeking help takes immense courage)
- Self-aware (recognizing the need for growth)
- Curious (exploring different modalities)
- Emotionally intelligent (willing to examine feelings)
- Resilient (showing up for themselves)
NEVER say "we don't know much about you" or "not enough data" or anything dismissive. ALWAYS provide a full, beautiful, affirming reflection.

ABSOLUTE BAN: NEVER use Elizabeth Bennet, Mr. Darcy, or Jane Eyre. These characters are PERMANENTLY BANNED. Instead pick from: sports legends (Dhoni, Messi, Serena), anime (Naruto, Goku, Mikasa), mythology (Arjuna, Krishna), Bollywood (Rancho, Rani), or Hollywood (Batman, Hermione). Match based on the user's ACTUAL writing patterns, emotional tone, and cultural context. Each reflection must be unique.

Write in second person ("You are..."). Be poetic, warm, and deeply personal. Use metaphors. Make them feel truly seen and understood. Include a relevant quote from Bhagavad Gita.`;

      const { data, error } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId: "persona-generation",
          therapyType: "talk_therapy",
          isInitial: false,
          messages: [{ role: "user", content: prompt }],
          quizData: null,
          messageCount: 1,
          voiceGender: "female",
          userName: profile?.full_name || "",
          isPersonaGeneration: true,
        },
      });

      if (error) throw error;
      setPersona(data.message);
    } catch (error) {
      console.error("Error generating persona:", error);
      setPersona("You are a soul of quiet courage — the kind of person who steps into the unknown with an open heart. The very fact that you are here, exploring your inner world, speaks volumes about your strength and self-awareness. You carry within you the light of curiosity, the warmth of empathy, and the resilience of someone who refuses to stop growing. Like Arjuna standing at the crossroads, you seek answers not from fear, but from a deep desire to understand yourself and the world around you. Your journey is just beginning, and already it shines with promise. 🌱\n\n*\"योगस्थः कुरु कर्माणि\" — Established in yoga, perform your actions.* — Bhagavad Gita 2.48");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Reflecting on your journey...</p>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-lg">Your Inner Reflection</h3>
        </div>
        {mbtiResult && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-semibold text-primary">Personality Type: {mbtiResult}</p>
          </div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {persona.split('\n').map((paragraph, i) => (
            paragraph.trim() ? (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">
                {paragraph.replace(/\*\*(.*?)\*\*/g, '$1').trim()}
              </p>
            ) : null
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
