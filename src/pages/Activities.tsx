import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PanelLeft, Gamepad2, Palette, Wind, Music, Sparkles, Eraser, PaintBucket, Pause, Play, Crown, Timer, Brain, Flower2, Puzzle } from "lucide-react";

const Activities = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#4ade80");
  const [drawingTool, setDrawingTool] = useState<"brush" | "eraser" | "fill">("brush");
  const [breathePhase, setBreathePhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Pro activity states
  const [yogaTimer, setYogaTimer] = useState(30);
  const [yogaPose, setYogaPose] = useState(0);
  const [yogaRunning, setYogaRunning] = useState(false);
  const [memoryCards, setMemoryCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);

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
    
    setIsPro(profile?.pro_subscription_status === "active");
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
    
    // Simple flood fill at click position (fill a circular area)
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

  // Sound URLs - using reliable public audio sources
  const sounds: Record<string, { url: string; label: string }> = {
    ocean: { 
      url: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Waves.ogg",
      label: "🌊 Ocean Waves"
    },
    rain: { 
      url: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Rain_moderate_on_window.ogg",
      label: "🌲 Forest Rain"
    },
    fire: { 
      url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Fireplace.ogg",
      label: "🔥 Crackling Fire"
    },
    birds: { 
      url: "https://upload.wikimedia.org/wikipedia/commons/4/45/A_curious_bird.ogg",
      label: "🦜 Bird Songs"
    },
  };

  const playSound = (soundKey: string) => {
    // Stop current audio if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    // Toggle off if same sound
    if (playingSound === soundKey) {
      setPlayingSound(null);
      return;
    }
    
    // Create and play new audio
    const soundData = sounds[soundKey];
    if (!soundData) return;
    
    const audio = new Audio(soundData.url);
    audio.loop = true;
    audio.volume = 0.7;
    
    // Set up event handlers before playing
    audio.oncanplaythrough = () => {
      audio.play().then(() => {
        audioRef.current = audio;
        setPlayingSound(soundKey);
      }).catch((err) => {
        console.error("Audio playback failed:", err);
        setPlayingSound(null);
      });
    };
    
    audio.onerror = (e) => {
      console.error("Audio load error for:", soundKey, e);
      setPlayingSound(null);
    };
    
    // Load the audio
    audio.load();
  };

  // Cleanup audio on unmount or game change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [activeGame]);

  const yogaPoses = [
    { name: "Mountain Pose", duration: 30, description: "Stand tall with feet together, arms at sides" },
    { name: "Tree Pose", duration: 30, description: "Balance on one foot, other foot on inner thigh" },
    { name: "Child's Pose", duration: 45, description: "Kneel and stretch forward with arms extended" },
    { name: "Cat-Cow Stretch", duration: 30, description: "Alternate arching and rounding your back" },
    { name: "Corpse Pose", duration: 60, description: "Lie flat on your back, relax completely" },
  ];

  // Yoga timer logic
  useEffect(() => {
    if (activeGame !== "yoga" || !yogaRunning) return;
    
    const interval = setInterval(() => {
      setYogaTimer((prev) => {
        if (prev <= 1) {
          // Move to next pose
          if (yogaPose < yogaPoses.length - 1) {
            setYogaPose(p => p + 1);
            return yogaPoses[(yogaPose + 1) % yogaPoses.length].duration;
          } else {
            setYogaRunning(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGame, yogaRunning, yogaPose]);

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
      id: "yoga",
      title: "Yoga Asanas",
      description: "Guided yoga poses with timer",
      icon: Flower2,
      color: "from-indigo-400 to-violet-500",
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold">Therapy Activities</h1>
                <p className="text-sm text-muted-foreground">Mind-calming exercises for your wellbeing</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {!activeGame ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-amber-500" />
                      <div>
                        <p className="font-medium">Unlock 4 More Activities with Pro!</p>
                        <p className="text-sm text-muted-foreground">Yoga poses, memory games, focus timer & gratitude journal</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setActiveGame(null)}>
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
                        {/* Tool Buttons */}
                        <div className="flex gap-1 mr-2 border-r pr-2 border-border">
                          <Button
                            variant={drawingTool === "brush" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDrawingTool("brush")}
                            className="gap-1"
                          >
                            <Palette className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={drawingTool === "eraser" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDrawingTool("eraser")}
                            className="gap-1"
                          >
                            <Eraser className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={drawingTool === "fill" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDrawingTool("fill")}
                            className="gap-1"
                          >
                            <PaintBucket className="w-4 h-4" />
                          </Button>
                        </div>
                        {/* Color Picker */}
                        {["#4ade80", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#ffffff", "#ef4444", "#000000"].map((color) => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              brushColor === color ? "scale-125 border-primary ring-2 ring-primary/50" : "border-muted"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setBrushColor(color)}
                          />
                        ))}
                        <Button variant="outline" size="sm" onClick={clearCanvas}>
                          Clear
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <canvas
                        ref={canvasRef}
                        className={`w-full h-[400px] rounded-lg ${drawingTool === "fill" ? "cursor-cell" : drawingTool === "eraser" ? "cursor-pointer" : "cursor-crosshair"}`}
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
                  <Card>
                    <CardContent className="p-8">
                      <div className="grid gap-4">
                        {affirmations.map((affirmation, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 text-center animate-fade-in"
                            style={{ animationDelay: `${i * 100}ms` }}
                          >
                            <p className="text-lg font-serif">{affirmation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeGame === "sounds" && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 ${playingSound ? "animate-pulse" : ""}`}>
                        <Music className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-xl font-serif mb-2">Nature Sounds</h3>
                      <p className="text-muted-foreground mb-6">
                        {playingSound ? `Playing ${sounds[playingSound]?.label}... Click again to stop` : "Close your eyes and imagine yourself in a peaceful place..."}
                      </p>
                      <div className="flex justify-center gap-3 flex-wrap">
                        {Object.entries(sounds).map(([key, data]) => (
                          <Button 
                            key={key} 
                            variant={playingSound === key ? "default" : "outline"} 
                            className="gap-2"
                            onClick={() => playSound(key)}
                          >
                            {playingSound === key ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {data.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* PRO ACTIVITIES */}
                {activeGame === "yoga" && isPro && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center mb-6">
                        <Flower2 className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-serif mb-2">{yogaPoses[yogaPose].name}</h3>
                      <p className="text-muted-foreground mb-4">{yogaPoses[yogaPose].description}</p>
                      <div className="text-5xl font-bold text-primary mb-6">{yogaTimer}s</div>
                      <div className="flex justify-center gap-3">
                        <Button
                          onClick={() => {
                            if (yogaRunning) {
                              setYogaRunning(false);
                            } else {
                              setYogaTimer(yogaPoses[yogaPose].duration);
                              setYogaRunning(true);
                            }
                          }}
                          className="gap-2"
                        >
                          {yogaRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {yogaRunning ? "Pause" : "Start Session"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setYogaPose(0);
                            setYogaTimer(yogaPoses[0].duration);
                            setYogaRunning(false);
                          }}
                        >
                          Reset
                        </Button>
                      </div>
                      <div className="mt-6 flex justify-center gap-2">
                        {yogaPoses.map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${i === yogaPose ? "bg-primary" : i < yogaPose ? "bg-primary/50" : "bg-muted"}`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeGame === "memory" && isPro && (
                  <Card>
                    <CardContent className="p-8">
                      <h3 className="text-xl font-serif mb-4 text-center">Memory Match</h3>
                      <p className="text-muted-foreground mb-6 text-center">Find all matching pairs to complete the game</p>
                      <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                        {memoryCards.map((card, index) => (
                          <button
                            key={index}
                            className={`aspect-square rounded-lg text-2xl font-bold transition-all duration-300 ${
                              flippedCards.includes(index) || matchedCards.includes(index)
                                ? "bg-primary text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            onClick={() => handleCardClick(index)}
                          >
                            {flippedCards.includes(index) || matchedCards.includes(index) ? ["🌸", "🌺", "🌻", "🌷", "🌹", "🌼"][card - 1] : "?"}
                          </button>
                        ))}
                      </div>
                      {matchedCards.length === 12 && (
                        <div className="mt-6 text-center">
                          <p className="text-xl font-semibold text-primary">🎉 Congratulations! You won!</p>
                          <Button className="mt-4" onClick={() => setActiveGame("memory")}>
                            Play Again
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeGame === "focus" && isPro && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-6">
                        <Timer className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-xl font-serif mb-2">Focus Timer</h3>
                      <p className="text-muted-foreground mb-6">
                        Use the Pomodoro technique: 25 min focus, 5 min break
                      </p>
                      <div className="text-5xl font-bold text-primary mb-6">25:00</div>
                      <div className="flex justify-center gap-3">
                        <Button className="gap-2">
                          <Play className="w-4 h-4" /> Start Focus
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeGame === "gratitude" && isPro && (
                  <Card>
                    <CardContent className="p-8">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-6">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-serif mb-4 text-center">Gratitude Journal</h3>
                      <p className="text-muted-foreground mb-6 text-center">
                        Write 3 things you're grateful for today
                      </p>
                      <div className="space-y-3 max-w-md mx-auto">
                        {[1, 2, 3].map((num) => (
                          <div key={num} className="flex items-center gap-3">
                            <span className="text-2xl">✨</span>
                            <input
                              type="text"
                              placeholder={`Gratitude #${num}`}
                              className="flex-1 px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 text-center">
                        <Button className="bg-gradient-calm">Save Gratitudes</Button>
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
