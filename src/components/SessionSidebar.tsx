import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/Logo";
import { Plus, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Session {
  id: string;
  title: string;
  therapy_type: string;
  started_at: string;
  message_count: number | null;
}

interface SessionSidebarProps {
  userId: string;
  currentSessionId: string | null;
  therapyType: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
}

const therapyLabels: Record<string, string> = {
  yogic: "Yogic",
  psychological: "Psychological",
  physiotherapy: "Physio",
  ayurveda: "Ayurveda",
  talk_therapy: "Talk",
  genz_therapy: "GenZ",
  female_therapy: "Female",
  male_therapy: "Male",
  older_therapy: "Senior",
  children_therapy: "Children",
  millennial_therapy: "Millennial",
  advanced_therapy: "Advanced",
};

export const SessionSidebar = ({
  userId,
  currentSessionId,
  therapyType,
  onSessionSelect,
  onNewSession,
}: SessionSidebarProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from("therapy_sessions")
        .select("id, title, therapy_type, started_at, message_count")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setSessions(data);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [userId, currentSessionId]);

  if (collapsed) {
    return (
      <div className="w-14 border-r border-border/50 bg-background/50 flex flex-col">
        <div className="p-2 border-b border-border/50">
          <Logo size="sm" showText={false} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="m-2"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="m-2"
          onClick={onNewSession}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border/50 bg-background/50 flex flex-col">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <Logo size="sm" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-3">
        <Button
          onClick={onNewSession}
          className="w-full bg-gradient-calm hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No previous sessions
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  "hover:bg-muted/50",
                  currentSessionId === session.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {therapyLabels[session.therapy_type] || session.therapy_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.started_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
