import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PanelLeft, BookOpen, Sparkles, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DiaryEntry {
  id?: string;
  date: string;
  content: string;
  insight?: string;
}

const Diary = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState("");
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  // Load entry for selected date (from localStorage for now)
  useEffect(() => {
    if (!user) return;
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const stored = localStorage.getItem(`diary_${user.id}`);
    if (stored) {
      const allEntries = JSON.parse(stored) as DiaryEntry[];
      setEntries(allEntries);
      const entry = allEntries.find(e => e.date === dateKey);
      setCurrentEntry(entry?.content || "");
      setInsight(entry?.insight || null);
    } else {
      setCurrentEntry("");
      setInsight(null);
    }
  }, [selectedDate, user]);

  const saveEntry = () => {
    if (!user || !currentEntry.trim()) return;
    setSaving(true);
    
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const stored = localStorage.getItem(`diary_${user.id}`);
    let allEntries: DiaryEntry[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = allEntries.findIndex(e => e.date === dateKey);
    const entryData: DiaryEntry = {
      date: dateKey,
      content: currentEntry,
      insight: insight || undefined,
    };
    
    if (existingIndex >= 0) {
      allEntries[existingIndex] = entryData;
    } else {
      allEntries.push(entryData);
    }
    
    localStorage.setItem(`diary_${user.id}`, JSON.stringify(allEntries));
    setEntries(allEntries);
    setSaving(false);
    toast({ title: "Entry saved 💙" });
  };

  const getTherapistInsight = async () => {
    if (!currentEntry.trim()) {
      toast({ title: "Write something first", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("therapy-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `This is my diary entry for today. Please give me a warm, supportive insight about my thoughts in 1-2 short sentences. Be like a caring friend. Add a relevant cute emoji or sticker at the end. Here's my entry:\n\n"${currentEntry}"`
            }
          ],
          therapyType: "talk_therapy",
          quizData: null,
          messageCount: 0,
          voiceGender: "female",
        },
      });
      
      if (response.data?.message) {
        setInsight(response.data.message);
        // Save with insight
        const dateKey = format(selectedDate, "yyyy-MM-dd");
        const stored = localStorage.getItem(`diary_${user?.id}`);
        let allEntries: DiaryEntry[] = stored ? JSON.parse(stored) : [];
        const existingIndex = allEntries.findIndex(e => e.date === dateKey);
        const entryData: DiaryEntry = {
          date: dateKey,
          content: currentEntry,
          insight: response.data.message,
        };
        
        if (existingIndex >= 0) {
          allEntries[existingIndex] = entryData;
        } else {
          allEntries.push(entryData);
        }
        localStorage.setItem(`diary_${user?.id}`, JSON.stringify(allEntries));
        setEntries(allEntries);
      }
    } catch (error) {
      console.error("Error getting insight:", error);
      toast({ title: "Couldn't get insight right now", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const hasEntryOnDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return entries.some(e => e.date === dateKey);
  };

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-soft">
      <AppSidebar userId={user.id} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-6 py-4 flex items-center gap-4">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <PanelLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold">My Diary</h1>
                <p className="text-sm text-muted-foreground">Your private space for reflection</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-[280px_1fr] gap-6">
            {/* Calendar */}
            <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-sm font-medium">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-muted-foreground font-medium py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array(startOfMonth(currentMonth).getDay()).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {daysInMonth.map((day) => {
                    const hasEntry = hasEntryOnDate(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "aspect-square rounded-lg text-xs font-medium transition-all",
                          "hover:bg-blue-200/50 dark:hover:bg-blue-800/30",
                          isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                          !isSelected && isTodayDate && "ring-2 ring-blue-400",
                          hasEntry && !isSelected && "bg-blue-100 dark:bg-blue-900/30"
                        )}
                      >
                        {format(day, "d")}
                        {hasEntry && !isSelected && (
                          <span className="block w-1 h-1 rounded-full bg-blue-500 mx-auto mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Entry Area */}
            <div className="space-y-4">
              <Card className="border-blue-200/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-serif flex items-center gap-2">
                      <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                      {isToday(selectedDate) && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isToday(selectedDate) ? (
                    <>
                      <Textarea
                        placeholder="How are you feeling today? What's on your mind? Write freely..."
                        value={currentEntry}
                        onChange={(e) => setCurrentEntry(e.target.value)}
                        className="min-h-[200px] resize-none border-blue-200/50 focus:border-blue-400 text-base leading-relaxed"
                      />
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={saveEntry} 
                          disabled={saving || !currentEntry.trim()}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90"
                        >
                          {saving ? "Saving..." : "Save Entry"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={getTherapistInsight}
                          disabled={loading || !currentEntry.trim()}
                          className="gap-2 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          Get Therapist Insight
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {currentEntry ? (
                        <>
                          <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50">
                            <p className="text-base leading-relaxed whitespace-pre-wrap">{currentEntry}</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={getTherapistInsight}
                            disabled={loading}
                            className="gap-2 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            Get Therapist Insight
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No entry for this date.</p>
                          <p className="text-sm mt-1">You can only write for today's date.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Therapist Insight */}
              {insight && (
                <Card className="border-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 animate-fade-in">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                          Maya's Insight
                        </p>
                        <p className="text-base leading-relaxed">{insight}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Diary;
