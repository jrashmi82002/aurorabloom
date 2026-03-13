import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Leaf, Sparkles, Activity, FlowerIcon, MessageCircle, Users, Brain, Baby, PanelLeft, HelpCircle, Sun, Send, ChevronDown } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileIcon } from "@/components/ProfileIcon";
import { useToast } from "@/components/ui/use-toast";

const therapyTypes = [
  { id: "yogic", title: "Yogic Therapy", description: "Ancient wisdom through breathing, meditation, and mindful movement", icon: FlowerIcon, color: "from-purple-400 to-purple-600" },
  { id: "psychological", title: "Psychological Therapy", description: "Evidence-based cognitive and emotional support", icon: Sparkles, color: "from-blue-400 to-blue-600" },
  { id: "physiotherapy", title: "Physiotherapy", description: "Physical rehabilitation and movement therapy", icon: Activity, color: "from-green-400 to-green-600" },
  { id: "ayurveda", title: "Ayurveda Solutions", description: "Holistic wellness through natural remedies", icon: Leaf, color: "from-emerald-400 to-emerald-600" },
  { id: "talk_therapy", title: "Talk Therapy", description: "Compassionate conversation with a caring therapist", icon: MessageCircle, color: "from-pink-400 to-pink-600" },
  { id: "female_therapy", title: "Female Therapy", description: "Support tailored to women's unique experiences", icon: Users, color: "from-rose-400 to-rose-600" },
  { id: "male_therapy", title: "Male Therapy", description: "A safe space for men to open up and heal", icon: Users, color: "from-slate-400 to-slate-600" },
  { id: "older_therapy", title: "Senior Therapy", description: "Wisdom-informed support for life's later chapters", icon: Brain, color: "from-amber-400 to-amber-600" },
  { id: "children_therapy", title: "Children's Therapy", description: "Gentle, age-appropriate emotional support", icon: Baby, color: "from-orange-400 to-orange-600" },
  { id: "advanced_therapy", title: "Custom Therapy", description: "Tell us your specific needs and get personalized support", icon: HelpCircle, color: "from-cyan-400 to-teal-600" },
  { id: "krishna_chat", title: "🙏 Talk to Krishna", description: "A divine conversation with Lord Krishna - surrender your worries, receive eternal wisdom", icon: Sun, color: "from-amber-300 to-yellow-500" },
];

const heroText = "How are you feeling?";

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setUser(session.user);
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    setTypingDone(false);
    const interval = setInterval(() => {
      if (i < heroText.length) {
        setDisplayedText(heroText.slice(0, i + 1));
        i++;
      } else {
        setTypingDone(true);
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const startSession = (therapyType: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(`/chat?type=${therapyType}`);
  };

  const handleQuickChat = () => {
    if (!quickInput.trim()) return;

    if (user) {
      navigate(`/chat?type=talk_therapy&skipQuiz=true&firstMessage=${encodeURIComponent(quickInput.trim())}`);
    } else {
      navigate(`/chat?type=talk_therapy&guest=true&skipQuiz=true&firstMessage=${encodeURIComponent(quickInput.trim())}`);
    }
  };

  const scrollToTherapies = () => {
    document.getElementById("therapy-types")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProtectedNav = (path: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(path);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-soft">
      {user && <AppSidebar userId={user.id} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-6 py-4 flex items-center gap-3">
            {user && !sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <PanelLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1" />
            {user && <NotificationBell />}
            <ThemeToggle />
            <ProfileIcon />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          {/* Calming background animations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-float-slow" />
            <div className="absolute bottom-1/3 -right-16 w-64 h-64 rounded-full bg-accent/8 blur-3xl animate-float-slow-reverse" />
            <div className="absolute top-2/3 left-1/3 w-48 h-48 rounded-full bg-primary/3 blur-2xl animate-float-gentle" />
          </div>

          {/* Hero section with quick chat */}
          <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center px-6 relative">
            <div className="max-w-2xl w-full text-center space-y-8">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {displayedText}
                  {!typingDone && <span className="animate-pulse ml-0.5 text-primary">|</span>}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Just start typing — no judgements, no waiting. Your therapist is here.
                </p>
              </div>

              {/* Quick chat input */}
              <div className="flex gap-3 max-w-xl mx-auto">
                <Input
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickChat()}
                  placeholder="I've been feeling anxious lately..."
                  className="flex-1 h-14 text-base px-5 rounded-2xl border-2 border-border/60 focus:border-primary/50 transition-all duration-300 focus:shadow-gentle"
                />
                <Button
                  onClick={handleQuickChat}
                  disabled={!quickInput.trim()}
                  className="h-14 px-6 rounded-2xl bg-gradient-calm hover:opacity-90 transition-opacity"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Scroll indicator */}
            <button
              onClick={scrollToTherapies}
              className="absolute bottom-8 flex flex-col items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors animate-bounce"
            >
              <span className="text-xs">Or choose a therapy type</span>
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Therapy types section */}
          <div id="therapy-types" className="px-6 pb-12 pt-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-serif font-bold">Choose Your Path</h2>
                <p className="text-sm text-muted-foreground mt-1">Select a therapy type for a more focused session</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {therapyTypes.map((therapy) => {
                  const Icon = therapy.icon;
                  return (
                    <Card key={therapy.id} className="group hover:shadow-calm transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 animate-fade-in" onClick={() => startSession(therapy.id)}>
                      <CardHeader className="space-y-3 pb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${therapy.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-lg font-serif">{therapy.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{therapy.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button className="w-full bg-gradient-calm hover:opacity-90 transition-opacity" size="sm">Begin Session</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
