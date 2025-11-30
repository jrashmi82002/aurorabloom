import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Send, Mic, MicOff, Phone } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [searchParams] = useSearchParams();
  const therapyType = searchParams.get("type") || "talk_therapy";
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const therapyTitles: Record<string, string> = {
    yogic: "Yogic Therapy",
    psychological: "Psychological Therapy",
    physiotherapy: "Physiotherapy",
    ayurveda: "Ayurveda Solutions",
    talk_therapy: "Talk Therapy",
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        initializeSession(session.user.id);
      }
    });
  }, [navigate]);

  const initializeSession = async (userId: string) => {
    try {
      const { data: session, error } = await supabase
        .from("therapy_sessions")
        .insert({
          user_id: userId,
          therapy_type: therapyType as "yogic" | "psychological" | "physiotherapy" | "ayurveda" | "talk_therapy",
          title: `${therapyTitles[therapyType]} Session`,
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(session.id);

      // Send initial AI greeting
      sendInitialMessage(session.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendInitialMessage = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId,
          therapyType,
          isInitial: true,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages([assistantMessage]);

      // Save to database
      await supabase.from("therapy_messages").insert({
        session_id: sessionId,
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

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Save user message
      await supabase.from("therapy_messages").insert({
        session_id: sessionId,
        role: "user",
        content: input,
      });

      // Get AI response
      const { data, error } = await supabase.functions.invoke("therapy-chat", {
        body: {
          sessionId,
          therapyType,
          messages: [...messages, userMessage],
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save AI response
      await supabase.from("therapy_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: data.message,
      });
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

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-serif font-semibold">
              {therapyTitles[therapyType]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Your personal healing session
            </p>
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
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
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 h-12 w-12"
          >
            <Mic className="w-5 h-5" />
          </Button>
          <div className="flex-1 flex gap-2">
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
  );
};

export default Chat;