import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { PanelLeft, Gamepad2, Palette, Wind, Music, Sparkles, Eraser, PaintBucket, Pause, Play } from "lucide-react";

const Activities = () => {
  const [user, setUser] = useState<User | null>(null);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

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

  // Drawing canvas setup
  useEffect(() => {
    if (activeGame !== "drawing" || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = "#1a1a2e";
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
    ctx.strokeStyle = drawingTool === "eraser" ? "#1a1a2e" : brushColor;
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
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Sound URLs (free nature sounds)
  const sounds: Record<string, string> = {
    ocean: "https://cdn.pixabay.com/audio/2022/05/16/audio_1333de3b82.mp3",
    rain: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112847a.mp3",
    fire: "https://cdn.pixabay.com/audio/2021/10/08/audio_4deab48c2e.mp3",
    birds: "https://cdn.pixabay.com/audio/2022/02/07/audio_9a1da63c41.mp3",
  };

  const playSound = (soundKey: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (playingSound === soundKey) {
      setPlayingSound(null);
      return;
    }
    
    const audio = new Audio(sounds[soundKey]);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play();
    audioRef.current = audio;
    setPlayingSound(soundKey);
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold">Therapy Activities</h1>
                <p className="text-sm text-muted-foreground">Mind-calming exercises for your wellbeing</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {!activeGame ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <Card
                      key={activity.id}
                      className="group hover:shadow-calm transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0"
                      onClick={() => setActiveGame(activity.id)}
                    >
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
                        {playingSound ? "Playing... Click again to stop" : "Close your eyes and imagine yourself in a peaceful place..."}
                      </p>
                      <div className="flex justify-center gap-4 flex-wrap">
                        {[
                          { key: "ocean", label: "🌊 Ocean Waves" },
                          { key: "rain", label: "🌲 Forest Rain" },
                          { key: "fire", label: "🔥 Crackling Fire" },
                          { key: "birds", label: "🦜 Bird Songs" },
                        ].map((sound) => (
                          <Button 
                            key={sound.key} 
                            variant={playingSound === sound.key ? "default" : "outline"} 
                            className="gap-2"
                            onClick={() => playSound(sound.key)}
                          >
                            {playingSound === sound.key ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {sound.label}
                          </Button>
                        ))}
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
