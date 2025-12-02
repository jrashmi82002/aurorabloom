import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, User, Calendar } from "lucide-react";

interface Session {
  id: string;
  user_id: string;
  therapy_type: string;
  title: string;
  started_at: string;
  message_count: number;
  is_active: boolean;
}

export const AdminSessionInsights = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("therapy_sessions")
        .select("id, user_id, therapy_type, title, started_at, message_count, is_active")
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTherapyBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      yogic: "bg-purple-100 text-purple-800",
      psychological: "bg-blue-100 text-blue-800",
      physiotherapy: "bg-green-100 text-green-800",
      ayurveda: "bg-emerald-100 text-emerald-800",
      talk_therapy: "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Insights</CardTitle>
        <CardDescription>View recent therapy sessions and user engagement</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No sessions yet</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(session.started_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getTherapyBadgeColor(session.therapy_type)}>
                    {session.therapy_type.replace("_", " ")}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    <span>{session.message_count}</span>
                  </div>
                  {session.is_active && (
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
