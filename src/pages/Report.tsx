import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { Logo } from "@/components/Logo";
import { CalmingIllustration } from "@/components/CalmingIllustration";
import { ArrowLeft, Calendar, MessageCircle, TrendingUp, Sparkles, Loader2, Heart, Target, Brain, Lightbulb, CheckCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface MonthlyStats {
  totalSessions: number;
  totalMessages: number;
  therapyTypeCounts: Record<string, number>;
  moodTrend: string;
  avgMood: number;
  avgStress: number;
  topGoals: string[];
  insights: string;
  progressNotes: string[];
  actionItems: string[];
  funnyNote: string;
  journeyImage: string;
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

const journeyImages: Record<string, string> = {
  improving: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop",
  steady: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=300&fit=crop",
  "needs attention": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=300&fit=crop",
  default: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=300&fit=crop",
};

const Report = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
        .select("therapy_goals, current_mood_scales, custom_notes")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      // Fetch messages for deeper analysis
      const sessionIds = sessions?.map(s => s.id) || [];
      const { data: messages } = sessionIds.length > 0 ? await supabase
        .from("therapy_messages")
        .select("content, role")
        .in("session_id", sessionIds)
        : { data: [] };

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
          .slice(0, 5)
          .map(([goal]) => goal);

        // Calculate mood and stress averages
        const moods: number[] = [];
        const stresses: number[] = [];
        quizResponses?.forEach((q) => {
          const scales = q.current_mood_scales as any;
          if (scales?.mood) moods.push(scales.mood);
          if (scales?.stress) stresses.push(scales.stress);
        });

        const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 5;
        const avgStress = stresses.length > 0 ? stresses.reduce((a, b) => a + b, 0) / stresses.length : 5;

        let moodTrend = "steady";
        if (moods.length >= 2) {
          const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
          const secondHalf = moods.slice(Math.floor(moods.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          if (secondAvg > firstAvg + 0.5) moodTrend = "improving";
          else if (secondAvg < firstAvg - 0.5) moodTrend = "needs attention";
        }

        // Generate progress notes based on data
        const progressNotes = generateProgressNotes(sessions.length, totalMessages, therapyTypeCounts, moodTrend, avgMood, avgStress);
        
        // Generate action items
        const actionItems = generateActionItems(moodTrend, avgStress, topGoals, therapyTypeCounts);

        setStats({
          totalSessions: sessions.length,
          totalMessages,
          therapyTypeCounts,
          moodTrend,
          avgMood: Math.round(avgMood * 10) / 10,
          avgStress: Math.round(avgStress * 10) / 10,
          topGoals,
          insights: generateInsights(sessions.length, totalMessages, therapyTypeCounts, moodTrend, avgMood),
          progressNotes,
          actionItems,
          funnyNote: generateFunnyNote(sessions.length, moodTrend),
          journeyImage: journeyImages[moodTrend] || journeyImages.default,
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

  const generateProgressNotes = (
    sessions: number,
    messages: number,
    typeCounts: Record<string, number>,
    mood: string,
    avgMood: number,
    avgStress: number
  ): string[] => {
    const notes: string[] = [];
    
    if (sessions >= 10) {
      notes.push("Outstanding commitment! You've shown remarkable dedication to your mental health journey this month.");
    } else if (sessions >= 5) {
      notes.push("Great consistency! Regular sessions are building a strong foundation for lasting change.");
    } else if (sessions >= 1) {
      notes.push("You took the important step of showing up for yourself. Every session counts.");
    }

    if (avgMood >= 7) {
      notes.push("Your average mood score is excellent - you're cultivating positive mental states effectively.");
    } else if (avgMood >= 5) {
      notes.push("Your mood has been stable, which shows resilience. Small improvements lead to big changes.");
    } else {
      notes.push("You've been facing challenges, but seeking support shows incredible strength.");
    }

    if (avgStress <= 4) {
      notes.push("Low stress levels indicate good coping mechanisms are in place. Keep nurturing these habits.");
    } else if (avgStress >= 7) {
      notes.push("High stress detected - consider incorporating more relaxation techniques into your routine.");
    }

    const mostUsedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostUsedType) {
      notes.push(`Your focus on ${therapyLabels[mostUsedType[0]] || mostUsedType[0]} suggests targeted work on specific areas of growth.`);
    }

    return notes;
  };

  const generateActionItems = (
    mood: string,
    avgStress: number,
    goals: string[],
    typeCounts: Record<string, number>
  ): string[] => {
    const items: string[] = [];

    if (mood === "needs attention") {
      items.push("Schedule sessions more frequently - consistency helps during challenging times");
      items.push("Try journaling for 5 minutes daily to process emotions");
    }

    if (avgStress >= 6) {
      items.push("Practice 4-7-8 breathing technique before bed for better sleep");
      items.push("Take short walks in nature to reduce cortisol levels");
    }

    if (!typeCounts["yogic"] && avgStress >= 5) {
      items.push("Consider trying Yogic Therapy - it combines physical and mental wellness");
    }

    if (goals.includes("anxiety_management")) {
      items.push("Continue anxiety management work - you're building important coping skills");
    }

    if (goals.includes("stress_reduction")) {
      items.push("Add a 10-minute morning meditation to start your day centered");
    }

    // Always add some positive action items
    items.push("Celebrate your progress - acknowledge each small victory");
    items.push("Share your journey with a trusted friend or family member");

    return items.slice(0, 5); // Max 5 action items
  };

  const generateInsights = (
    sessions: number,
    messages: number,
    typeCounts: Record<string, number>,
    mood: string,
    avgMood: number
  ): string => {
    const mostUsed = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    
    let insight = `This month, you invested in yourself with ${sessions} therapy session${sessions !== 1 ? 's' : ''} and ${messages} meaningful exchanges. `;
    
    if (mostUsed) {
      insight += `Your journey through ${therapyLabels[mostUsed[0]] || mostUsed[0]} shows you're actively working on specific aspects of your wellbeing. `;
    }
    
    if (mood === "improving") {
      insight += `The upward trend in your mood is a testament to your hard work. Research shows that consistent engagement with therapy leads to lasting positive changes in brain chemistry. You're literally rewiring your mind for happiness! 🌟`;
    } else if (mood === "needs attention") {
      insight += `While this month brought challenges, remember that healing isn't linear. The fact that you continued showing up during difficult times demonstrates remarkable resilience. Studies show that persistence during hard times is the greatest predictor of long-term mental health improvement. 💪`;
    } else {
      insight += `Your steady engagement shows you've developed healthy mental habits. Consistency is key - you're building a sustainable practice of self-care that will serve you for years to come. ✨`;
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
      "Your therapist AI is proud of you. And we're not even programmed to feel pride. That's how impressive you are! 🤖❤️",
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
            <p className="text-sm text-muted-foreground">Your complete journey at a glance</p>
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
            {/* Journey Illustration - Using SVG instead of external image */}
            <Card className="overflow-hidden">
              <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/10 to-accent/10">
                <CalmingIllustration moodTrend={stats.moodTrend} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-serif font-bold text-foreground">
                    {format(selectedMonth, "MMMM")} - Your Healing Journey
                  </h2>
                  <p className="text-muted-foreground">
                    A month of growth, reflection, and self-discovery
                  </p>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.avgMood}/10</p>
                      <p className="text-sm text-muted-foreground">Avg Mood</p>
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
                      <p className="text-sm text-muted-foreground">Trend</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Therapy Types Used */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Therapy Types Explored
                </CardTitle>
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Your Focus Areas
                  </CardTitle>
                  <CardDescription>Most common goals this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {stats.topGoals.map((goal, i) => (
                      <li key={goal} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </span>
                        <span className="capitalize">{goal.replace(/_/g, " ")}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Progress Notes */}
            <Card className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Your Progress This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {stats.progressNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span className="text-muted-foreground">{note}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  Recommended Next Steps
                </CardTitle>
                <CardDescription>Actionable items for continued growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {stats.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Deep Insights */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Deep Insights
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
