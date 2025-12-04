import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isThisMonth, isThisYear, startOfMonth } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Session {
  id: string;
  title: string;
  therapy_type: string;
  started_at: string;
  message_count: number | null;
}

interface SessionHistorySidebarProps {
  userId: string;
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

interface GroupedSessions {
  [monthKey: string]: {
    label: string;
    therapyGroups: {
      [therapyType: string]: Session[];
    };
  };
}

export const SessionHistorySidebar = ({ userId }: SessionHistorySidebarProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<string[]>([]);
  const [openTherapyTypes, setOpenTherapyTypes] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from("therapy_sessions")
        .select("id, title, therapy_type, started_at, message_count")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setSessions(data);
        // Auto-open current month
        if (data.length > 0) {
          const currentMonthKey = format(new Date(), "yyyy-MM");
          setOpenMonths([currentMonthKey]);
        }
      }
      setLoading(false);
    };

    fetchSessions();
  }, [userId]);

  const groupSessionsByMonthAndType = (): GroupedSessions => {
    const grouped: GroupedSessions = {};

    sessions.forEach((session) => {
      const date = new Date(session.started_at);
      const monthKey = format(date, "yyyy-MM");
      
      let monthLabel: string;
      if (isThisMonth(date)) {
        monthLabel = "This Month";
      } else if (isThisYear(date)) {
        monthLabel = format(date, "MMMM");
      } else {
        monthLabel = format(date, "MMMM yyyy");
      }

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          label: monthLabel,
          therapyGroups: {},
        };
      }

      const therapyType = session.therapy_type;
      if (!grouped[monthKey].therapyGroups[therapyType]) {
        grouped[monthKey].therapyGroups[therapyType] = [];
      }
      grouped[monthKey].therapyGroups[therapyType].push(session);
    });

    return grouped;
  };

  const toggleMonth = (monthKey: string) => {
    setOpenMonths((prev) =>
      prev.includes(monthKey)
        ? prev.filter((m) => m !== monthKey)
        : [...prev, monthKey]
    );
  };

  const toggleTherapyType = (key: string) => {
    setOpenTherapyTypes((prev) =>
      prev.includes(key)
        ? prev.filter((t) => t !== key)
        : [...prev, key]
    );
  };

  const handleSessionClick = (session: Session) => {
    navigate(`/chat?type=${session.therapy_type}&session=${session.id}`);
  };

  const groupedSessions = groupSessionsByMonthAndType();
  const sortedMonthKeys = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No previous sessions yet</p>
        <p className="text-xs mt-1">Start a therapy session above!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-3">
          Previous Sessions
        </h3>
        
        {sortedMonthKeys.map((monthKey) => {
          const monthData = groupedSessions[monthKey];
          const isMonthOpen = openMonths.includes(monthKey);
          const therapyTypes = Object.keys(monthData.therapyGroups);

          return (
            <Collapsible
              key={monthKey}
              open={isMonthOpen}
              onOpenChange={() => toggleMonth(monthKey)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-9 px-2 hover:bg-muted/50"
                >
                  <span className="font-medium text-sm">{monthData.label}</span>
                  {isMonthOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pl-2">
                {therapyTypes.map((therapyType) => {
                  const typeKey = `${monthKey}-${therapyType}`;
                  const isTypeOpen = openTherapyTypes.includes(typeKey);
                  const typeSessions = monthData.therapyGroups[therapyType];

                  return (
                    <Collapsible
                      key={typeKey}
                      open={isTypeOpen}
                      onOpenChange={() => toggleTherapyType(typeKey)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        >
                          <span className="text-xs truncate">
                            {therapyLabels[therapyType] || therapyType}
                            <span className="ml-1 opacity-60">({typeSessions.length})</span>
                          </span>
                          {isTypeOpen ? (
                            <ChevronDown className="w-3 h-3 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 shrink-0" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="pl-2">
                        {typeSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => handleSessionClick(session)}
                            className={cn(
                              "w-full text-left p-2 rounded-md transition-colors",
                              "hover:bg-muted/50 group"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground truncate">
                                  {format(new Date(session.started_at), "MMM d, h:mm a")}
                                </p>
                                {session.message_count && session.message_count > 0 && (
                                  <p className="text-xs text-muted-foreground/60">
                                    {session.message_count} messages
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
};
