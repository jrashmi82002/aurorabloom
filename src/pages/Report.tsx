import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Calendar, MessageCircle, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface MonthlyStats {
  totalSessions: number;
  totalMessages: number;
  therapyTypeCounts: Record<string, number>;
  moodTrend: string;
  topGoals: string[];
  insights: string;
  funnyNote: string;
}

const therapyLabels: Record<string, string> = {
  yogic: "Yogic Therapy",
  psychological: "Psychological",
  physiotherapy: "Physiotherapy",
  ayurveda: "Ayurveda",
  talk_therapy: "Talk Therapy",
  genz_therapy: "GenZ Therapy",
  female_therapy: "Female Therapy",
  male_therapy: "Male Therapy",
  older_therapy: "Senior Therapy",
  children_therapy: "Children's Therapy",
  millennial_therapy: "Millennial Therapy",
  advanced_therapy: "Advanced Therapy",
};

const Report = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchMonthlyStats(session.user.id, selectedMonth);
      }
    });
  }, [navigate, selectedMonth]);

  const fetchMonthlyStats = async (userId: string, month: Date) => {
    setLoading(true);
    try {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      // Fetch sessions for the month
      const { data: sessions } = await supabase
        .from("therapy_sessions")
        .select("id, therapy_type, message_count")
        .eq("user_id", userId)
        .gte("started_at", start.toISOString())
        .lte("started_at", end.toISOString());

      // Fetch quiz responses for goals
      const { data: quizResponses } = await supabase
        .from("quiz_responses")
        .select("therapy_goals, current_mood_scales")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (sessions && sessions.length > 0) {
        const therapyTypeCounts: Record<string, number> = {};
        let totalMessages = 0;

        sessions.forEach((s) => {
          therapyTypeCounts[s.therapy_type] = (therapyTypeCounts[s.therapy_type] || 0) + 1;
          totalMessages += s.message_count || 0;
        });

        // Collect all goals
        const allGoals: string[] = [];
        quizResponses?.forEach((q) => {
          if (q.therapy_goals) {
            allGoals.push(...q.therapy_goals);
          }
        });

        // Count goal frequency
        const goalCounts: Record<string, number> = {};
        allGoals.forEach((g) => {
          goalCounts[g] = (goalCounts[g] || 0) + 1;
        });
        const topGoals = Object.entries(goalCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([goal]) => goal);

        // Calculate mood trend
        const moods: number[] = [];
        quizResponses?.forEach((q) => {
          const scales = q.current_mood_scales as any;
          if (scales?.mood) moods.push(scales.mood);
        });

        let moodTrend = "steady";
        if (moods.length >= 2) {
          const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
          const secondHalf = moods.slice(Math.floor(moods.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          if (secondAvg > firstAvg + 0.5) moodTrend = "improving";
          else if (secondAvg < firstAvg - 0.5) moodTrend = "needs attention";
        }

        setStats({
          totalSessions: sessions.length,
          totalMessages,
          therapyTypeCounts,
          moodTrend,
          topGoals,
          insights: generateInsights(sessions.length, totalMessages, therapyTypeCounts, moodTrend),
          funnyNote: generateFunnyNote(sessions.length, moodTrend),
        });
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (
    sessions: number,
    messages: number,
    typeCounts: Record<string, number>,
    mood: string
  ): string => {
    const mostUsed = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    
    let insight = `This month, you engaged in ${sessions} therapy session${sessions !== 1 ? 's' : ''} with ${messages} total messages. `;
    
    if (mostUsed) {
      insight += `You seemed drawn to ${therapyLabels[mostUsed[0]] || mostUsed[0]}, which suggests you're focusing on that aspect of your wellbeing. `;
    }
    
    if (mood === "improving") {
      insight += "Your mood has shown positive trends throughout the month - that's real progress! 🌟";
    } else if (mood === "needs attention") {
      insight += "Your mood has had some ups and downs - remember, healing isn't linear, and seeking help is a sign of strength. 💪";
    } else {
      insight += "You've been consistent in checking in with yourself - that awareness is the foundation of growth. ✨";
    }
    
    return insight;
  };

  const generateFunnyNote = (sessions: number, mood: string): string => {
    const funnyNotes = [
      "Remember: You're basically a mental health athlete now. Where's your trophy? 🏆",
      "Plot twist: The real therapy was the sessions we had along the way! 😄",
      "You showed up for yourself this month. Your past self is proud, and your future self is grateful! 🌈",
      "Fun fact: You've officially spent more time on self-improvement than most people spend deciding what to watch on Netflix. Champion! 📺➡️🧘",
      "If self-care was a sport, you'd be getting scouted right now. Keep it up! ⚡",
      "Your brain cells called - they said thanks for the workout! 🧠💪",
      "Somewhere, a butterfly just flapped its wings because you did therapy this month. That's basically science. 🦋",
    ];
    
    if (sessions >= 10) {
      return "WOW! " + sessions + " sessions?! You're not just working on yourself, you're speedrunning personal growth! 🚀 " + funnyNotes[Math.floor(Math.random() * funnyNotes.length)];
    }
    
    return funnyNotes[Math.floor(Math.random() * funnyNotes.length)];
  };

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + 1);
    if (next <= new Date()) {
      setSelectedMonth(next);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Logo size="sm" showText={false} />
          <div className="flex-1">
            <h1 className="text-xl font-serif font-semibold">Monthly Therapy Report</h1>
            <p className="text-sm text-muted-foreground">Your journey at a glance</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            ← Previous
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{format(selectedMonth, "MMMM yyyy")}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            disabled={selectedMonth >= startOfMonth(new Date())}
          >
            Next →
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.totalSessions}</p>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.totalMessages}</p>
                      <p className="text-sm text-muted-foreground">Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      stats.moodTrend === "improving" 
                        ? "bg-gradient-to-br from-green-400 to-green-600"
                        : stats.moodTrend === "needs attention"
                        ? "bg-gradient-to-br from-amber-400 to-amber-600"
                        : "bg-gradient-to-br from-cyan-400 to-cyan-600"
                    }`}>
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold capitalize">{stats.moodTrend}</p>
                      <p className="text-sm text-muted-foreground">Mood Trend</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Therapy Types Used */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Therapy Types Explored</CardTitle>
                <CardDescription>Your sessions by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.therapyTypeCounts).map(([type, count]) => (
                    <div
                      key={type}
                      className="px-3 py-2 bg-primary/10 rounded-lg text-sm"
                    >
                      <span className="font-medium">{therapyLabels[type] || type}</span>
                      <span className="text-muted-foreground ml-2">×{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Goals */}
            {stats.topGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Focus Areas</CardTitle>
                  <CardDescription>Most common goals this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {stats.topGoals.map((goal, i) => (
                      <li key={goal} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Insights */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Monthly Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{stats.insights}</p>
              </CardContent>
            </Card>

            {/* Funny Note */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
              <CardContent className="pt-6">
                <p className="text-center text-lg">{stats.funnyNote}</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No sessions this month</h3>
              <p className="text-muted-foreground mb-4">
                Start a therapy session to see your monthly report
              </p>
              <Button onClick={() => navigate("/")} className="bg-gradient-calm">
                Begin a Session
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Report;
