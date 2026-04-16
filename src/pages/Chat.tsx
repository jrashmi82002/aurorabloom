import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Send, Volume2, VolumeX, Square, Play, PanelLeft, Pause, Loader2, FileText, Gamepad2, BookOpen, Newspaper, Sparkles, LogIn, X } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { PreSessionQuiz, QuizData } from "@/components/PreSessionQuiz";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { ScrollArea } from "@/components/ui/scroll-area";

// Guest sidebar with locked features
const GuestSidebar = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
  const navigate = useNavigate();

  const handleLockedNav = (path: string) => {
    navigate("/auth");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onToggle} />
      <aside className="fixed md:relative w-72 border-r border-border/50 bg-background/95 backdrop-blur-sm flex flex-col shrink-0 h-full animate-fade-in z-50">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <Logo size="sm" />
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 text-center text-muted-foreground text-sm">
            <p className="text-xs mb-2">Sign in to save your sessions</p>
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border/50 space-y-1 shrink-0">
          <Button variant="ghost" className="w-full justify-start gap-2 h-9 opacity-60" onClick={() => handleLockedNav("/report")}>
            <FileText className="w-4 h-4" /> Monthly Report
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 h-9 opacity-60" onClick={() => handleLockedNav("/activities")}>
            <Gamepad2 className="w-4 h-4" /> Therapy Activities
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 h-9 opacity-60" onClick={() => handleLockedNav("/diary")}>
            <BookOpen className="w-4 h-4" /> My Diary
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 h-9 opacity-60" onClick={() => handleLockedNav("/blog")}>
            <Newspaper className="w-4 h-4" /> Healing Blog
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-amber-600 dark:text-amber-400 opacity-60" onClick={() => handleLockedNav("/chat?type=krishna_chat")}>
            <Sparkles className="w-4 h-4" /> 🙏 Talk to Krishna
          </Button>
          <div className="pt-2 border-t border-border/30 mt-2">
            <Button variant="default" className="w-full justify-start gap-2 h-9 bg-gradient-calm" onClick={() => navigate("/auth")}>
              <LogIn className="w-4 h-4" /> Sign In
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

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
  female_therapy: "Female Therapy",
  male_therapy: "Male Therapy",
  older_therapy: "Senior Therapy",
  children_therapy: "Children's Therapy",
  advanced_therapy: "Custom Therapy",
  krishna_chat: "Talk to Krishna",
};

// Therapist names per voice
const getTherapistName = (voiceStyle: string, voiceOptions: { value: string; label: string }[]) => {
  const found = voiceOptions.find(v => v.value === voiceStyle);
  return found ? found.label.replace(/🇮🇳|🇬🇧/g, '').trim() : "Maya";
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
    "female_therapy" | "male_therapy" | "older_therapy" | 
    "children_therapy" | "advanced_therapy" | "krishna_chat";
  const existingSessionId = searchParams.get("session");
  const skipQuizParam = searchParams.get("skipQuiz") === "true" || therapyType === "krishna_chat";
  const firstMessageParam = searchParams.get("firstMessage");
  const isGuestMode = searchParams.get("guest") === "true";
  
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(!skipQuizParam && !isGuestMode);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("female");
  const [voiceStyle, setVoiceStyle] = useState<string>(therapyType === "krishna_chat" ? "krishna" : "maya");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null); // kept for future use
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Voice options - Krishna chat gets only Krishna voice, everyone gets 2 voices
  const voiceOptions = therapyType === "krishna_chat" 
    ? [{ value: "krishna", label: "Krishna", gender: "male" }]
    : [
      { value: "maya", label: "Maya", gender: "female" },
      { value: "marcus", label: "Marcus", gender: "male" },
    ];

  useEffect(() => {
    if (isGuestMode) {
      // Guest mode: show greeting immediately, no auth needed
      setShowQuiz(false);
      const greeting: Message = {
        role: "assistant",
        content: therapyType === "krishna_chat"
          ? `🙏 Hare Krishna, dear soul.\n\nI am here. Speak your heart — your joys, your sorrows, your questions about life.\n\nWhat weighs on your mind today?`
          : `Hello! 🌿 I'm here to listen and support you. This is a safe space — feel free to share whatever is on your mind.\n\nHow are you feeling today?`
      };
      setMessages([greeting]);
      if (firstMessageParam) {
        // Auto-send the first message from the home page
        handleGuestFirstMessage(greeting, firstMessageParam);
      }
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkExistingProfile(session.user.id);
        checkProStatus(session.user.id);
        
        if (existingSessionId) {
          loadExistingSession(existingSessionId);
        } else if (skipQuizParam) {
          initializeQuickSession(session.user.id);
        }
      }
    });
  }, [navigate, existingSessionId]);

  const handleGuestFirstMessage = async (greeting: Message, msg: string) => {
    const userMsg: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId: "guest-session",
          therapyType,
          isInitial: false,
          messages: [greeting, userMsg],
          quizData: null,
          messageCount: 2,
          voiceGender: "female",
          userName: "",
          isGuestMode: true,
        },
      });
      if (error) throw error;
      const reply: Message = { role: "assistant", content: data.message };
      setMessages(prev => [...prev, reply]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const checkProStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("pro_subscription_status")
      .eq("id", userId)
      .single();
    const status = profile?.pro_subscription_status;
    setIsPro(status === "yearly" || status === "monthly");
  };

  const checkExistingProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("age_group, gender_identity, full_name, username")
      .eq("id", userId)
      .single();

    if (profile?.age_group && profile?.gender_identity) {
      setHasExistingProfile(true);
    }
    if (profile?.full_name || profile?.username) {
      setUserName(profile.full_name || profile.username || "");
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

  const initializeQuickSession = async (userId: string) => {
    try {
      // For krishna_chat without firstMessage, just show greeting without creating session
      // Session will be created when user sends first message
      if (therapyType === "krishna_chat" && !firstMessageParam) {
        setShowQuiz(false);
        const greeting: Message = { 
          role: "assistant", 
          content: `🙏 Hare Krishna, dear soul.\n\nI am here. Speak your heart — your joys, your sorrows, your questions about life. I listen not as a stranger, but as the friend who resides within your very heart.\n\n*"सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥"*\n\n— Surrender unto Me, and I shall free you from all fears.\n\nWhat weighs on your mind today?` 
        };
        setMessages([greeting]);
        return;
      }

      const { data: session, error } = await supabase
        .from("therapy_sessions")
        .insert({
          user_id: userId,
          therapy_type: therapyType as any,
          title: generateSessionTitle(therapyType),
          has_quiz_completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);
      setShowQuiz(false);
      
      // Get initial greeting
      const { data: greetingData, error: greetingError } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId: session.id,
          therapyType,
          isInitial: true,
          quizData: null,
          messageCount: 0,
          voiceGender,
          userName,
        },
      });

      if (greetingError) throw greetingError;

      const greeting: Message = { role: "assistant", content: greetingData.message };
      setMessages([greeting]);

      await supabase.from("therapy_messages").insert({
        session_id: session.id,
        role: "assistant",
        content: greetingData.message,
      });


      // If there's a firstMessage from the quick input, auto-send it
      if (firstMessageParam) {
        const userMsg: Message = { role: "user", content: firstMessageParam };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        await supabase.from("therapy_messages").insert({
          session_id: session.id,
          role: "user",
          content: firstMessageParam,
        });

        const { data: replyData, error: replyError } = await supabase.functions.invoke("therapy-chat", {
          body: {
            sessionId: session.id,
            therapyType,
            messages: [greeting, userMsg],
            quizData: null,
            messageCount: 2,
            voiceGender,
            userName,
          },
        });

        if (replyError) throw replyError;

        const assistantReply: Message = { role: "assistant", content: replyData.message };
        setMessages(prev => [...prev, assistantReply]);

        await supabase.from("therapy_messages").insert({
          session_id: session.id,
          role: "assistant",
          content: replyData.message,
        });

        await supabase.from("therapy_sessions")
          .update({ message_count: 3 })
          .eq("id", session.id);

        setLoading(false);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
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
          userName,
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

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Clean text for speech - remove emojis, symbols, markdown, and punctuation artifacts
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
      .replace(/[\u{200D}]/gu, '')             // Zero-width joiner
      .replace(/[\u{E0020}-\u{E007F}]/gu, '') // Tags
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Extended-A symbols
      .replace(/[\u{2702}-\u{27B0}]/gu, '')   // More dingbats
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental symbols
      .replace(/[\u{1F018}-\u{1F270}]/gu, '') // Various symbols
      .replace(/[*_~`#|>]/g, '')              // Markdown symbols
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Markdown links → just text
      .replace(/```[\s\S]*?```/g, '')          // Code blocks
      .replace(/`([^`]*)`/g, '$1')             // Inline code → just text
      .replace(/^[-•]\s+/gm, '')              // List bullets
      .replace(/^\d+\.\s+/gm, '')             // Numbered lists
      .replace(/[""\u201C\u201D]/g, '')        // Curly/smart quotes
      .replace(/[''\u2018\u2019]/g, '')        // Smart single quotes
      .replace(/[—–]/g, ' ')                  // Em/en dashes to space
      .replace(/\.{3,}/g, ', ')               // Ellipsis to pause
      .replace(/[()[\]{}]/g, '')              // Brackets
      .replace(/\n{3,}/g, '\n\n')             // Excessive newlines
      .replace(/\s{2,}/g, ' ')                // Excessive spaces
      .trim();
  };

  // Browser-native TTS with male/female voice selection
  const speakText = (text: string) => {
    if (!voiceEnabled) return;
    
    stopSpeaking();
    setIsSpeaking(true);
    setIsPaused(false);
    setIsLoadingVoice(false);
    
    const cleanedText = cleanTextForSpeech(text);
    const synth = window.speechSynthesis;
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // Pick voice based on gender
    const isMaleVoice = voiceStyle === "marcus" || voiceStyle === "krishna" || voiceGender === "male";
    const voices = synth.getVoices();
    
    const pickVoice = () => {
      const available = synth.getVoices();
      if (available.length === 0) return;
      
      // Try to find a matching gender voice
      const genderKeywords = isMaleVoice ? ['male', 'david', 'james', 'daniel', 'mark'] : ['female', 'samantha', 'karen', 'zira', 'victoria'];
      const preferred = available.find(v => v.lang.startsWith('en') && genderKeywords.some(k => v.name.toLowerCase().includes(k)))
        || available.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'))
        || available.find(v => v.lang.startsWith('en') && !v.localService)
        || available.find(v => v.lang.startsWith('en'))
        || available[0];
      if (preferred) utterance.voice = preferred;
      
      synth.speak(utterance);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    // Voices may not be loaded yet
    if (voices.length === 0) {
      synth.onvoiceschanged = () => pickVoice();
      // Fallback if event doesn't fire
      setTimeout(() => { if (!synth.speaking) pickVoice(); }, 200);
    } else {
      pickVoice();
    }
  };

  const pauseSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (isSpeaking) stopSpeaking();

    // Guest mode - ephemeral chat
    if (isGuestMode) {
      const userMessage: Message = { role: "user", content: input };
      setMessages(prev => [...prev, userMessage]);
      const currentInput = input;
      setInput("");
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("therapy-chat", {
          body: {
            sessionId: "guest-session",
            therapyType,
            isInitial: false,
            messages: [...messages, userMessage],
            quizData: null,
            messageCount: messages.length + 1,
            voiceGender: voiceStyle || voiceGender,
            userName: "",
            isGuestMode: true,
          },
        });
        if (error) throw error;
        const reply: Message = { role: "assistant", content: data.message };
        setMessages(prev => [...prev, reply]);
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Check message limit for free users
    if (!isPro && user) {
      const { data: canSend } = await supabase.rpc("can_user_send_message", { user_id_param: user.id });
      if (!canSend) {
        toast({
          title: "Daily limit reached",
          description: "Your free message limit has been reached for today. Try therapy activities for now, or request Pro access for unlimited messaging.",
          variant: "destructive",
        });
        return;
      }
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId && user) {
        const { data: session, error: sessionError } = await supabase
          .from("therapy_sessions")
          .insert({
            user_id: user.id,
            therapy_type: therapyType as any,
            title: generateSessionTitle(therapyType),
            has_quiz_completed: false,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        currentSessionId = session.id;
        setSessionId(session.id);

        if (messages.length > 0 && messages[0].role === "assistant") {
          await supabase.from("therapy_messages").insert({
            session_id: session.id,
            role: "assistant",
            content: messages[0].content,
          });
        }
      }

      if (!currentSessionId) return;

      await supabase.from("therapy_messages").insert({
        session_id: currentSessionId,
        role: "user",
        content: input,
      });

      const { data, error } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId: currentSessionId,
          therapyType,
          messages: [...messages, userMessage],
          quizData,
          messageCount: messages.length + 1,
          voiceGender: therapyType === "krishna_chat" ? "krishna" : voiceStyle || voiceGender,
          userName,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages((prev) => [...prev, assistantMessage]);

      await supabase.from("therapy_messages").insert({
        session_id: currentSessionId,
        role: "assistant",
        content: data.message,
      });

      await supabase
        .from("therapy_sessions")
        .update({ message_count: messages.length + 2 })
        .eq("id", currentSessionId);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const therapistName = getTherapistName(voiceStyle || voiceGender, voiceOptions);

  if (!user && !isGuestMode) return null;

  if (showQuiz && !existingSessionId && user) {
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
      {user ? (
        <AppSidebar userId={user.id} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      ) : (
        <GuestSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      )}

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
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-serif font-semibold truncate">
                {therapyTitles[therapyType]}
              </h1>
              {therapyType !== "krishna_chat" && (
                <p className="text-sm text-muted-foreground">
                  with {therapistName} 🌿
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {therapyType !== "krishna_chat" && (
                <select
                  value={voiceStyle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVoiceGender(val.startsWith("male") || val === "marcus" || val === "arjun" || val === "james" ? "male" : "female");
                    setVoiceStyle(val);
                  }}
                  className="text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {voiceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
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
              <ThemeToggle />
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
                        {isLoadingVoice && isSpeaking && !isPaused ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs opacity-60"
                            disabled
                          >
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Loading...
                          </Button>
                        ) : isSpeaking ? (
                          <>
                            {isPaused ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs opacity-60 hover:opacity-100"
                                onClick={resumeSpeaking}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Resume
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs opacity-60 hover:opacity-100"
                                onClick={pauseSpeaking}
                              >
                                <Pause className="w-3 h-3 mr-1" />
                                Pause
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs opacity-60 hover:opacity-100"
                              onClick={stopSpeaking}
                            >
                              <Square className="w-3 h-3 mr-1" />
                              Stop
                            </Button>
                          </>
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
