import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileIcon } from "@/components/ProfileIcon";
import { PanelLeft, Gamepad2, Palette, Wind, Music, Sparkles, Eraser, PaintBucket, Pause, Play, Square, Crown, Timer, Brain, Flower2, Puzzle, BookOpen, Moon, Music2, Eye, Undo2, UserCircle } from "lucide-react";
import { useCalmingSounds } from "@/hooks/useCalmingSounds";
import { createKrishnaBhajanAudio } from "@/hooks/useKrishnaBhajan";
import { GitaVerses } from "@/components/activities/GitaVerses";
import { YogaPoses } from "@/components/activities/YogaPoses";
import { Meditation } from "@/components/activities/Meditation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);
  
  const { playSound, stopSound, playingSound, isLoading: soundLoading } = useCalmingSounds();
  
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
  
  // Bhajan dance state
  const [bhajanPlaying, setBhajanPlaying] = useState(false);
  const [dancerFrame, setDancerFrame] = useState(0);
  const bhajanPlayerRef = useRef<ReturnType<typeof createKrishnaBhajanAudio> | null>(null);
  
  // Illusion state
  const [currentIllusion, setCurrentIllusion] = useState(0);
  const [illusionTimer, setIllusionTimer] = useState(30);
  const [illusionRunning, setIllusionRunning] = useState(false);

  // MBTI quiz state
  const [mbtiStep, setMbtiStep] = useState(0);
  const [mbtiAnswers, setMbtiAnswers] = useState<string[]>([]);
  const [mbtiResult, setMbtiResult] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else {
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
    let timeoutId: ReturnType<typeof setTimeout>;
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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    // Save initial state
    setCanvasHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, [activeGame]);

  // Bhajan dancer animation
  useEffect(() => {
    if (activeGame !== "bhajan" || !bhajanPlaying) return;
    const interval = setInterval(() => {
      setDancerFrame(prev => (prev + 1) % 8);
    }, 400);
    return () => clearInterval(interval);
  }, [activeGame, bhajanPlaying]);

  // Illusion timer
  useEffect(() => {
    if (activeGame !== "illusions" || !illusionRunning) return;
    const interval = setInterval(() => {
      setIllusionTimer(prev => {
        if (prev <= 1) {
          setIllusionRunning(false);
          setCurrentIllusion(p => (p + 1) % illusions.length);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeGame, illusionRunning]);

  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasHistory(prev => [...prev.slice(-20), state]); // Keep max 20 states
  }, []);

  const undoCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || canvasHistory.length <= 1) return;
    const newHistory = canvasHistory.slice(0, -1);
    setCanvasHistory(newHistory);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
  }, [canvasHistory]);

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

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasState();
    }
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1; tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fc = tempCtx.getImageData(0, 0, 1, 1).data;

    const getPixel = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    const setPixel = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      data[i] = fc[0]; data[i + 1] = fc[1]; data[i + 2] = fc[2]; data[i + 3] = 255;
    };
    const colorsMatch = (a: number[], b: number[], tolerance = 32) => {
      return Math.abs(a[0] - b[0]) <= tolerance && Math.abs(a[1] - b[1]) <= tolerance && Math.abs(a[2] - b[2]) <= tolerance;
    };

    const sx = Math.floor(startX);
    const sy = Math.floor(startY);
    if (sx < 0 || sx >= width || sy < 0 || sy >= height) return;

    const targetColor = getPixel(sx, sy);
    if (colorsMatch([fc[0], fc[1], fc[2]], targetColor)) return;

    const stack: [number, number][] = [[sx, sy]];
    const visited = new Set<number>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = y * width + x;
      if (visited.has(key)) continue;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const pixel = getPixel(x, y);
      if (!colorsMatch(pixel, targetColor)) continue;

      visited.add(key);
      setPixel(x, y);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
    saveCanvasState();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingTool !== "fill") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    floodFill(x, y, brushColor);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
  };

  // Bhajan audio
  const toggleBhajan = () => {
    if (bhajanPlaying) {
      setBhajanPlaying(false);
      if (bhajanPlayerRef.current) {
        bhajanPlayerRef.current.stop();
        bhajanPlayerRef.current = null;
      }
    } else {
      setBhajanPlaying(true);
      if (!bhajanPlayerRef.current) {
        bhajanPlayerRef.current = createKrishnaBhajanAudio();
      }
      bhajanPlayerRef.current.play();
    }
  };

  // Cleanup bhajan audio
  useEffect(() => {
    return () => {
      if (bhajanPlayerRef.current) {
        bhajanPlayerRef.current.stop();
        bhajanPlayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (activeGame !== "bhajan") {
      if (bhajanPlayerRef.current) {
        bhajanPlayerRef.current.stop();
        bhajanPlayerRef.current = null;
      }
      setBhajanPlaying(false);
    }
  }, [activeGame]);

  const sounds = [
    { key: "ocean", label: "🌊 Ocean Waves" },
    { key: "rain", label: "🌲 Forest Rain" },
    { key: "fire", label: "🔥 Crackling Fire" },
    { key: "birds", label: "🦜 Bird Songs" },
  ];

  useEffect(() => {
    return () => { stopSound(); };
  }, [activeGame]);

  // Focus timer logic
  useEffect(() => {
    if (activeGame !== "focus" || !focusRunning) return;
    const interval = setInterval(() => {
      setFocusTime((prev) => {
        if (prev <= 1) { setFocusRunning(false); return 0; }
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

  // MBTI Quiz
  const mbtiQuestions = [
    { q: "At a gathering, you prefer to:", a: "E:Engage with many people|I:Have deep conversations with a few" },
    { q: "You are more drawn to:", a: "S:Concrete facts and details|N:Ideas and possibilities" },
    { q: "When making decisions, you rely more on:", a: "T:Logic and analysis|F:Values and feelings" },
    { q: "You prefer your life to be:", a: "J:Planned and organized|P:Flexible and spontaneous" },
    { q: "You get energized by:", a: "E:Being around people|I:Spending time alone" },
    { q: "You trust more:", a: "S:Your experience|N:Your intuition" },
    { q: "You value more:", a: "T:Truth and fairness|F:Harmony and compassion" },
    { q: "You prefer to:", a: "J:Decide things quickly|P:Keep options open" },
    { q: "In conversations, you tend to:", a: "E:Think out loud|I:Think before speaking" },
    { q: "You focus more on:", a: "S:What is real now|N:What could be possible" },
    { q: "When a friend is upset, you first:", a: "F:Empathize with their feelings|T:Help them find a solution" },
    { q: "Your workspace is usually:", a: "J:Neat and organized|P:Creatively messy" },
  ];

  const calculateMbti = () => {
    const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    mbtiAnswers.forEach(a => {
      const letter = a.split(":")[0];
      counts[letter] = (counts[letter] || 0) + 1;
    });
    const type = `${counts.E >= counts.I ? 'E' : 'I'}${counts.S >= counts.N ? 'S' : 'N'}${counts.T >= counts.F ? 'T' : 'F'}${counts.J >= counts.P ? 'J' : 'P'}`;
    setMbtiResult(type);
    // Save to localStorage
    if (user) {
      localStorage.setItem(`mbti_result_${user.id}`, type);
    }
  };

  const illusions = [
    {
      title: "Spinning Spirals",
      description: "Stare at the center for 30 seconds, then look at your hand. Watch it 'breathe'!",
      render: () => (
        <div className="flex items-center justify-center py-4">
          <div className="w-40 h-40 rounded-full border-8 border-dashed border-primary animate-spin" style={{ animationDuration: "3s" }}>
            <div className="w-full h-full rounded-full border-4 border-dotted border-accent animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }}>
              <div className="w-full h-full rounded-full border-2 border-dashed border-primary/50 animate-spin" style={{ animationDuration: "1.5s" }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Pulsating Grid",
      description: "Do you see gray dots at the intersections? They're not really there!",
      render: () => (
        <div className="grid grid-cols-6 gap-2 py-4 mx-auto max-w-[200px]">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="w-6 h-6 bg-foreground/80 rounded-sm" />
          ))}
        </div>
      ),
    },
    {
      title: "Breathing Colors",
      description: "Let your eyes relax and watch the colors shift. Promotes calm.",
      render: () => (
        <div className="flex items-center justify-center py-4">
          <div className="w-48 h-48 rounded-full animate-pulse" style={{
            background: "radial-gradient(circle, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
            animationDuration: "4s",
          }}>
            <div className="w-full h-full rounded-full flex items-center justify-center animate-pulse" style={{
              background: "radial-gradient(circle, transparent 30%, hsl(var(--background)) 70%)",
              animationDuration: "3s",
              animationDelay: "1s",
            }}>
              <span className="text-base font-serif text-foreground/60">Breathe</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Necker Cube",
      description: "Focus on the cube - it flips between two orientations!",
      render: () => (
        <div className="flex items-center justify-center py-4">
          <svg viewBox="0 0 200 200" className="w-48 h-48">
            <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="50" x2="50" y2="150" stroke="currentColor" strokeWidth="2" />
            <line x1="150" y1="50" x2="150" y2="150" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="150" x2="150" y2="150" stroke="currentColor" strokeWidth="2" />
            <line x1="80" y1="20" x2="180" y2="20" stroke="currentColor" strokeWidth="2" opacity="0.6" />
            <line x1="80" y1="20" x2="80" y2="120" stroke="currentColor" strokeWidth="2" opacity="0.6" />
            <line x1="180" y1="20" x2="180" y2="120" stroke="currentColor" strokeWidth="2" opacity="0.6" />
            <line x1="80" y1="120" x2="180" y2="120" stroke="currentColor" strokeWidth="2" opacity="0.6" />
            <line x1="50" y1="50" x2="80" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
            <line x1="150" y1="50" x2="180" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
            <line x1="50" y1="150" x2="80" y2="120" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
            <line x1="150" y1="150" x2="180" y2="120" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          </svg>
        </div>
      ),
    },
    {
      title: "Zöllner Illusion",
      description: "The long lines are perfectly parallel! Short diagonal lines trick your brain.",
      render: () => (
        <div className="flex items-center justify-center py-4">
          <svg viewBox="0 0 200 160" className="w-56 h-40">
            {[20, 55, 90, 125].map((y, row) => (
              <g key={row}>
                <line x1="10" y1={y} x2="190" y2={y} stroke="currentColor" strokeWidth="2" />
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={i} x1={15 + i * 15} y1={y - 8} x2={15 + i * 15 + (row % 2 === 0 ? 8 : -8)} y2={y + 8} stroke="currentColor" strokeWidth="1" opacity="0.6" />
                ))}
              </g>
            ))}
          </svg>
        </div>
      ),
    },
    {
      title: "Moving Circles",
      description: "These concentric circles appear to move and shift.",
      render: () => (
        <div className="flex items-center justify-center py-4">
          <div className="relative w-48 h-48">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border-2 border-dashed border-primary/60 animate-spin"
                  style={{
                    width: `${i * 40}px`, height: `${i * 40}px`,
                    animationDuration: `${i * 2}s`,
                    animationDirection: i % 2 === 0 ? "reverse" : "normal",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Hermann Grid",
      description: "Dark spots appear at white intersections but vanish when you look directly!",
      render: () => (
        <div className="grid grid-cols-5 gap-3 py-4 mx-auto max-w-[220px]">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-foreground rounded" />
          ))}
        </div>
      ),
    },
    {
      title: "Rotating Snakes",
      description: "These circles appear to rotate, but they are perfectly still!",
      render: () => (
        <div className="flex items-center justify-center py-4 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-24 h-24 rounded-full" style={{
              background: `conic-gradient(from ${i * 120}deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--muted)), hsl(var(--primary)))`,
              animation: `spin ${3 + i}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
            }} />
          ))}
        </div>
      ),
    },
  ];

  const dancePoses = ["🕺", "💃", "🙏", "🤲", "🙌", "👐", "🤸", "🧘"];

  const activities = [
    { id: "breathing", title: "Mindful Breathing", description: "Guided 4-4-6 breathing exercise", icon: Wind, color: "from-blue-400 to-cyan-500" },
    { id: "drawing", title: "Expressive Canvas", description: "Free drawing to express emotions", icon: Palette, color: "from-purple-400 to-pink-500" },
    { id: "affirmations", title: "Daily Affirmations", description: "Positive affirmations for inner peace", icon: Sparkles, color: "from-amber-400 to-orange-500" },
    { id: "sounds", title: "Calming Sounds", description: "Nature sounds for relaxation", icon: Music, color: "from-green-400 to-emerald-500" },
    { id: "yogaPoses", title: "Yoga Asanas", description: "Guided yoga poses with timer", icon: Flower2, color: "from-indigo-400 to-violet-500" },
    { id: "memory", title: "Memory Match", description: "Relaxing memory card game", icon: Puzzle, color: "from-rose-400 to-pink-500" },
    { id: "gita", title: "Gita Wisdom", description: "Sacred verses with healing stories", icon: BookOpen, color: "from-orange-400 to-amber-500" },
  ];

  const proActivities = [
    { id: "bhajan", title: "Krishna Bhajan Dance", description: "Dance to divine Krishna bhajans", icon: Music2, color: "from-amber-400 to-yellow-500", isPro: true },
    { id: "meditation", title: "Meditation", description: "Guided meditation with calming sounds", icon: Moon, color: "from-purple-400 to-indigo-500", isPro: true },
    { id: "focus", title: "Focus Timer", description: "Pomodoro-style focus sessions", icon: Timer, color: "from-teal-400 to-cyan-500", isPro: true },
    { id: "gratitude", title: "Gratitude Journal", description: "Daily gratitude reflection", icon: Brain, color: "from-yellow-400 to-amber-500", isPro: true },
    { id: "illusions", title: "Illusions", description: "Relaxing optical illusions for your mind", icon: Eye, color: "from-violet-400 to-purple-600", isPro: true },
    { id: "mbti", title: "Personality Quiz", description: "Discover your MBTI personality type", icon: UserCircle, color: "from-pink-400 to-rose-600", isPro: true },
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

  const mbtiDescriptions: Record<string, string> = {
    INTJ: "The Architect — Imaginative and strategic thinkers with a plan for everything.",
    INTP: "The Logician — Innovative inventors with an unquenchable thirst for knowledge.",
    ENTJ: "The Commander — Bold, imaginative, and strong-willed leaders.",
    ENTP: "The Debater — Smart and curious thinkers who love intellectual challenges.",
    INFJ: "The Advocate — Quiet and mystical, yet very inspiring and tireless idealists.",
    INFP: "The Mediator — Poetic, kind, and altruistic, always eager to help a good cause.",
    ENFJ: "The Protagonist — Charismatic and inspiring leaders who mesmerize their listeners.",
    ENFP: "The Campaigner — Enthusiastic, creative, and sociable free spirits.",
    ISTJ: "The Logistician — Practical and fact-minded, whose reliability cannot be doubted.",
    ISFJ: "The Defender — Very dedicated and warm protectors, always ready to defend loved ones.",
    ESTJ: "The Executive — Excellent administrators, unsurpassed at managing things or people.",
    ESFJ: "The Consul — Extraordinarily caring, social, and popular, always eager to help.",
    ISTP: "The Virtuoso — Bold and practical experimenters, masters of all kinds of tools.",
    ISFP: "The Adventurer — Flexible and charming, always ready to explore and experience something new.",
    ESTP: "The Entrepreneur — Smart, energetic, and very perceptive, living on the edge.",
    ESFP: "The Entertainer — Spontaneous, energetic, and enthusiastic, life is never boring around them.",
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
                          <Button className="w-full bg-gradient-calm hover:opacity-90">Start Activity</Button>
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
                        <p className="font-medium">Unlock More with Pro!</p>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          <li>🎶 Krishna Bhajan Dance · 🌙 Meditation · ⏱️ Focus Timer</li>
                          <li>🙏 Gratitude Journal · 🌀 Illusions · 🧠 Personality Quiz</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => { setActiveGame(null); stopSound(); setBhajanPlaying(false); setIllusionRunning(false); setMbtiStep(0); setMbtiAnswers([]); setMbtiResult(null); }}>
                  ← Back to Activities
                </Button>

                {activeGame === "breathing" && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                      <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 ${
                        breathePhase === "inhale" ? "scale-125 bg-blue-400/30"
                        : breathePhase === "hold" ? "scale-125 bg-cyan-400/30"
                        : "scale-100 bg-blue-300/20"
                      }`}>
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000 ${
                          breathePhase === "inhale" ? "scale-110 bg-blue-400/50"
                          : breathePhase === "hold" ? "scale-110 bg-cyan-400/50"
                          : "scale-90 bg-blue-300/30"
                        }`}>
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
                          <Button variant={drawingTool === "brush" ? "default" : "outline"} size="sm" onClick={() => setDrawingTool("brush")} className="gap-1">
                            <Palette className="w-3 h-3" /> Brush
                          </Button>
                          <Button variant={drawingTool === "eraser" ? "default" : "outline"} size="sm" onClick={() => setDrawingTool("eraser")} className="gap-1">
                            <Eraser className="w-3 h-3" /> Eraser
                          </Button>
                          <Button variant={drawingTool === "fill" ? "default" : "outline"} size="sm" onClick={() => setDrawingTool("fill")} className="gap-1">
                            <PaintBucket className="w-3 h-3" /> Fill
                          </Button>
                        </div>
                        {["#4ade80", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#000000"].map((color) => (
                          <button key={color} className={`w-6 h-6 rounded-full border-2 ${brushColor === color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => setBrushColor(color)} />
                        ))}
                        <Button variant="outline" size="sm" onClick={undoCanvas} disabled={canvasHistory.length <= 1} className="gap-1">
                          <Undo2 className="w-3 h-3" /> Undo
                        </Button>
                        <Button variant="outline" size="sm" onClick={clearCanvas}>Clear</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <canvas ref={canvasRef} className="w-full h-[400px] rounded-lg cursor-crosshair border border-border" style={{ backgroundColor: "#ffffff" }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCanvasClick} />
                    </CardContent>
                  </Card>
                )}

                {activeGame === "affirmations" && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        {affirmations.map((affirmation, index) => (
                          <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:shadow-calm transition-all">
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
                      <CardDescription>Click to play ambient sounds</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {sounds.map((sound) => (
                          <Button key={sound.key} variant={playingSound === sound.key ? "default" : "outline"} className={`h-24 text-lg flex flex-col gap-2 ${playingSound === sound.key ? "bg-gradient-calm" : ""}`} onClick={() => playSound(sound.key)} disabled={soundLoading}>
                            <span className="text-2xl">{sound.label.split(" ")[0]}</span>
                            <span className="text-sm">{sound.label.split(" ").slice(1).join(" ")}</span>
                            {playingSound === sound.key && <span className="text-xs animate-pulse">♪ Playing...</span>}
                          </Button>
                        ))}
                      </div>
                      {playingSound && (
                        <div className="mt-4 flex justify-center">
                          <Button variant="outline" onClick={stopSound} className="gap-2">
                            <Square className="w-4 h-4" /> Stop Sound
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
                            <button key={index} onClick={() => handleCardClick(index)} className={`aspect-square rounded-lg text-2xl font-bold transition-all duration-300 ${isFlipped ? isMatched ? "bg-green-500/20 border-green-500" : "bg-primary/20 border-primary" : "bg-muted hover:bg-muted/80"} border-2`}>
                              {isFlipped ? ["🌸", "🌿", "🦋", "🌙", "⭐", "🌈"][card - 1] : "?"}
                            </button>
                          );
                        })}
                      </div>
                      {matchedCards.length === 12 && (
                        <p className="text-center mt-4 text-lg font-semibold text-green-600">🎉 Congratulations! You found all pairs!</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeGame === "focus" && (
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Timer className="w-5 h-5" /> Focus Timer</CardTitle>
                      <CardDescription>Pomodoro-style deep focus session</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col items-center py-4">
                        <div className="text-6xl font-mono font-bold mb-8">{formatTime(focusTime)}</div>
                        <div className="flex gap-2">
                          <Button size="lg" onClick={() => setFocusRunning(!focusRunning)} className="gap-2">
                            {focusRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            {focusRunning ? "Pause" : "Start"}
                          </Button>
                          <Button variant="outline" size="lg" onClick={() => { setFocusRunning(false); setFocusTime(25 * 60); }}>Reset</Button>
                        </div>
                        <div className="flex gap-2 mt-4">
                          {[5, 15, 25, 45].map((mins) => (
                            <Button key={mins} variant="ghost" size="sm" onClick={() => { setFocusRunning(false); setFocusTime(mins * 60); }}>{mins}m</Button>
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
                        <input type="text" placeholder="I am grateful for..." value={gratitudeInput} onChange={(e) => setGratitudeInput(e.target.value)} className="flex-1 px-4 py-2 rounded-lg border border-input bg-background" onKeyDown={(e) => { if (e.key === "Enter" && gratitudeInput.trim()) { setGratitudeEntries([...gratitudeEntries, gratitudeInput]); setGratitudeInput(""); } }} />
                        <Button onClick={() => { if (gratitudeInput.trim()) { setGratitudeEntries([...gratitudeEntries, gratitudeInput]); setGratitudeInput(""); } }}>Add</Button>
                      </div>
                      <div className="space-y-2">
                        {gratitudeEntries.map((entry, i) => (
                          <div key={i} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">🙏 {entry}</div>
                        ))}
                        {gratitudeEntries.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">Start by writing something you're grateful for...</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Krishna Bhajan Dance */}
                {activeGame === "bhajan" && (
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Music2 className="w-5 h-5 text-amber-500" />
                        Krishna Bhajan Dance
                      </CardTitle>
                      <CardDescription>Let the divine music move you 🙏</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-4">
                        <div className="text-7xl mb-3 transition-transform duration-300" style={{ transform: bhajanPlaying ? `rotate(${dancerFrame * 15 - 52}deg) scale(${1 + Math.sin(dancerFrame) * 0.1})` : 'none' }}>
                          {dancePoses[dancerFrame]}
                        </div>
                        <div className="flex gap-3 justify-center mb-3">
                          {["🦚", "🪷", "🪈", "🦚"].map((emoji, i) => (
                            <span key={i} className="text-2xl" style={{ animation: bhajanPlaying ? `pulse 1.5s ease-in-out ${i * 0.3}s infinite` : 'none' }}>{emoji}</span>
                          ))}
                        </div>
                        {bhajanPlaying && (
                          <p className="text-base font-serif text-amber-600 dark:text-amber-400 animate-pulse mb-3">
                            ♪ Hare Krishna Hare Krishna, Krishna Krishna Hare Hare ♪
                          </p>
                        )}
                        <div className="flex gap-3 justify-center">
                          <Button onClick={toggleBhajan} className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90">
                            {bhajanPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play Bhajan</>}
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                        <p className="text-xs text-muted-foreground italic font-serif">
                          "Dance as if nobody is watching, surrender to the rhythm of the divine." 🪈
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Illusions */}
                {activeGame === "illusions" && (
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-violet-500" />
                        Illusions
                      </CardTitle>
                      <CardDescription>Optical illusions that relax and fascinate your mind</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-xl font-serif font-bold mb-1">{illusions[currentIllusion].title}</h3>
                        <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">{illusions[currentIllusion].description}</p>
                      </div>
                      
                      {illusions[currentIllusion].render()}

                      <div className="flex flex-col items-center gap-3">
                        <div className="text-3xl font-mono font-bold">{illusionTimer}s</div>
                        <div className="flex gap-2">
                          <Button onClick={() => setIllusionRunning(!illusionRunning)} className="gap-2">
                            {illusionRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {illusionRunning ? "Pause" : "Start Timer"}
                          </Button>
                          <Button variant="outline" onClick={() => { setCurrentIllusion((currentIllusion + 1) % illusions.length); setIllusionTimer(30); setIllusionRunning(false); }}>
                            Next →
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-center">
                        <p className="text-xs text-muted-foreground italic">
                          💡 Optical illusions train your brain to slow down and observe more carefully.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* MBTI Personality Quiz */}
                {activeGame === "mbti" && (
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-pink-500" />
                        Personality Quiz (MBTI)
                      </CardTitle>
                      <CardDescription>Discover your personality type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {mbtiResult ? (
                        <div className="text-center space-y-4 py-4">
                          <div className="text-5xl font-bold text-primary">{mbtiResult}</div>
                          <p className="text-lg font-serif">{mbtiDescriptions[mbtiResult]}</p>
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-sm text-muted-foreground">
                              Your result has been saved! Check your <strong>My Persona</strong> section under the profile icon for a detailed reflection incorporating your personality type.
                            </p>
                          </div>
                          <Button onClick={() => { setMbtiStep(0); setMbtiAnswers([]); setMbtiResult(null); }}>Retake Quiz</Button>
                        </div>
                      ) : (
                        <div className="space-y-6 py-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Question {mbtiStep + 1} of {mbtiQuestions.length}</span>
                            <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((mbtiStep + 1) / mbtiQuestions.length) * 100}%` }} />
                            </div>
                          </div>
                          <h3 className="text-lg font-serif">{mbtiQuestions[mbtiStep].q}</h3>
                          <RadioGroup
                            value={mbtiAnswers[mbtiStep] || ""}
                            onValueChange={(val) => {
                              const newAnswers = [...mbtiAnswers];
                              newAnswers[mbtiStep] = val;
                              setMbtiAnswers(newAnswers);
                            }}
                          >
                            {mbtiQuestions[mbtiStep].a.split("|").map((opt) => {
                              const label = opt.split(":")[1];
                              return (
                                <div key={opt} className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                                  <RadioGroupItem value={opt} id={`mbti-${opt}`} />
                                  <Label htmlFor={`mbti-${opt}`} className="cursor-pointer flex-1">{label}</Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                          <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setMbtiStep(Math.max(0, mbtiStep - 1))} disabled={mbtiStep === 0}>
                              Back
                            </Button>
                            {mbtiStep < mbtiQuestions.length - 1 ? (
                              <Button onClick={() => setMbtiStep(mbtiStep + 1)} disabled={!mbtiAnswers[mbtiStep]}>
                                Next
                              </Button>
                            ) : (
                              <Button onClick={calculateMbti} disabled={!mbtiAnswers[mbtiStep]}>
                                See Result
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
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
