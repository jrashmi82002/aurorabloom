import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Send, Volume2, VolumeX, Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { PreSessionQuiz, QuizData } from "@/components/PreSessionQuiz";
import { SessionSidebar } from "@/components/SessionSidebar";
import { Logo } from "@/components/Logo";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const therapyTitles: Record<string, string> = {
  yogic: "Yogic Therapy",
  psychological: "Psychological Therapy",
  physiotherapy: "Physiotherapy",
  ayurveda: "Ayurveda Solutions",
  talk_therapy: "Talk Therapy",
  genz_therapy: "GenZ Therapy",
  female_therapy: "Female Therapy",
  male_therapy: "Male Therapy",
  older_therapy: "Senior Therapy",
  children_therapy: "Children's Therapy",
  millennial_therapy: "Millennial Therapy",
  advanced_therapy: "Advanced Therapy",
};

const Chat = () => {
  const [searchParams] = useSearchParams();
  const therapyType = searchParams.get("type") || "talk_therapy";
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(true);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("female");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const initializeSession = async (userId: string, quiz: QuizData) => {
    try {
      const { data: session, error } = await supabase
        .from("therapy_sessions")
        .insert({
          user_id: userId,
          therapy_type: therapyType as any,
          title: `${therapyTitles[therapyType]} Session`,
          has_quiz_completed: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Save quiz responses
      await supabase.from("quiz_responses").insert({
        session_id: session.id,
        user_id: userId,
        age_group: quiz.ageGroup,
        gender_identity: quiz.genderIdentity,
        current_mood_scales: { mood: quiz.currentMood, stress: quiz.stressLevel },
        therapy_goals: quiz.therapyGoals,
        previous_experience: quiz.previousExperience,
        custom_notes: quiz.customNotes,
      });

      // Update profile
      await supabase.from("profiles").upsert({
        id: userId,
        age_group: quiz.ageGroup,
        gender_identity: quiz.genderIdentity,
      });

      setSessionId(session.id);
      return session.id;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleQuizComplete = async (data: QuizData) => {
    setQuizData(data);
    setShowQuiz(false);

    if (!user) return;

    const newSessionId = await initializeSession(user.id, data);
    if (newSessionId) {
      sendInitialMessage(newSessionId, data);
    }
  };

  const loadExistingSession = async (sid: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from("therapy_messages")
        .select("role, content")
        .eq("session_id", sid)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      setSessionId(sid);
      setShowQuiz(false);
    } catch (error: any) {
      toast({
        title: "Error loading session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setSessionId(null);
    setShowQuiz(true);
    setQuizData(null);
  };

  const sendInitialMessage = async (sid: string, quiz: QuizData) => {
    try {
      const { data, error } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId: sid,
          therapyType,
          isInitial: true,
          quizData: quiz,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages([assistantMessage]);

      await supabase.from("therapy_messages").insert({
        session_id: sid,
        role: "assistant",
        content: data.message,
      });

      if (voiceEnabled) {
        speakText(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const speakText = async (text: string) => {
    if (!voiceEnabled) return;

    setIsSpeaking(true);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = voiceGender === "female" ? 1.1 : 0.9;

      const voices = speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) =>
          voiceGender === "female"
            ? v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Victoria")
            : v.name.includes("Male") || v.name.includes("Daniel") || v.name.includes("Alex")
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech error:", error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      await supabase.from("therapy_messages").insert({
        session_id: sessionId,
        role: "user",
        content: input,
      });

      const { data, error } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId,
          therapyType,
          messages: [...messages, userMessage],
          quizData,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      await supabase.from("therapy_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: data.message,
      });

      if (voiceEnabled) {
        speakText(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }, []);

  if (!user) return null;

  if (showQuiz) {
    return (
      <PreSessionQuiz
        userId={user.id}
        therapyType={therapyType}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex">
      <SessionSidebar
        userId={user.id}
        currentSessionId={sessionId}
        therapyType={therapyType}
        onSessionSelect={loadExistingSession}
        onNewSession={handleNewSession}
      />

      <div className="flex-1 flex flex-col">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-6 py-4 flex items-center gap-4">
            <Logo size="sm" showText={false} />
            <div className="flex-1">
              <h1 className="text-xl font-serif font-semibold">
                {therapyTitles[therapyType]}
              </h1>
              <p className="text-sm text-muted-foreground">
                Your personal healing session
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceGender(voiceGender === "female" ? "male" : "female")}
                className="text-xs"
              >
                {voiceGender === "female" ? "♀ Female" : "♂ Male"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    setVoiceEnabled(!voiceEnabled);
                  }
                }}
                className="shrink-0"
              >
                {isSpeaking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : voiceEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user"
                      ? "bg-gradient-calm text-white border-0"
                      : "bg-card"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.role === "assistant" && voiceEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs opacity-60 hover:opacity-100"
                      onClick={() => speakText(message.content)}
                      disabled={isSpeaking}
                    >
                      <Volume2 className="w-3 h-3 mr-1" />
                      Play
                    </Button>
                  )}
                </Card>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-4 bg-card">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-300" />
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 items-end">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Share your thoughts..."
              className="flex-1 h-12 transition-all duration-300 focus:shadow-gentle"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="h-12 px-6 bg-gradient-calm hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;
