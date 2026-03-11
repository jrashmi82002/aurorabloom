import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Timer } from "lucide-react";

interface YogaPose {
  name: string;
  sanskrit: string;
  duration: number;
  description: string;
  benefits: string[];
  steps: string[];
  image: string; // emoji representation
  finalPoseImage: string; // ASCII art or description of final pose
}

const yogaPoses: YogaPose[] = [
  {
    name: "Mountain Pose",
    sanskrit: "Tadasana",
    duration: 30,
    description: "The foundation of all standing poses, teaching proper alignment and grounding.",
    benefits: ["Improves posture", "Strengthens thighs and ankles", "Calms the mind", "Creates body awareness"],
    steps: ["Stand with feet together", "Distribute weight evenly", "Engage thigh muscles", "Roll shoulders back", "Reach crown of head up", "Breathe deeply"],
    image: "🧍",
    finalPoseImage: "Stand tall like a mountain with arms at sides, weight balanced, crown reaching skyward"
  },
  {
    name: "Tree Pose",
    sanskrit: "Vrikshasana",
    duration: 45,
    description: "A balancing pose that builds focus, concentration and stability.",
    benefits: ["Improves balance", "Strengthens legs", "Opens hips", "Builds focus", "Reduces stress"],
    steps: ["Start in Mountain Pose", "Shift weight to left foot", "Place right foot on inner thigh", "Press foot and thigh together", "Bring hands to heart", "Hold and breathe", "Switch sides"],
    image: "🌳",
    finalPoseImage: "Balance on one leg, other foot pressed against inner thigh, hands in prayer position at heart"
  },
  {
    name: "Warrior I",
    sanskrit: "Virabhadrasana I",
    duration: 45,
    description: "A powerful standing pose that builds strength and confidence.",
    benefits: ["Strengthens legs", "Opens chest and shoulders", "Builds stamina", "Improves focus"],
    steps: ["Step right foot forward", "Bend right knee 90 degrees", "Back foot at 45 degrees", "Square hips forward", "Raise arms overhead", "Gaze up", "Hold and breathe"],
    image: "⚔️",
    finalPoseImage: "Front knee bent at 90°, back leg straight, arms reaching powerfully overhead, gaze upward"
  },
  {
    name: "Child's Pose",
    sanskrit: "Balasana",
    duration: 60,
    description: "A restful pose that gently stretches the back and calms the nervous system.",
    benefits: ["Relieves back tension", "Calms anxiety", "Stretches hips", "Promotes relaxation"],
    steps: ["Kneel on the floor", "Touch big toes together", "Sit on heels", "Fold forward", "Extend arms forward or alongside body", "Rest forehead on mat", "Breathe deeply"],
    image: "🧘",
    finalPoseImage: "Kneeling with forehead on floor, arms extended forward, hips resting on heels, completely relaxed"
  },
  {
    name: "Cat-Cow Stretch",
    sanskrit: "Marjaryasana-Bitilasana",
    duration: 45,
    description: "A flowing movement that warms up the spine and releases tension.",
    benefits: ["Improves spine flexibility", "Massages organs", "Relieves stress", "Coordinates breath with movement"],
    steps: ["Start on hands and knees", "Inhale, arch back, look up (Cow)", "Exhale, round spine, tuck chin (Cat)", "Flow between poses", "Match movement to breath", "Continue for duration"],
    image: "🐱🐄",
    finalPoseImage: "Flow between arched spine (Cow) and rounded spine (Cat) on hands and knees, syncing with breath"
  },
  {
    name: "Corpse Pose",
    sanskrit: "Savasana",
    duration: 120,
    description: "The ultimate relaxation pose that integrates the benefits of your practice.",
    benefits: ["Deep relaxation", "Reduces blood pressure", "Calms the mind", "Integrates practice benefits"],
    steps: ["Lie flat on your back", "Let feet fall open", "Arms relaxed at sides", "Close your eyes", "Relax every muscle", "Focus on breath", "Let go completely"],
    image: "😌",
    finalPoseImage: "Lying flat on back, arms and legs slightly apart, palms facing up, complete stillness and surrender"
  },
  {
    name: "Downward Dog",
    sanskrit: "Adho Mukha Svanasana",
    duration: 45,
    description: "An energizing pose that stretches the entire body.",
    benefits: ["Stretches hamstrings", "Strengthens arms", "Calms the brain", "Energizes body"],
    steps: ["Start on hands and knees", "Tuck toes, lift hips up", "Straighten legs", "Press hands firmly", "Relax head between arms", "Pedal feet gently"],
    image: "🐕",
    finalPoseImage: "Inverted V-shape: hips high, arms and legs straight, heels reaching toward floor, head relaxed"
  },
  {
    name: "Seated Meditation",
    sanskrit: "Sukhasana",
    duration: 120,
    description: "A comfortable seated position for meditation and pranayama.",
    benefits: ["Calms the mind", "Improves posture", "Opens hips", "Promotes inner peace"],
    steps: ["Sit cross-legged", "Spine tall and straight", "Hands on knees", "Close eyes", "Focus on breath", "Let thoughts pass", "Rest in stillness"],
    image: "🪷",
    finalPoseImage: "Cross-legged seated, spine tall, hands resting on knees in mudra, eyes closed, serene expression"
  },
];

export const YogaPoses = () => {
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(yogaPoses[0].duration);
  const [completedPoses, setCompletedPoses] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPose = yogaPoses[currentPoseIndex];
  const progress = ((currentPose.duration - timeRemaining) / currentPose.duration) * 100;

  useEffect(() => {
    setTimeRemaining(currentPose.duration);
  }, [currentPoseIndex]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Pose complete
            if (!completedPoses.includes(currentPoseIndex)) {
              setCompletedPoses((prev) => [...prev, currentPoseIndex]);
            }
            setIsRunning(false);
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
  }, [isRunning, currentPoseIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(currentPose.duration);
  };

  const goNext = () => {
    setIsRunning(false);
    setCurrentPoseIndex((prev) => (prev + 1) % yogaPoses.length);
  };

  const goPrev = () => {
    setIsRunning(false);
    setCurrentPoseIndex((prev) => (prev - 1 + yogaPoses.length) % yogaPoses.length);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{currentPose.image}</span>
            {currentPose.name}
          </CardTitle>
          <span className="text-sm text-muted-foreground italic">
            {currentPose.sanskrit}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Pose {currentPoseIndex + 1} of {yogaPoses.length} • {completedPoses.length} completed
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - progress / 100)}
                className="text-primary transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-mono font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={resetTimer}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button size="lg" onClick={toggleTimer} className="px-8">
              {isRunning ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-center text-muted-foreground">
          {currentPose.description}
        </p>

        {/* Steps */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">How to do it:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            {currentPose.steps.map((step, i) => (
              <li key={i} className="text-muted-foreground">{step}</li>
            ))}
          </ol>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap gap-2">
          {currentPose.benefits.map((benefit, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400"
            >
              ✓ {benefit}
            </span>
          ))}
        </div>

        {/* Final Pose Image/Description - Pro Feature */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <span>🎯</span> Final Pose Visualization
          </h4>
          <p className="text-sm text-muted-foreground italic">
            {currentPose.finalPoseImage}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" size="sm" onClick={goPrev}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex gap-1">
            {yogaPoses.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsRunning(false);
                  setCurrentPoseIndex(i);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentPoseIndex
                    ? "bg-primary"
                    : completedPoses.includes(i)
                    ? "bg-green-500"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={goNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
