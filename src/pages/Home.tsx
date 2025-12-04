import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, LogOut, Sparkles, Activity, FlowerIcon, MessageCircle, Users, Brain, Baby, Zap } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { ProAccessRequest } from "@/components/ProAccessRequest";
import { Logo } from "@/components/Logo";
import { SessionHistorySidebar } from "@/components/SessionHistorySidebar";

const therapyTypes = [
  {
    id: "yogic",
    title: "Yogic Therapy",
    description: "Ancient wisdom through breathing, meditation, and mindful movement",
    icon: FlowerIcon,
    color: "from-purple-400 to-purple-600",
  },
  {
    id: "psychological",
    title: "Psychological Therapy",
    description: "Evidence-based cognitive and emotional support",
    icon: Sparkles,
    color: "from-blue-400 to-blue-600",
  },
  {
    id: "physiotherapy",
    title: "Physiotherapy",
    description: "Physical rehabilitation and movement therapy",
    icon: Activity,
    color: "from-green-400 to-green-600",
  },
  {
    id: "ayurveda",
    title: "Ayurveda Solutions",
    description: "Holistic wellness through natural remedies",
    icon: Leaf,
    color: "from-emerald-400 to-emerald-600",
  },
  {
    id: "talk_therapy",
    title: "Talk Therapy",
    description: "Compassionate conversation with a caring therapist",
    icon: MessageCircle,
    color: "from-pink-400 to-pink-600",
  },
  {
    id: "genz_therapy",
    title: "GenZ Therapy",
    description: "For the digital native dealing with modern pressures",
    icon: Zap,
    color: "from-cyan-400 to-cyan-600",
  },
  {
    id: "female_therapy",
    title: "Female Therapy",
    description: "Support tailored to women's unique experiences",
    icon: Users,
    color: "from-rose-400 to-rose-600",
  },
  {
    id: "male_therapy",
    title: "Male Therapy",
    description: "A safe space for men to open up and heal",
    icon: Users,
    color: "from-slate-400 to-slate-600",
  },
  {
    id: "older_therapy",
    title: "Senior Therapy",
    description: "Wisdom-informed support for life's later chapters",
    icon: Brain,
    color: "from-amber-400 to-amber-600",
  },
  {
    id: "children_therapy",
    title: "Children's Therapy",
    description: "Gentle, age-appropriate emotional support",
    icon: Baby,
    color: "from-orange-400 to-orange-600",
  },
  {
    id: "millennial_therapy",
    title: "Millennial Therapy",
    description: "Navigating adulting, careers, and life balance",
    icon: Sparkles,
    color: "from-indigo-400 to-indigo-600",
  },
];

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const startSession = (therapyType: string) => {
    navigate(`/chat?type=${therapyType}`);
  };

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-soft">
      {/* Left Sidebar - Session History */}
      <aside className="w-72 border-r border-border/50 bg-background/80 backdrop-blur-sm flex flex-col shrink-0">
        <div className="p-4 border-b border-border/50">
          <Logo size="md" />
        </div>
        <div className="flex-1 overflow-hidden">
          <SessionHistorySidebar userId={user.id} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-serif font-bold">Choose Your Path</h1>
              <p className="text-sm text-muted-foreground">Select a therapy type to begin or continue</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {therapyTypes.map((therapy) => {
                const Icon = therapy.icon;
                return (
                  <Card
                    key={therapy.id}
                    className="group hover:shadow-calm transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0"
                    onClick={() => startSession(therapy.id)}
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${therapy.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg font-serif">{therapy.title}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {therapy.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button className="w-full bg-gradient-calm hover:opacity-90 transition-opacity" size="sm">
                        Begin Session
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-12">
              <ProAccessRequest />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
