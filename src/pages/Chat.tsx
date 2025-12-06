import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Send, Volume2, VolumeX, Square, Home, Play, PanelLeftClose, PanelLeft } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { PreSessionQuiz, QuizData } from "@/components/PreSessionQuiz";
import { Logo } from "@/components/Logo";
import { SessionHistorySidebar } from "@/components/SessionHistorySidebar";

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

// Therapist names per therapy type and gender
const getTherapistName = (therapyType: string, gender: "male" | "female") => {
  if (therapyType === "yogic") {
    return gender === "female" ? "Jaya" : "Vishesh";
  }
  return gender === "female" ? "Maya" : "Marcus";
};

// Generate session title based on date/time
const generateSessionTitle = (therapyType: string) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${therapyTitles[therapyType]} - ${dateStr} ${timeStr}`;
};

const Chat = () => {
  const [searchParams] = useSearchParams();
  const therapyType = (searchParams.get("type") || "talk_therapy") as 
    "yogic" | "psychological" | "physiotherapy" | "ayurveda" | "talk_therapy" | 
    "genz_therapy" | "female_therapy" | "male_therapy" | "older_therapy" | 
    "children_therapy" | "millennial_therapy" | "advanced_therapy";
  const existingSessionId = searchParams.get("session");
  
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
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkExistingProfile(session.user.id);
        
        // If there's an existing session ID in URL, load it
        if (existingSessionId) {
          loadExistingSession(existingSessionId);
        }
      }
    });
  }, [navigate, existingSessionId]);

  const checkExistingProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("age_group, gender_identity")
      .eq("id", userId)
      .single();

    if (profile?.age_group && profile?.gender_identity) {
      setHasExistingProfile(true);
    }
  };

  const initializeSession = async (userId: string, quiz: QuizData) => {
    try {
      const { data: session, error } = await supabase
        .from("therapy_sessions")
        .insert({
          user_id: userId,
          therapy_type: therapyType as any,
          title: generateSessionTitle(therapyType),
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

      // Update profile with demographics if not already set
      if (!hasExistingProfile && quiz.ageGroup && quiz.genderIdentity) {
        await supabase.from("profiles").upsert({
          id: userId,
          age_group: quiz.ageGroup,
          gender_identity: quiz.genderIdentity,
        });
      }

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

      // Also load quiz data for context
      const { data: quizResponse } = await supabase
        .from("quiz_responses")
        .select("*")
        .eq("session_id", sid)
        .single();

      if (quizResponse) {
        setQuizData({
          ageGroup: quizResponse.age_group || "",
          genderIdentity: quizResponse.gender_identity || "",
          currentMood: (quizResponse.current_mood_scales as any)?.mood || 5,
          stressLevel: (quizResponse.current_mood_scales as any)?.stress || 5,
          therapyGoals: quizResponse.therapy_goals || [],
          previousExperience: quizResponse.previous_experience || "",
          customNotes: quizResponse.custom_notes || "",
          specificConcerns: [],
        });
      }

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

  const sendInitialMessage = async (sid: string, quiz: QuizData) => {
    try {
      // Fetch previous sessions for context
      const { data: previousSessions } = await supabase
        .from("therapy_sessions")
        .select("id, therapy_type, started_at")
        .eq("user_id", user?.id)
        .eq("therapy_type", therapyType)
        .neq("id", sid)
        .order("started_at", { ascending: false })
        .limit(3);

      const { data, error } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId: sid,
          therapyType,
          isInitial: true,
          quizData: quiz,
          hasPreviousSessions: previousSessions && previousSessions.length > 0,
          messageCount: 0,
          voiceGender,
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
    speechSynthesis.cancel();
    setIsSpeaking(true);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      
      const voices = speechSynthesis.getVoices();
      let preferredVoice;
      
      // Maya = female voice, Marcus = American male, Jaya = Indian female, Vishesh = Indian male
      if (therapyType === "yogic") {
        if (voiceGender === "female") {
          // Jaya - Indian female voice
          utterance.pitch = 1.15;
          preferredVoice = voices.find(v => v.lang.includes("hi") || v.lang.includes("en-IN")) 
            || voices.find(v => v.name.includes("Veena") || v.name.includes("Lekha"))
            || voices.find(v => v.name.includes("Female") || v.name.includes("Samantha"));
        } else {
          // Vishesh - Indian male voice
          utterance.pitch = 0.85;
          preferredVoice = voices.find(v => v.lang.includes("hi") || v.lang.includes("en-IN"))
            || voices.find(v => v.name.includes("Ravi"))
            || voices.find(v => v.name.includes("Male") || v.name.includes("Daniel"));
        }
      } else {
        if (voiceGender === "female") {
          // Maya - Female voice
          utterance.pitch = 1.1;
          preferredVoice = voices.find(v => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Victoria"))
            || voices.find(v => v.name.toLowerCase().includes("female"));
        } else {
          // Marcus - American male voice
          utterance.pitch = 0.9;
          preferredVoice = voices.find(v => v.name.includes("Alex") || v.name.includes("Tom") || v.name.includes("Daniel"))
            || voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("male"));
        }
      }
      
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
          messageCount: messages.length + 1,
          voiceGender,
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

      // Update message count
      await supabase
        .from("therapy_sessions")
        .update({ message_count: messages.length + 2 })
        .eq("id", sessionId);

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

  const therapistName = getTherapistName(therapyType, voiceGender);

  if (!user) return null;

  if (showQuiz && !existingSessionId) {
    return (
      <PreSessionQuiz
        userId={user.id}
        therapyType={therapyType}
        onComplete={handleQuizComplete}
        hasExistingProfile={hasExistingProfile}
      />
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-soft">
      <AppSidebar userId={user.id} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-4 py-3 flex items-center gap-3">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="shrink-0">
                <PanelLeft className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <Home className="w-5 h-5" />
            </Button>
            <Logo size="sm" showText={false} />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-serif font-semibold truncate">
                {therapyTitles[therapyType]}
              </h1>
              <p className="text-sm text-muted-foreground">
                with {therapistName} 🌿
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceGender(voiceGender === "female" ? "male" : "female")}
                className="text-xs"
              >
                {voiceGender === "female" ? `♀ ${getTherapistName(therapyType, "female")}` : `♂ ${getTherapistName(therapyType, "male")}`}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="shrink-0"
              >
                {voiceEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Messages Area - Fixed height with scroll */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <Card
                    className={`max-w-[85%] p-4 ${
                      message.role === "user"
                        ? "bg-gradient-calm text-white border-0"
                        : "bg-card"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.role === "assistant" && voiceEnabled && (
                      <div className="flex gap-2 mt-2">
                        {isSpeaking ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs opacity-60 hover:opacity-100"
                            onClick={stopSpeaking}
                          >
                            <Square className="w-3 h-3 mr-1" />
                            Stop
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs opacity-60 hover:opacity-100"
                            onClick={() => speakText(message.content)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                        )}
                      </div>
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
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm px-4 py-3">
            <div className="max-w-3xl mx-auto flex gap-2">
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;
