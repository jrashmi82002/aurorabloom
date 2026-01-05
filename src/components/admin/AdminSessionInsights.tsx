import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, User, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Session {
  id: string;
  user_id: string;
  therapy_type: string;
  title: string;
  started_at: string;
  message_count: number;
  is_active: boolean;
}

interface UserGroup {
  userId: string;
  email: string;
  sessions: Session[];
  totalMessages: number;
}

export const AdminSessionInsights = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("therapy_sessions")
        .select("id, user_id, therapy_type, title, started_at, message_count, is_active")
        .order("started_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Group sessions by user
      const userMap: Record<string, { sessions: Session[]; totalMessages: number }> = {};
      
      data?.forEach((session) => {
        if (!userMap[session.user_id]) {
          userMap[session.user_id] = { sessions: [], totalMessages: 0 };
        }
        userMap[session.user_id].sessions.push(session);
        userMap[session.user_id].totalMessages += session.message_count || 0;
      });

      // Get user emails
      const groups: UserGroup[] = [];
      for (const [userId, data] of Object.entries(userMap)) {
        // Try to get email from pro_access_requests
        const { data: request } = await supabase
          .from("pro_access_requests")
          .select("email")
          .eq("user_id", userId)
          .limit(1)
          .single();

        groups.push({
          userId,
          email: request?.email || `User ${userId.slice(0, 8)}...`,
          sessions: data.sessions,
          totalMessages: data.totalMessages,
        });
      }

      // Sort by total sessions descending
      groups.sort((a, b) => b.sessions.length - a.sessions.length);
      
      setUserGroups(groups);
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
      genz_therapy: "bg-orange-100 text-orange-800",
      female_therapy: "bg-rose-100 text-rose-800",
      male_therapy: "bg-cyan-100 text-cyan-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const toggleUser = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Insights by User</CardTitle>
        <CardDescription>View therapy sessions grouped by user for better tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {userGroups.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No sessions yet</p>
        ) : (
          <div className="space-y-3">
            {userGroups.map((group) => (
              <Collapsible
                key={group.userId}
                open={expandedUsers.has(group.userId)}
                onOpenChange={() => toggleUser(group.userId)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{group.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''} • {group.totalMessages} messages
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.sessions.some(s => s.is_active) && (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          Active
                        </Badge>
                      )}
                      {expandedUsers.has(group.userId) ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-14 mt-2 space-y-2 pb-2">
                    {group.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(session.started_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTherapyBadgeColor(session.therapy_type)}>
                            {session.therapy_type.replace("_", " ")}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="w-3 h-3" />
                            <span>{session.message_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
