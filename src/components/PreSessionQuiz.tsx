import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

interface PreSessionQuizProps {
  userId: string;
  therapyType: string;
  onComplete: (quizData: QuizData) => void;
}

export interface QuizData {
  ageGroup: string;
  genderIdentity: string;
  currentMood: number;
  stressLevel: number;
  therapyGoals: string[];
  previousExperience: string;
  customNotes: string;
  specificConcerns: string[];
}

const ageGroups = [
  { value: "under-18", label: "Under 18" },
  { value: "18-24", label: "18-24 years" },
  { value: "25-34", label: "25-34 years" },
  { value: "35-44", label: "35-44 years" },
  { value: "45-54", label: "45-54 years" },
  { value: "55+", label: "55+ years" },
];

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const experienceOptions = [
  { value: "first-time", label: "First time trying therapy" },
  { value: "some", label: "Tried it a few times before" },
  { value: "regular", label: "I do this regularly" },
];

// Therapy-specific goals and concerns
const getTherapySpecificContent = (therapyType: string) => {
  const content: Record<string, { goals: string[]; concerns: string[]; moodLabel: string; stressLabel: string }> = {
    yogic: {
      goals: [
        "Find inner peace and calm",
        "Improve meditation practice",
        "Connect mind and body",
        "Reduce anxiety through breathwork",
        "Develop spiritual awareness",
        "Balance my chakras/energy",
      ],
      concerns: [
        "Trouble focusing during meditation",
        "Physical tension affecting practice",
        "Feeling disconnected from my body",
        "Seeking deeper spiritual meaning",
        "Want to develop a daily practice",
      ],
      moodLabel: "How connected do you feel to your inner self?",
      stressLabel: "How much mental chatter do you have right now?",
    },
    psychological: {
      goals: [
        "Understand my thought patterns",
        "Process difficult emotions",
        "Work through past trauma",
        "Develop coping strategies",
        "Improve self-esteem",
        "Manage depression or anxiety",
      ],
      concerns: [
        "Racing or intrusive thoughts",
        "Difficulty expressing emotions",
        "Relationship challenges",
        "Work or career stress",
        "Grief or loss",
        "Identity questions",
      ],
      moodLabel: "How would you rate your emotional state?",
      stressLabel: "How overwhelmed do you feel?",
    },
    physiotherapy: {
      goals: [
        "Reduce physical pain",
        "Improve mobility and flexibility",
        "Recover from injury",
        "Better posture and alignment",
        "Increase strength and stability",
        "Prevent future injuries",
      ],
      concerns: [
        "Chronic back or neck pain",
        "Joint stiffness or discomfort",
        "Post-surgery recovery",
        "Sports-related injury",
        "Desk job related issues",
        "General body tension",
      ],
      moodLabel: "How is your body feeling today?",
      stressLabel: "Rate your current pain level",
    },
    ayurveda: {
      goals: [
        "Balance my doshas",
        "Improve digestion and gut health",
        "Better sleep quality",
        "Natural remedies for ailments",
        "Seasonal health adjustments",
        "Overall wellness optimization",
      ],
      concerns: [
        "Digestive issues",
        "Skin problems",
        "Low energy or fatigue",
        "Irregular sleep patterns",
        "Seasonal allergies",
        "Weight management",
      ],
      moodLabel: "How balanced do you feel today?",
      stressLabel: "How is your energy level?",
    },
    talk_therapy: {
      goals: [
        "Just need someone to listen",
        "Process recent events",
        "Work through feelings",
        "Get a different perspective",
        "Feel less alone",
        "Sort out my thoughts",
      ],
      concerns: [
        "Feeling overwhelmed lately",
        "Going through a life change",
        "Relationship difficulties",
        "Work or school pressure",
        "Family issues",
        "General life stress",
      ],
      moodLabel: "How are you feeling right now?",
      stressLabel: "How stressed have you been?",
    },
    genz_therapy: {
      goals: [
        "Deal with social media anxiety",
        "Figure out my identity",
        "Handle academic pressure",
        "Navigate relationships",
        "Manage FOMO and comparison",
        "Build confidence",
      ],
      concerns: [
        "Social media affecting my mood",
        "Feeling burnt out",
        "Pressure to have it all figured out",
        "Loneliness despite being connected",
        "Climate/world anxiety",
        "Career uncertainty",
      ],
      moodLabel: "What's your vibe rn?",
      stressLabel: "How stressed are you on a scale?",
    },
    female_therapy: {
      goals: [
        "Navigate hormonal changes",
        "Work-life balance",
        "Self-care and boundaries",
        "Body image and self-acceptance",
        "Relationship dynamics",
        "Career and personal growth",
      ],
      concerns: [
        "Feeling overwhelmed by responsibilities",
        "Hormonal mood changes",
        "Imposter syndrome",
        "Setting healthy boundaries",
        "Self-worth and confidence",
        "Life transitions",
      ],
      moodLabel: "How are you feeling emotionally?",
      stressLabel: "How much are you carrying right now?",
    },
    male_therapy: {
      goals: [
        "Express emotions more freely",
        "Manage anger or frustration",
        "Build meaningful connections",
        "Handle pressure and expectations",
        "Work-life balance",
        "Personal growth and purpose",
      ],
      concerns: [
        "Difficulty opening up",
        "Work or career pressure",
        "Relationship communication",
        "Feeling isolated",
        "Managing stress",
        "Finding purpose",
      ],
      moodLabel: "How are you doing today?",
      stressLabel: "How much pressure are you under?",
    },
    older_therapy: {
      goals: [
        "Navigate life transitions",
        "Process loss and grief",
        "Find meaning and purpose",
        "Stay mentally sharp",
        "Improve relationships",
        "Embrace this life stage",
      ],
      concerns: [
        "Adjusting to retirement",
        "Health-related worries",
        "Feeling isolated or lonely",
        "Loss of loved ones",
        "Finding new purpose",
        "Family dynamics",
      ],
      moodLabel: "How are you feeling today?",
      stressLabel: "How much is weighing on your mind?",
    },
    children_therapy: {
      goals: [
        "Feel happier and calmer",
        "Make friends more easily",
        "Do better at school",
        "Handle big feelings",
        "Feel less worried",
        "Be more confident",
      ],
      concerns: [
        "Feeling sad or worried a lot",
        "Trouble at school",
        "Making or keeping friends",
        "Family changes",
        "Feeling different from others",
        "Big emotions that are hard to handle",
      ],
      moodLabel: "How happy are you feeling?",
      stressLabel: "How worried or scared do you feel?",
    },
    millennial_therapy: {
      goals: [
        "Navigate adulting challenges",
        "Career fulfillment",
        "Relationship and family planning",
        "Financial stress management",
        "Work-life integration",
        "Find authentic happiness",
      ],
      concerns: [
        "Burnout from hustle culture",
        "Quarter/mid-life crisis feelings",
        "Comparing to peers",
        "Relationship milestones pressure",
        "Career pivot thoughts",
        "Balancing expectations",
      ],
      moodLabel: "How are you really doing?",
      stressLabel: "How burnt out are you feeling?",
    },
    advanced_therapy: {
      goals: [
        "Deep psychological work",
        "Trauma processing",
        "Complex relationship patterns",
        "Existential exploration",
        "Integration of past therapy work",
        "Advanced personal growth",
      ],
      concerns: [
        "Complex or recurring issues",
        "Patterns that keep repeating",
        "Deep-seated beliefs to examine",
        "Integration of insights",
        "Relationship with self",
        "Finding deeper meaning",
      ],
      moodLabel: "How present do you feel?",
      stressLabel: "How activated is your system?",
    },
  };

  return content[therapyType] || content.talk_therapy;
};

export const PreSessionQuiz = ({ userId, therapyType, onComplete }: PreSessionQuizProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const therapyContent = getTherapySpecificContent(therapyType);

  const [quizData, setQuizData] = useState<QuizData>({
    ageGroup: "",
    genderIdentity: "",
    currentMood: 5,
    stressLevel: 5,
    therapyGoals: [],
    previousExperience: "",
    customNotes: "",
    specificConcerns: [],
  });

  const handleGoalToggle = (goal: string) => {
    setQuizData((prev) => ({
      ...prev,
      therapyGoals: prev.therapyGoals.includes(goal)
        ? prev.therapyGoals.filter((g) => g !== goal)
        : [...prev.therapyGoals, goal],
    }));
  };

  const handleConcernToggle = (concern: string) => {
    setQuizData((prev) => ({
      ...prev,
      specificConcerns: prev.specificConcerns.includes(concern)
        ? prev.specificConcerns.filter((c) => c !== concern)
        : [...prev.specificConcerns, concern],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      onComplete(quizData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return quizData.ageGroup && quizData.genderIdentity;
      case 2:
        return true;
      case 3:
        return quizData.therapyGoals.length > 0;
      case 4:
        return quizData.specificConcerns.length > 0;
      case 5:
        return quizData.previousExperience;
      default:
        return true;
    }
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="md" showText={false} />
          </div>
          <CardTitle className="text-2xl font-serif">Before We Begin</CardTitle>
          <CardDescription>
            Help me understand you better so I can personalize our session
          </CardDescription>
          <div className="flex gap-1 justify-center mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-10 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>What's your age group?</Label>
                <RadioGroup
                  value={quizData.ageGroup}
                  onValueChange={(v) => setQuizData({ ...quizData, ageGroup: v })}
                >
                  {ageGroups.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`age-${option.value}`} />
                      <Label htmlFor={`age-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>How do you identify?</Label>
                <RadioGroup
                  value={quizData.genderIdentity}
                  onValueChange={(v) => setQuizData({ ...quizData, genderIdentity: v })}
                >
                  {genderOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                      <Label htmlFor={`gender-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label>{therapyContent.moodLabel} (1-10)</Label>
                <div className="px-2">
                  <Slider
                    value={[quizData.currentMood]}
                    onValueChange={([v]) => setQuizData({ ...quizData, currentMood: v })}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>😔 Low</span>
                    <span className="font-medium text-foreground">{quizData.currentMood}</span>
                    <span>Great 😊</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>{therapyContent.stressLabel} (1-10)</Label>
                <div className="px-2">
                  <Slider
                    value={[quizData.stressLevel]}
                    onValueChange={([v]) => setQuizData({ ...quizData, stressLevel: v })}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>🧘 Low</span>
                    <span className="font-medium text-foreground">{quizData.stressLevel}</span>
                    <span>High 😰</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>What would you like to work on today?</Label>
              <div className="grid grid-cols-1 gap-2">
                {therapyContent.goals.map((goal) => (
                  <Button
                    key={goal}
                    type="button"
                    variant={quizData.therapyGoals.includes(goal) ? "default" : "outline"}
                    className="justify-start h-auto py-3 px-4 text-left"
                    onClick={() => handleGoalToggle(goal)}
                  >
                    {goal}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Label>What's been on your mind? (Select any that apply)</Label>
              <div className="grid grid-cols-1 gap-2">
                {therapyContent.concerns.map((concern) => (
                  <Button
                    key={concern}
                    type="button"
                    variant={quizData.specificConcerns.includes(concern) ? "default" : "outline"}
                    className="justify-start h-auto py-3 px-4 text-left"
                    onClick={() => handleConcernToggle(concern)}
                  >
                    {concern}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Have you tried therapy before?</Label>
                <RadioGroup
                  value={quizData.previousExperience}
                  onValueChange={(v) => setQuizData({ ...quizData, previousExperience: v })}
                >
                  {experienceOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`exp-${option.value}`} />
                      <Label htmlFor={`exp-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Anything else you'd like me to know? (Optional)</Label>
                <Textarea
                  placeholder="Feel free to share anything that might help me support you better..."
                  value={quizData.customNotes}
                  onChange={(e) => setQuizData({ ...quizData, customNotes: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex-1 bg-gradient-calm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Session"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
