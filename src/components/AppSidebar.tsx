import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MessageSquare, Clock, Home, FileText, Gamepad2, BookOpen, Newspaper, LogOut, Trash2, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isThisMonth, isThisYear } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  title: string;
  therapy_type: string;
  started_at: string;
  message_count: number | null;
}

interface AppSidebarProps {
  userId: string;
  isOpen: boolean;
  onToggle: () => void;
}

const therapyLabels: Record<string, string> = {
  yogic: "Yogic",
  psychological: "Psych",
  physiotherapy: "Physio",
  ayurveda: "Ayurveda",
  talk_therapy: "Talk",
  female_therapy: "Her",
  male_therapy: "Him",
  older_therapy: "Senior",
  children_therapy: "Kids",
  advanced_therapy: "Custom",
};

// Generate creative session names
const creativeNames = [
  "Peaceful Journey", "Inner Light", "Calm Waters", "Fresh Start",
  "New Dawn", "Gentle Path", "Quiet Mind", "Open Heart",
  "Healing Moment", "Soft Breeze", "Clear Sky", "Warm Embrace"
];

const getSessionDisplayName = (session: Session): string => {
  const date = new Date(session.started_at);
  const therapyShort = therapyLabels[session.therapy_type] || session.therapy_type;
  const dayOfMonth = date.getDate();
  const creativeName = creativeNames[dayOfMonth % creativeNames.length];
  return `${therapyShort} · ${creativeName}`;
};

const getFormattedDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isThisMonth(date)) {
    return format(date, "MMM d");
  }
  return format(date, "MMM d");
};

interface GroupedSessions {
  [monthKey: string]: {
    label: string;
    sessions: Session[];
  };
}

export const AppSidebar = ({ userId, isOpen, onToggle }: AppSidebarProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<string[]>([]);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("therapy_sessions")
      .select("id, title, therapy_type, started_at, message_count")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setSessions(data);
      if (data.length > 0) {
        const currentMonthKey = format(new Date(), "yyyy-MM");
        setOpenMonths([currentMonthKey]);
      }
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Delete messages first
      await supabase.from("therapy_messages").delete().eq("session_id", sessionId);
      // Delete quiz responses
      await supabase.from("quiz_responses").delete().eq("session_id", sessionId);
      // Delete session
      await supabase.from("therapy_sessions").delete().eq("id", sessionId);
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({ title: "Session deleted" });
    } catch (error) {
      toast({ title: "Error deleting session", variant: "destructive" });
    }
  };

  const handleRenameSession = async (sessionId: string) => {
    if (!editName.trim()) {
      setEditingSession(null);
      return;
    }
    
    try {
      await supabase
        .from("therapy_sessions")
        .update({ title: editName })
        .eq("id", sessionId);
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: editName } : s
      ));
      setEditingSession(null);
      toast({ title: "Session renamed" });
    } catch (error) {
      toast({ title: "Error renaming session", variant: "destructive" });
    }
  };

  const groupSessionsByMonth = (): GroupedSessions => {
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
        grouped[monthKey] = { label: monthLabel, sessions: [] };
      }
      grouped[monthKey].sessions.push(session);
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

  const handleSessionClick = (session: Session) => {
    navigate(`/chat?type=${session.therapy_type}&session=${session.id}`);
  };

  const groupedSessions = groupSessionsByMonth();
  const sortedMonthKeys = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  if (!isOpen) return null;

  return (
    <aside className="w-72 border-r border-border/50 bg-background/95 backdrop-blur-sm flex flex-col shrink-0 h-full animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <Logo size="sm" />
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation Links - Removed Home button since Logo is clickable */}

      {/* Sessions Area - Scrollable middle section */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-2 uppercase tracking-wide">
            Sessions
          </h3>
          
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No sessions yet</p>
            </div>
          ) : (
            sortedMonthKeys.map((monthKey) => {
              const monthData = groupedSessions[monthKey];
              const isMonthOpen = openMonths.includes(monthKey);

              return (
                <Collapsible
                  key={monthKey}
                  open={isMonthOpen}
                  onOpenChange={() => toggleMonth(monthKey)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-8 px-2 hover:bg-muted/50 text-xs"
                    >
                      <span className="font-medium">{monthData.label}</span>
                      {isMonthOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-0.5 mt-1">
                    {monthData.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="group relative"
                      >
                        {editingSession === session.id ? (
                          <div className="flex items-center gap-1 p-1 pl-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-7 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameSession(session.id);
                                if (e.key === "Escape") setEditingSession(null);
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleRenameSession(session.id)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => setEditingSession(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSessionClick(session)}
                            className={cn(
                              "w-full text-left p-2 pl-4 rounded-md transition-all duration-200",
                              "hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">
                                  {getSessionDisplayName(session)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {getFormattedDate(session.started_at)}
                                </p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                                <div
                                  role="button"
                                  tabIndex={0}
                                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSession(session.id);
                                    setEditName(session.title);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.stopPropagation();
                                      setEditingSession(session.id);
                                      setEditName(session.title);
                                    }
                                  }}
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                </div>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/20 cursor-pointer text-destructive"
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleDeleteSession(session.id, e as any);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </div>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Bottom Fixed Actions */}
      <div className="p-3 border-t border-border/50 space-y-1 shrink-0">
        <Button
          variant={location.pathname === "/report" ? "secondary" : "ghost"}
          className="w-full justify-start gap-2 h-9"
          onClick={() => navigate("/report")}
        >
          <FileText className="w-4 h-4" />
          Monthly Report
        </Button>
        <Button
          variant={location.pathname === "/activities" ? "secondary" : "ghost"}
          className="w-full justify-start gap-2 h-9"
          onClick={() => navigate("/activities")}
        >
          <Gamepad2 className="w-4 h-4" />
          Therapy Activities
        </Button>
        <Button
          variant={location.pathname === "/diary" ? "secondary" : "ghost"}
          className="w-full justify-start gap-2 h-9"
          onClick={() => navigate("/diary")}
        >
          <BookOpen className="w-4 h-4" />
          My Diary
        </Button>
        <Button
          variant={location.pathname === "/blog" ? "secondary" : "ghost"}
          className="w-full justify-start gap-2 h-9"
          onClick={() => navigate("/blog")}
        >
          <Newspaper className="w-4 h-4" />
          Healing Blog
        </Button>
        <div className="pt-2 border-t border-border/30 mt-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-9 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
};
