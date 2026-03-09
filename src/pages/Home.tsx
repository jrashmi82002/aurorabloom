import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Sparkles, Activity, FlowerIcon, MessageCircle, Users, Brain, Baby, PanelLeft, HelpCircle, Sun } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileIcon } from "@/components/ProfileIcon";

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

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const startSession = (therapyType: string) => navigate(`/chat?type=${therapyType}`);

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-soft">
      <AppSidebar userId={user.id} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-6 py-4 flex items-center gap-3">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <PanelLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-serif font-bold">Choose Your Path</h1>
              <p className="text-sm text-muted-foreground">Select a therapy type to begin or continue</p>
            </div>
            <NotificationBell />
            <ThemeToggle />
            <ProfileIcon />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
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
        </main>
      </div>
    </div>
  );
};

export default Home;
