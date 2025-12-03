import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, LogOut, Sparkles, Activity, FlowerIcon, MessageCircle, Users, Brain, Baby, Zap } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { ProAccessRequest } from "@/components/ProAccessRequest";
import { Logo } from "@/components/Logo";

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
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="md" />
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-calm bg-clip-text text-transparent">
            Your Journey to Wellness
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a therapy path that resonates with you. Our AI-powered therapist will guide you 
            through personalized sessions designed to help you heal and grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {therapyTypes.map((therapy) => {
            const Icon = therapy.icon;
            return (
              <Card
                key={therapy.id}
                className="group hover:shadow-calm transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0"
                onClick={() => startSession(therapy.id)}
              >
                <CardHeader className="space-y-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${therapy.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl font-serif">{therapy.title}</CardTitle>
                  <CardDescription className="text-base">
                    {therapy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-gradient-calm hover:opacity-90 transition-opacity">
                    Begin Session
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto mt-16">
          <ProAccessRequest />
        </div>
      </main>
    </div>
  );
};

export default Home;