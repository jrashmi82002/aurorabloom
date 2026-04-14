import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileIcon } from "@/components/ProfileIcon";
import { PanelLeft, BookOpen, Sparkles, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, X, Crown, Download, FileText, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DiaryEntry {
  id?: string;
  entry_date: string;
  content: string;
  insight?: string;
  image_url?: string;
  theme: string;
  mood_sticker?: string;
}

const themes = [
  { id: "default", name: "Default", bg: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20", accent: "blue" },
  { id: "sunset", name: "Sunset", bg: "from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20", accent: "orange" },
  { id: "forest", name: "Forest", bg: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20", accent: "green" },
  { id: "lavender", name: "Lavender", bg: "from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20", accent: "purple" },
  { id: "ocean", name: "Ocean", bg: "from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20", accent: "cyan" },
];

const moodStickers = ["😊", "😢", "😤", "😴", "🥰", "😌", "🤔", "😰", "💪", "🌟", "🌈", "🌸"];

const Diary = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState("");
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState("");
  const [pdfEndDate, setPdfEndDate] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkProStatus(session.user.id);
        fetchEntries(session.user.id);
      }
    });
  }, [navigate]);

  const checkProStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("pro_subscription_status")
      .eq("id", userId)
      .single();
    
    const status = profile?.pro_subscription_status;
    setIsPro(status === "yearly" || status === "monthly");
  };

  const fetchEntries = async (userId: string) => {
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
  };

  // Load entry for selected date
  useEffect(() => {
    const loadEntry = async () => {
      if (!user || entries.length === 0) return;
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      const entry = entries.find(e => e.entry_date === dateKey);
      setCurrentEntry(entry?.content || "");
      setInsight(entry?.insight || null);
      setSelectedTheme(entry?.theme || "default");
      setSelectedSticker(entry?.mood_sticker || null);
      
      // Fetch signed URL for image if it exists
      if (entry?.image_url) {
        try {
          // Extract file path from the stored URL or reconstruct it
          const { data: files } = await supabase.storage
            .from("diary-images")
            .list(user.id);
          
          const imageFile = files?.find(f => f.name.includes(dateKey));
          if (imageFile) {
            const { data: signedUrlData } = await supabase.storage
              .from("diary-images")
              .createSignedUrl(`${user.id}/${imageFile.name}`, 3600);
            
            setImageUrl(signedUrlData?.signedUrl || null);
          } else {
            setImageUrl(null);
          }
        } catch (error) {
          console.error("Error fetching signed URL:", error);
          setImageUrl(null);
        }
      } else {
        setImageUrl(null);
      }
    };
    
    loadEntry();
  }, [selectedDate, entries, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
      toast({ title: "Pro feature", description: "Image upload is a Pro feature", variant: "destructive" });
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `Please upload an image under ${MAX_SIZE_MB}MB`, variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${format(selectedDate, "yyyy-MM-dd")}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("diary-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Use signed URL for private bucket
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("diary-images")
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;

      setImageUrl(signedUrlData.signedUrl);
      toast({ title: "Image uploaded! 📷" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (!user) return;
    
    try {
      // Delete from storage
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      const { data: files } = await supabase.storage
        .from("diary-images")
        .list(user.id);
      
      const fileToDelete = files?.find(f => f.name.startsWith(dateKey));
      if (fileToDelete) {
        await supabase.storage
          .from("diary-images")
          .remove([`${user.id}/${fileToDelete.name}`]);
      }
      
      setImageUrl(null);
      toast({ title: "Image removed" });
    } catch (error) {
      console.error("Error removing image:", error);
      setImageUrl(null);
    }
  };

  const deleteEntry = async () => {
    if (!user) return;
    
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const existingEntry = entries.find(e => e.entry_date === dateKey);
    
    if (!existingEntry?.id) return;
    
    try {
      // Delete image if exists
      if (existingEntry.image_url) {
        const { data: files } = await supabase.storage
          .from("diary-images")
          .list(user.id);
        
        const fileToDelete = files?.find(f => f.name.includes(dateKey));
        if (fileToDelete) {
          await supabase.storage
            .from("diary-images")
            .remove([`${user.id}/${fileToDelete.name}`]);
        }
      }
      
      // Delete entry
      await supabase
        .from("diary_entries")
        .delete()
        .eq("id", existingEntry.id);
      
      await fetchEntries(user.id);
      setCurrentEntry("");
      setInsight(null);
      setImageUrl(null);
      setSelectedSticker(null);
      setSelectedTheme("default");
      toast({ title: "Entry deleted" });
    } catch (error) {
      toast({ title: "Error deleting entry", variant: "destructive" });
    }
  };

  const saveEntry = async () => {
    if (!user || !currentEntry.trim()) return;
    setSaving(true);
    
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const entryData = {
      user_id: user.id,
      entry_date: dateKey,
      content: currentEntry,
      insight: insight || null,
      image_url: isPro ? imageUrl : null,
      theme: isPro ? selectedTheme : "default",
      mood_sticker: selectedSticker,
    };

    try {
      const existingEntry = entries.find(e => e.entry_date === dateKey);
      
      if (existingEntry?.id) {
        await supabase
          .from("diary_entries")
          .update(entryData)
          .eq("id", existingEntry.id);
      } else {
        await supabase.from("diary_entries").insert(entryData);
      }

      await fetchEntries(user.id);
      toast({ title: "Entry saved 💙" });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
      }
    } catch (error) {
      console.error("Error getting insight:", error);
      toast({ title: "Couldn't get insight right now", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!pdfStartDate || !pdfEndDate || !user) {
      toast({ title: "Please select date range", variant: "destructive" });
      return;
    }

    setGeneratingPdf(true);
    try {
      const startDate = parseISO(pdfStartDate);
      const endDate = parseISO(pdfEndDate);
      
      const filteredEntries = entries.filter(entry => {
        const entryDate = parseISO(entry.entry_date);
        return entryDate >= startDate && entryDate <= endDate;
      }).sort((a, b) => a.entry_date.localeCompare(b.entry_date));

      if (filteredEntries.length === 0) {
        toast({ title: "No entries in selected date range", variant: "destructive" });
        setGeneratingPdf(false);
        return;
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      pdf.setFontSize(24);
      pdf.setTextColor(34, 139, 34);
      pdf.text("Aurora Bloom Diary", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 20;

      // Entries
      for (const entry of filteredEntries) {
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = 20;
        }

        // Date header
        pdf.setFontSize(14);
        pdf.setTextColor(34, 139, 34);
        const formattedDate = format(parseISO(entry.entry_date), "EEEE, MMMM d, yyyy");
        pdf.text(`${entry.mood_sticker || ""} ${formattedDate}`, 20, yPosition);
        yPosition += 8;

        // Content
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(entry.content, pageWidth - 40);
        for (const line of lines) {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        }

        // Insight
        if (entry.insight) {
          yPosition += 4;
          pdf.setFontSize(10);
          pdf.setTextColor(128, 0, 128);
          pdf.text("Aurora's Insight:", 20, yPosition);
          yPosition += 6;
          const insightLines = pdf.splitTextToSize(entry.insight, pageWidth - 40);
          for (const line of insightLines) {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(line, 20, yPosition);
            yPosition += 5;
          }
        }

        yPosition += 15;
      }

      // Download
      pdf.save(`aurora-bloom-diary-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.pdf`);
      toast({ title: "PDF downloaded! 📄" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error generating PDF", variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const hasEntryOnDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return entries.some(e => e.entry_date === dateKey);
  };

  const currentTheme = themes.find(t => t.id === selectedTheme) || themes[0];

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-soft">
      <AppSidebar userId={user.id} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-4 md:px-6 py-4 flex items-center gap-3 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <PanelLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-serif font-bold truncate">My Diary</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Your private space for reflection</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isPro && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      title="Download PDF"
                      className="border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 ring-2 ring-amber-400/30"
                    >
                      <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Export Diary to PDF
                      </DialogTitle>
                      <DialogDescription>
                        Select a date range to export your diary entries as a PDF.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <input
                            type="date"
                            value={pdfStartDate}
                            onChange={(e) => setPdfStartDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <input
                            type="date"
                            value={pdfEndDate}
                            onChange={(e) => setPdfEndDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={generatePDF} 
                        disabled={generatingPdf || !pdfStartDate || !pdfEndDate}
                        className="w-full"
                      >
                        {generatingPdf ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <NotificationBell />
              <ThemeToggle />
              <ProfileIcon />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Calendar Dropdown */}
            <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-between border-green-200/50 bg-gradient-to-br", currentTheme.bg)}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    {hasEntryOnDate(selectedDate) && <span className="w-2 h-2 rounded-full bg-green-500" />}
                  </span>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", calendarOpen && "rotate-90")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className={cn("mt-2 border-green-200/50 bg-gradient-to-br", currentTheme.bg)}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        {format(currentMonth, "MMMM yyyy")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
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
                            onClick={() => { setSelectedDate(day); setCalendarOpen(false); }}
                            className={cn(
                              "aspect-square rounded-lg text-xs font-medium transition-all",
                              "hover:bg-green-200/50 dark:hover:bg-green-800/30",
                              isSelected && "bg-green-500 text-white hover:bg-green-600",
                              !isSelected && isTodayDate && "ring-2 ring-green-400",
                              hasEntry && !isSelected && "bg-green-100 dark:bg-green-900/30"
                            )}
                          >
                            {format(day, "d")}
                            {hasEntry && !isSelected && (
                              <span className="block w-1 h-1 rounded-full bg-green-500 mx-auto mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Entry Area */}
            <div className="space-y-4">
              {/* Theme & Sticker Selectors */}
              <Card className="border-green-200/50">
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    {isPro && (
                      <div className="flex-1 min-w-[150px]">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-500" />
                          Theme
                        </p>
                        <div className="flex gap-2">
                          {themes.map(theme => (
                            <button
                              key={theme.id}
                              onClick={() => setSelectedTheme(theme.id)}
                              className={cn(
                                "w-6 h-6 rounded-full bg-gradient-to-br transition-transform",
                                theme.bg,
                                selectedTheme === theme.id && "ring-2 ring-offset-2 ring-green-500 scale-110"
                              )}
                              title={theme.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {!isPro && (
                      <div className="flex-1 min-w-[150px]">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span>Themes available for Pro</span>
                        </p>
                      </div>
                    )}
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-xs text-muted-foreground mb-1">How are you feeling?</p>
                      <div className="flex flex-wrap gap-0.5">
                        {moodStickers.map(sticker => (
                          <button
                            key={sticker}
                            onClick={() => setSelectedSticker(selectedSticker === sticker ? null : sticker)}
                            className={cn(
                              "text-base p-0.5 rounded transition-transform hover:scale-110",
                              selectedSticker === sticker && "bg-green-100 dark:bg-green-900/50 scale-110"
                            )}
                          >
                            {sticker}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn("border-green-200/50 bg-gradient-to-br", currentTheme.bg)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-serif flex items-center gap-2">
                      {selectedSticker && <span className="text-2xl">{selectedSticker}</span>}
                      <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                      {isToday(selectedDate) && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-600 px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </CardTitle>
                    {currentEntry && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={deleteEntry}
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isToday(selectedDate) ? (
                    <>
                      <Textarea
                        placeholder="How are you feeling today? What's on your mind? Write freely..."
                        value={currentEntry}
                        onChange={(e) => setCurrentEntry(e.target.value)}
                        className="min-h-[200px] resize-none border-green-200/50 focus:border-green-400 text-base leading-relaxed"
                      />
                      
                      {/* Image Upload - Pro Only */}
                      {isPro && (
                        <div className="space-y-2">
                          {imageUrl ? (
                            <div className="relative inline-block">
                              <img src={imageUrl} alt="Diary" className="max-w-[200px] rounded-lg" />
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={removeImage}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <ImageIcon className="w-4 h-4" />
                                <span>Add an image</span>
                                {uploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                              />
                            </label>
                          )}
                        </div>
                      )}

                      {!isPro && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <span>Pro members can add images to diary entries and download the whole diary</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          onClick={saveEntry} 
                          disabled={saving || !currentEntry.trim()}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                        >
                          {saving ? "Saving..." : "Save Entry"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={getTherapistInsight}
                          disabled={loading || !currentEntry.trim()}
                          className="gap-2 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
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
                          {imageUrl && (
                            <img src={imageUrl} alt="Diary" className="max-w-[300px] rounded-lg" />
                          )}
                          <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border border-green-200/50">
                            <p className="text-base leading-relaxed whitespace-pre-wrap">{currentEntry}</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={getTherapistInsight}
                            disabled={loading}
                            className="gap-2 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
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
                          Aurora's Insight
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
