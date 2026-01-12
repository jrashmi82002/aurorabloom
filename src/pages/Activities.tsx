import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileIcon } from "@/components/ProfileIcon";
import { PanelLeft, Gamepad2, Palette, Wind, Music, Sparkles, Eraser, PaintBucket, Pause, Play, Square, Crown, Timer, Brain, Flower2, Puzzle, BookOpen, Moon } from "lucide-react";
import { useCalmingSounds } from "@/hooks/useCalmingSounds";
import { GitaVerses } from "@/components/activities/GitaVerses";
import { YogaPoses } from "@/components/activities/YogaPoses";
import { Meditation } from "@/components/activities/Meditation";

const Activities = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#4ade80");
  const [drawingTool, setDrawingTool] = useState<"brush" | "eraser" | "fill">("brush");
  const [breathePhase, setBreathePhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  
  // Use the calming sounds hook
  const { playSound, stopSound, playingSound, isLoading: soundLoading } = useCalmingSounds();
  
  // Pro activity states
  const [yogaTimer, setYogaTimer] = useState(30);
  const [yogaPose, setYogaPose] = useState(0);
  const [yogaRunning, setYogaRunning] = useState(false);
  const [memoryCards, setMemoryCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [gratitudeEntries, setGratitudeEntries] = useState<string[]>([]);
  const [gratitudeInput, setGratitudeInput] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkProStatus(session.user.id);
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

  // Breathing exercise logic
  useEffect(() => {
    if (activeGame !== "breathing") return;
    
    const phases = [
      { phase: "inhale" as const, duration: 4000 },
      { phase: "hold" as const, duration: 4000 },
      { phase: "exhale" as const, duration: 6000 },
    ];
    
    let phaseIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const cyclePhases = () => {
      setBreathePhase(phases[phaseIndex].phase);
      timeoutId = setTimeout(() => {
        phaseIndex = (phaseIndex + 1) % phases.length;
        cyclePhases();
      }, phases[phaseIndex].duration);
    };
    
    cyclePhases();
    return () => clearTimeout(timeoutId);
  }, [activeGame]);

  // Drawing canvas setup - white background like MS Paint
  useEffect(() => {
    if (activeGame !== "drawing" || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
  }, [activeGame]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingTool === "fill") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = drawingTool === "eraser" ? "#ffffff" : brushColor;
    ctx.lineWidth = drawingTool === "eraser" ? 20 : 4;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingTool !== "fill") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fillStyle = brushColor;
    ctx.fill();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Sound labels
  const sounds = [
    { key: "ocean", label: "🌊 Ocean Waves" },
    { key: "rain", label: "🌲 Forest Rain" },
    { key: "fire", label: "🔥 Crackling Fire" },
    { key: "birds", label: "🦜 Bird Songs" },
  ];

  // Cleanup sounds on game change
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [activeGame]);

  const yogaPoses = [
    { name: "Mountain Pose", duration: 30, description: "Stand tall with feet together, arms at sides" },
    { name: "Tree Pose", duration: 30, description: "Balance on one foot, other foot on inner thigh" },
    { name: "Child's Pose", duration: 45, description: "Kneel and stretch forward with arms extended" },
    { name: "Cat-Cow Stretch", duration: 30, description: "Alternate arching and rounding your back" },
    { name: "Corpse Pose", duration: 60, description: "Lie flat on your back, relax completely" },
  ];

  // Focus timer logic
  useEffect(() => {
    if (activeGame !== "focus" || !focusRunning) return;
    
    const interval = setInterval(() => {
      setFocusTime((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGame, focusRunning]);

  // Initialize memory game
  useEffect(() => {
    if (activeGame === "memory") {
      const pairs = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6];
      setMemoryCards(pairs.sort(() => Math.random() - 0.5));
      setFlippedCards([]);
      setMatchedCards([]);
    }
  }, [activeGame]);

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedCards.includes(index)) return;
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      if (memoryCards[newFlipped[0]] === memoryCards[newFlipped[1]]) {
        setMatchedCards([...matchedCards, ...newFlipped]);
      }
      setTimeout(() => setFlippedCards([]), 1000);
    }
  };

  const activities = [
    {
      id: "breathing",
      title: "Mindful Breathing",
      description: "Guided 4-4-6 breathing exercise for calm",
      icon: Wind,
      color: "from-blue-400 to-cyan-500",
    },
    {
      id: "drawing",
      title: "Expressive Canvas",
      description: "Free drawing to express your emotions",
      icon: Palette,
      color: "from-purple-400 to-pink-500",
    },
    {
      id: "affirmations",
      title: "Daily Affirmations",
      description: "Positive affirmations for inner peace",
      icon: Sparkles,
      color: "from-amber-400 to-orange-500",
    },
    {
      id: "sounds",
      title: "Calming Sounds",
      description: "Nature sounds for relaxation",
      icon: Music,
      color: "from-green-400 to-emerald-500",
    },
  ];

  const proActivities = [
    {
      id: "gita",
      title: "Gita Wisdom",
      description: "Sacred verses with healing stories",
      icon: BookOpen,
      color: "from-orange-400 to-amber-500",
      isPro: true,
    },
    {
      id: "yogaPoses",
      title: "Yoga Asanas",
      description: "Guided yoga poses with timer",
      icon: Flower2,
      color: "from-indigo-400 to-violet-500",
      isPro: true,
    },
    {
      id: "meditation",
      title: "Meditation",
      description: "Guided meditation with calming sounds",
      icon: Moon,
      color: "from-purple-400 to-indigo-500",
      isPro: true,
    },
    {
      id: "memory",
      title: "Memory Match",
      description: "Relaxing memory card game",
      icon: Puzzle,
      color: "from-rose-400 to-pink-500",
      isPro: true,
    },
    {
      id: "focus",
      title: "Focus Timer",
      description: "Pomodoro-style focus sessions",
      icon: Timer,
      color: "from-teal-400 to-cyan-500",
      isPro: true,
    },
    {
      id: "gratitude",
      title: "Gratitude Journal",
      description: "Daily gratitude reflection",
      icon: Brain,
      color: "from-yellow-400 to-amber-500",
      isPro: true,
    },
  ];

  const allActivities = isPro ? [...activities, ...proActivities] : activities;

  const affirmations = [
    "I am worthy of love and happiness",
    "I release what I cannot control",
    "I am growing stronger every day",
    "I choose peace over worry",
    "I am enough, just as I am",
    "I trust my journey and my path",
    "I deserve rest and self-care",
    "I am capable of wonderful things",
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-serif font-bold truncate">Therapy Activities</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Mind-calming exercises for your wellbeing</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <NotificationBell />
              <ThemeToggle />
              <ProfileIcon />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {!activeGame ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allActivities.map((activity) => {
                    const Icon = activity.icon;
                    const isProActivity = 'isPro' in activity && activity.isPro;
                    return (
                      <Card
                        key={activity.id}
                        className="group hover:shadow-calm transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 relative"
                        onClick={() => setActiveGame(activity.id)}
                      >
                        {isProActivity && (
                          <div className="absolute top-2 right-2 z-10">
                            <Crown className="w-5 h-5 text-amber-500" />
                          </div>
                        )}
                        <CardHeader className="space-y-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activity.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <CardTitle className="text-lg font-serif">{activity.title}</CardTitle>
                          <CardDescription>{activity.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-gradient-calm hover:opacity-90">
                            Start Activity
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {!isPro && (
                  <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 p-4">
                    <div className="flex items-start gap-3">
                      <Crown className="w-6 h-6 text-amber-500 shrink-0" />
                      <div>
                        <p className="font-medium">Unlock 6 More Activities with Pro!</p>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          <li>📖 <strong>Gita Wisdom</strong> - Sacred verses with healing stories</li>
                          <li>🧘 <strong>Yoga Asanas</strong> - Guided poses with timer & benefits</li>
                          <li>🌙 <strong>Meditation</strong> - Guided meditation with calming sounds & bell</li>
                          <li>🧩 <strong>Memory Match</strong> - Relaxing memory card game</li>
                          <li>⏱️ <strong>Focus Timer</strong> - Pomodoro-style focus sessions</li>
                          <li>🙏 <strong>Gratitude Journal</strong> - Daily gratitude reflection</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => { setActiveGame(null); stopSound(); }}>
                  ← Back to Activities
                </Button>

                {activeGame === "breathing" && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                      <div
                        className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 ${
                          breathePhase === "inhale"
                            ? "scale-125 bg-blue-400/30"
                            : breathePhase === "hold"
                            ? "scale-125 bg-cyan-400/30"
                            : "scale-100 bg-blue-300/20"
                        }`}
                      >
                        <div
                          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000 ${
                            breathePhase === "inhale"
                              ? "scale-110 bg-blue-400/50"
                              : breathePhase === "hold"
                              ? "scale-110 bg-cyan-400/50"
                              : "scale-90 bg-blue-300/30"
                          }`}
                        >
                          <span className="text-2xl font-serif capitalize">{breathePhase}</span>
                        </div>
                      </div>
                      <p className="mt-8 text-muted-foreground text-center max-w-md">
                        {breathePhase === "inhale" && "Breathe in slowly through your nose..."}
                        {breathePhase === "hold" && "Hold your breath gently..."}
                        {breathePhase === "exhale" && "Release slowly through your mouth..."}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {activeGame === "drawing" && (
                  <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                      <CardTitle>Express Yourself</CardTitle>
                      <div className="flex gap-2 flex-wrap items-center">
                        <div className="flex gap-1 mr-2 border-r pr-2 border-border">
                          <Button
                            variant={drawingTool === "brush" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDrawingTool("brush")}
                            className="gap-1"
                          >
                            <Palette className="w-3 h-3" />
                            Brush
                          </Button>
                          <Button
                            variant={drawingTool === "eraser" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDrawingTool("eraser")}
                            className="gap-1"
                          >
                            <Eraser className="w-3 h-3" />
                            Eraser
                          </Button>
                          <Button
                            variant={drawingTool === "fill" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDrawingTool("fill")}
                            className="gap-1"
                          >
                            <PaintBucket className="w-3 h-3" />
                            Fill
                          </Button>
                        </div>
                        {["#4ade80", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#000000"].map((color) => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 ${brushColor === color ? "border-foreground" : "border-transparent"}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setBrushColor(color)}
                          />
                        ))}
                        <Button variant="outline" size="sm" onClick={clearCanvas}>Clear</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <canvas
                        ref={canvasRef}
                        className="w-full h-[400px] rounded-lg cursor-crosshair border border-border"
                        style={{ backgroundColor: "#ffffff" }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={handleCanvasClick}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeGame === "affirmations" && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        {affirmations.map((affirmation, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:shadow-calm transition-all"
                          >
                            <p className="text-lg font-serif text-center">✨ {affirmation} ✨</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeGame === "sounds" && (
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>Calming Nature Sounds</CardTitle>
                      <CardDescription>Click to play ambient sounds generated in real-time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {sounds.map((sound) => (
                          <Button
                            key={sound.key}
                            variant={playingSound === sound.key ? "default" : "outline"}
                            className={`h-24 text-lg flex flex-col gap-2 ${
                              playingSound === sound.key ? "bg-gradient-calm" : ""
                            }`}
                            onClick={() => playSound(sound.key)}
                            disabled={soundLoading}
                          >
                            <span className="text-2xl">{sound.label.split(" ")[0]}</span>
                            <span className="text-sm">{sound.label.split(" ").slice(1).join(" ")}</span>
                            {playingSound === sound.key && (
                              <span className="text-xs animate-pulse">♪ Playing...</span>
                            )}
                          </Button>
                        ))}
                      </div>
                      {playingSound && (
                        <div className="mt-4 flex justify-center">
                          <Button variant="outline" onClick={stopSound} className="gap-2">
                            <Square className="w-4 h-4" />
                            Stop Sound
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeGame === "gita" && <GitaVerses />}

                {activeGame === "yogaPoses" && <YogaPoses />}

                {activeGame === "memory" && (
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>Memory Match</CardTitle>
                      <CardDescription>Find all matching pairs to win!</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        {memoryCards.map((card, index) => {
                          const isFlipped = flippedCards.includes(index) || matchedCards.includes(index);
                          const isMatched = matchedCards.includes(index);
                          return (
                            <button
                              key={index}
                              onClick={() => handleCardClick(index)}
                              className={`aspect-square rounded-lg text-2xl font-bold transition-all duration-300 ${
                                isFlipped
                                  ? isMatched
                                    ? "bg-green-500/20 border-green-500"
                                    : "bg-primary/20 border-primary"
                                  : "bg-muted hover:bg-muted/80"
                              } border-2`}
                            >
                              {isFlipped ? ["🌸", "🌿", "🦋", "🌙", "⭐", "🌈"][card - 1] : "?"}
                            </button>
                          );
                        })}
                      </div>
                      {matchedCards.length === 12 && (
                        <p className="text-center mt-4 text-lg font-semibold text-green-600">
                          🎉 Congratulations! You found all pairs!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeGame === "focus" && (
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="w-5 h-5" />
                        Focus Timer
                      </CardTitle>
                      <CardDescription>
                        Pomodoro-style deep focus session
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* What is Focus Timer */}
                      <div className="p-4 rounded-lg bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
                        <h4 className="font-semibold text-sm mb-2">🎯 What is the Focus Timer?</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Based on the Pomodoro Technique, this timer helps you maintain deep focus by working in concentrated intervals. It's scientifically proven to improve productivity and reduce mental fatigue.
                        </p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>✨ <strong>How to use:</strong></p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Choose your focus duration (25 min recommended)</li>
                            <li>Remove all distractions - put phone away</li>
                            <li>Press Start and focus on ONE task only</li>
                            <li>When timer ends, take a 5-minute break</li>
                            <li>Repeat for maximum productivity!</li>
                          </ol>
                        </div>
                      </div>

                      {/* Timer Display */}
                      <div className="flex flex-col items-center py-4">
                        <div className="text-6xl font-mono font-bold mb-8">
                          {formatTime(focusTime)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="lg"
                            onClick={() => setFocusRunning(!focusRunning)}
                            className="gap-2"
                          >
                            {focusRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            {focusRunning ? "Pause" : "Start"}
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => {
                              setFocusRunning(false);
                              setFocusTime(25 * 60);
                            }}
                          >
                            Reset
                          </Button>
                        </div>
                        <div className="flex gap-2 mt-4">
                          {[5, 15, 25, 45].map((mins) => (
                            <Button
                              key={mins}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFocusRunning(false);
                                setFocusTime(mins * 60);
                              }}
                            >
                              {mins}m
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeGame === "meditation" && <Meditation />}

                {activeGame === "gratitude" && (
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>Gratitude Journal</CardTitle>
                      <CardDescription>Write down things you're grateful for today</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="I am grateful for..."
                          value={gratitudeInput}
                          onChange={(e) => setGratitudeInput(e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg border border-input bg-background"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && gratitudeInput.trim()) {
                              setGratitudeEntries([...gratitudeEntries, gratitudeInput]);
                              setGratitudeInput("");
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            if (gratitudeInput.trim()) {
                              setGratitudeEntries([...gratitudeEntries, gratitudeInput]);
                              setGratitudeInput("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {gratitudeEntries.map((entry, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                          >
                            🙏 {entry}
                          </div>
                        ))}
                        {gratitudeEntries.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            Start by writing something you're grateful for...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Activities;
