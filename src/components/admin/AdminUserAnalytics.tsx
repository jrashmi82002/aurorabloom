import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, MessageSquare, Crown, TrendingUp, AlertTriangle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  totalUsers: number;
  proUsers: number;
  totalSessions: number;
  totalMessages: number;
  therapyTypeDistribution: { name: string; value: number }[];
  dailyActivity: { date: string; sessions: number; messages: number }[];
  topEngagedUsers: { email: string; sessions: number; messages: number }[];
  usersNeedingHelp: { email: string; reason: string; severity: string }[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const AdminUserAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch pro users
      const { count: proUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("pro_subscription_status", ["monthly", "yearly"]);

      // Fetch total sessions
      const { count: totalSessions } = await supabase
        .from("therapy_sessions")
        .select("*", { count: "exact", head: true });

      // Fetch total messages
      const { count: totalMessages } = await supabase
        .from("therapy_messages")
        .select("*", { count: "exact", head: true });

      // Fetch therapy type distribution
      const { data: sessions } = await supabase
        .from("therapy_sessions")
        .select("therapy_type");

      const typeCounts: Record<string, number> = {};
      sessions?.forEach((s) => {
        typeCounts[s.therapy_type] = (typeCounts[s.therapy_type] || 0) + 1;
      });

      const therapyTypeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
        name: name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
      }));

      // Fetch daily activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentSessions } = await supabase
        .from("therapy_sessions")
        .select("started_at")
        .gte("started_at", sevenDaysAgo.toISOString());

      const { data: recentMessages } = await supabase
        .from("therapy_messages")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString());

      const dailyData: Record<string, { sessions: number; messages: number }> = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split("T")[0];
        dailyData[key] = { sessions: 0, messages: 0 };
      }

      recentSessions?.forEach((s) => {
        const key = s.started_at.split("T")[0];
        if (dailyData[key]) dailyData[key].sessions++;
      });

      recentMessages?.forEach((m) => {
        const key = m.created_at.split("T")[0];
        if (dailyData[key]) dailyData[key].messages++;
      });

      const dailyActivity = Object.entries(dailyData)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
          ...data,
        }))
        .reverse();

      // Fetch top 5 engaged users (most sessions + messages)
      const { data: allSessions } = await supabase
        .from("therapy_sessions")
        .select("user_id, message_count");

      const userStats: Record<string, { sessions: number; messages: number }> = {};
      allSessions?.forEach((s) => {
        if (!userStats[s.user_id]) {
          userStats[s.user_id] = { sessions: 0, messages: 0 };
        }
        userStats[s.user_id].sessions++;
        userStats[s.user_id].messages += s.message_count || 0;
      });

      const topUserIds = Object.entries(userStats)
        .sort((a, b) => (b[1].sessions + b[1].messages) - (a[1].sessions + a[1].messages))
        .slice(0, 5)
        .map(([id]) => id);

      // Get emails for top users from auth (we'll use profiles as proxy)
      const topEngagedUsers: { email: string; sessions: number; messages: number }[] = [];
      for (const userId of topUserIds) {
        const stats = userStats[userId];
        // Get user email from pro_access_requests or use anonymized ID
        const { data: request } = await supabase
          .from("pro_access_requests")
          .select("email")
          .eq("user_id", userId)
          .limit(1)
          .single();

        topEngagedUsers.push({
          email: request?.email || `User ${userId.slice(0, 8)}...`,
          sessions: stats.sessions,
          messages: stats.messages,
        });
      }

      // Analyze users needing professional help based on quiz responses
      const { data: quizData } = await supabase
        .from("quiz_responses")
        .select("user_id, current_mood_scales, therapy_goals, custom_notes")
        .order("created_at", { ascending: false });

      const usersNeedingHelpMap: Record<string, { reason: string; severity: string }> = {};
      
      quizData?.forEach((q) => {
        const scales = q.current_mood_scales as any;
        const mood = scales?.mood || 5;
        const stress = scales?.stress || 5;
        const notes = q.custom_notes?.toLowerCase() || "";
        const goals = q.therapy_goals || [];
        
        // Identify concerning patterns
        let reason = "";
        let severity = "medium";
        
        if (mood <= 2 || stress >= 8) {
          reason = "Very low mood or extremely high stress levels";
          severity = "high";
        } else if (notes.includes("suicide") || notes.includes("harm") || notes.includes("hopeless")) {
          reason = "Concerning language in session notes";
          severity = "critical";
        } else if (goals.includes("crisis_support") || goals.includes("trauma")) {
          reason = "Seeking crisis or trauma support";
          severity = "high";
        } else if (mood <= 3 && stress >= 7) {
          reason = "Combination of low mood and high stress";
          severity = "medium";
        }
        
        if (reason && !usersNeedingHelpMap[q.user_id]) {
          usersNeedingHelpMap[q.user_id] = { reason, severity };
        }
      });

      // Get top 5 users needing help
      const usersNeedingHelp: { email: string; reason: string; severity: string }[] = [];
      const helpUserIds = Object.entries(usersNeedingHelpMap)
        .sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2 };
          return (severityOrder[a[1].severity as keyof typeof severityOrder] || 3) -
                 (severityOrder[b[1].severity as keyof typeof severityOrder] || 3);
        })
        .slice(0, 5);

      for (const [userId, data] of helpUserIds) {
        const { data: request } = await supabase
          .from("pro_access_requests")
          .select("email")
          .eq("user_id", userId)
          .limit(1)
          .single();

        usersNeedingHelp.push({
          email: request?.email || `User ${userId.slice(0, 8)}...`,
          reason: data.reason,
          severity: data.severity,
        });
      }

      setAnalytics({
        totalUsers: totalUsers || 0,
        proUsers: proUsers || 0,
        totalSessions: totalSessions || 0,
        totalMessages: totalMessages || 0,
        therapyTypeDistribution,
        dailyActivity,
        topEngagedUsers,
        usersNeedingHelp,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      default: return "bg-yellow-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.proUsers}</p>
                <p className="text-sm text-muted-foreground">Pro Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalSessions}</p>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalMessages}</p>
                <p className="text-sm text-muted-foreground">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Engaged Users & Users Needing Help */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Top 5 Engaged Users
            </CardTitle>
            <CardDescription>Most active users by sessions and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topEngagedUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No user data yet</p>
              ) : (
                analytics.topEngagedUsers.map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[150px]">{user.email}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="secondary">{user.sessions} sessions</Badge>
                      <Badge variant="outline">{user.messages} msgs</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Users Needing Professional Help
            </CardTitle>
            <CardDescription>Based on mood, stress, and session content analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.usersNeedingHelp.length === 0 ? (
                <p className="text-muted-foreground text-sm">No concerning patterns detected</p>
              ) : (
                analytics.usersNeedingHelp.map((user, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate max-w-[180px]">{user.email}</span>
                      <Badge className={getSeverityColor(user.severity)}>
                        {user.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{user.reason}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Therapy Type Distribution</CardTitle>
            <CardDescription>Sessions by therapy category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.therapyTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.therapyTypeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Sessions and messages over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="messages" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
