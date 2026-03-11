import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Bell, Volume2, VolumeX } from "lucide-react";

const meditationInstructions = [
  "Find a comfortable seated position",
  "Close your eyes gently",
  "Take three deep breaths to settle in",
  "Let your breathing become natural",
  "Notice any sensations in your body",
  "When thoughts arise, acknowledge them and return to your breath",
  "Stay present with each inhale and exhale",
  "The bell will gently signal when your session is complete"
];

export const Meditation = () => {
  const [duration, setDuration] = useState(5); // minutes
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    setTimeRemaining(duration * 60);
  }, [duration]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playBell();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const playBell = () => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Create a singing bowl / bell sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Bell-like frequencies
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(528, audioContext.currentTime); // Solfeggio frequency
      
      // Fade in and out for bell-like envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 4);
      oscillatorsRef.current.push(oscillator);
    } catch (error) {
      console.error("Error playing bell:", error);
    }
  };

  const playMeditativeSound = () => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Create a calming drone sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator1.type = "sine";
      oscillator1.frequency.setValueAtTime(174.61, audioContext.currentTime); // D3
      
      oscillator2.type = "sine";
      oscillator2.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 2);
      
      oscillator1.start();
      oscillator2.start();
      oscillatorsRef.current.push(oscillator1, oscillator2);
      
      // Store references for cleanup
      return () => {
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
        setTimeout(() => {
          oscillator1.stop();
          oscillator2.stop();
        }, 1000);
      };
    } catch (error) {
      console.error("Error playing meditative sound:", error);
    }
  };

  const stopSound = () => {
    oscillatorsRef.current.forEach((osc) => {
      try { osc.stop(); } catch (e) { /* Already stopped */ }
    });
    oscillatorsRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleStart = () => {
    if (!isRunning && showInstructions) {
      setShowInstructions(false);
      playBell(); // Initial bell to start
    }
    setIsRunning(true);
    playMeditativeSound();
  };

  const handlePause = () => {
    setIsRunning(false);
    stopSound();
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(duration * 60);
    setShowInstructions(true);
    stopSound();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration * 60 - timeRemaining) / (duration * 60)) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🧘</span>
              Guided Meditation
            </CardTitle>
            <CardDescription>
              Find stillness and peace with guided meditation
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {showInstructions ? (
          <div className="space-y-4">
            <h4 className="font-semibold text-center">Before You Begin</h4>
            <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-lg p-4 space-y-2">
              {meditationInstructions.map((instruction, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  <span className="text-muted-foreground">{instruction}</span>
                </div>
              ))}
            </div>
            
            {/* Duration selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Duration</span>
                <span className="text-sm text-muted-foreground">{duration} minutes</span>
              </div>
              <Slider
                value={[duration]}
                onValueChange={(val) => setDuration(val[0])}
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 min</span>
                <span>30 min</span>
              </div>
            </div>
            
            <Button onClick={handleStart} className="w-full gap-2">
              <Play className="w-4 h-4" />
              Begin Meditation
            </Button>
          </div>
        ) : (
          <>
            {/* Timer Display */}
            <div className="text-center">
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - progress / 100)}
                    className="text-primary transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-mono font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {isRunning ? "Breathe..." : "Paused"}
                  </span>
                </div>
              </div>
              
              {/* Breathing guide animation */}
              {isRunning && (
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary/40 animate-ping" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  onClick={isRunning ? handlePause : handleStart}
                  className="px-8"
                >
                  {isRunning ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={playBell}>
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {timeRemaining === 0 && (
              <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  🔔 Session Complete
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Well done! Take a moment to return gently.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
