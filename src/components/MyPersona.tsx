import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const MyPersona = () => {
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState<string>("");

  useEffect(() => {
    generatePersona();
  }, []);

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
      const recentSessionIds = sessions.slice(0, 5).map(s => s.id);
      let recentMessages: any[] = [];
      if (recentSessionIds.length > 0) {
        // Load messages from therapy_sessions first
        const sessionWithIds = sessions.slice(0, 5);
        for (const s of sessionWithIds) {
          const { data: msgs } = await supabase
            .from("therapy_messages")
            .select("content, role")
            .eq("session_id", (s as any).id || s)
            .eq("role", "user")
            .order("created_at", { ascending: false })
            .limit(5);
          if (msgs) recentMessages.push(...msgs);
        }
      }

      const therapyTypes = sessions.map(s => s.therapy_type);
      const typeCounts: Record<string, number> = {};
      therapyTypes.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });

      const totalSessions = sessions.length;
      const totalMessages = sessions.reduce((sum, s) => sum + (s.message_count || 0), 0);
      const moods = diary.map(d => d.mood_sticker).filter(Boolean);
      const diaryThemes = diary.map(d => d.theme).filter(Boolean);
      const userMessages = recentMessages.map(m => m.content).slice(0, 10);

      const prompt = `You are a thoughtful, poetic personality analyst. Based on this person's therapy journey, create a beautiful, detailed persona reflection.

User Data:
- Name: ${profile?.full_name || profile?.username || "Dear soul"}
- Total sessions: ${totalSessions}, Total messages: ${totalMessages}
- Therapy types used: ${JSON.stringify(typeCounts)}
- Recent diary moods: ${moods.join(", ") || "No diary entries yet"}
- Diary themes: ${diaryThemes.join(", ") || "None"}
- Sample of what they've shared: ${userMessages.join(" | ").slice(0, 500) || "Not much data yet"}

Write a warm, beautifully themed persona reflection (300-400 words) that covers:
1. **Who they are** - Their personality type, emotional depth, and character
2. **Their strengths** - What their therapy journey reveals about their inner strength
3. **Their growth pattern** - How they approach healing and self-improvement
4. **Their emotional landscape** - The feelings they navigate and how they handle them
5. **A character they remind you of** - From movies, anime, literature, or mythology (explain why)
6. **A gentle insight** - Something meaningful about their soul that they might not see themselves

Write in second person ("You are..."). Be poetic, warm, and deeply personal. Use metaphors. Make them feel truly seen and understood. Include a relevant quote from Bhagavad Gita if fitting.

If there's very little data, still write something warm and encouraging based on the fact that they've started this journey.`;

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
      setPersona("We're still getting to know you. Keep journaling, chatting, and exploring — your persona reflection will bloom as your journey unfolds. 🌱");
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
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {persona.split('\n').map((paragraph, i) => (
            paragraph.trim() ? (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">
                {paragraph.replace(/\*\*(.*?)\*\*/g, '').trim()}
              </p>
            ) : null
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
