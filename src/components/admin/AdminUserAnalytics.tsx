import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, MessageSquare, Crown, TrendingUp } from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  proUsers: number;
  totalSessions: number;
  totalMessages: number;
  therapyTypeDistribution: { name: string; value: number }[];
  dailyActivity: { date: string; sessions: number; messages: number }[];
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

      setAnalytics({
        totalUsers: totalUsers || 0,
        proUsers: proUsers || 0,
        totalSessions: totalSessions || 0,
        totalMessages: totalMessages || 0,
        therapyTypeDistribution,
        dailyActivity,
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
