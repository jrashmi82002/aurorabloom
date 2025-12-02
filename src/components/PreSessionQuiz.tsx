import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

interface PreSessionQuizProps {
  sessionId: string;
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
}

const ageGroups = [
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

const therapyGoalsOptions = [
  "Reduce stress and anxiety",
  "Improve sleep quality",
  "Process emotions",
  "Build confidence",
  "Manage relationships",
  "Physical wellness",
  "Spiritual growth",
  "Just need someone to talk to",
];

const experienceOptions = [
  { value: "first-time", label: "First time in therapy" },
  { value: "some", label: "Some previous experience" },
  { value: "regular", label: "Regular therapy user" },
];

export const PreSessionQuiz = ({ sessionId, userId, therapyType, onComplete }: PreSessionQuizProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [quizData, setQuizData] = useState<QuizData>({
    ageGroup: "",
    genderIdentity: "",
    currentMood: 5,
    stressLevel: 5,
    therapyGoals: [],
    previousExperience: "",
    customNotes: "",
  });

  const handleGoalToggle = (goal: string) => {
    setQuizData((prev) => ({
      ...prev,
      therapyGoals: prev.therapyGoals.includes(goal)
        ? prev.therapyGoals.filter((g) => g !== goal)
        : [...prev.therapyGoals, goal],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Save quiz responses
      const { error } = await supabase.from("quiz_responses").insert({
        session_id: sessionId,
        user_id: userId,
        age_group: quizData.ageGroup,
        gender_identity: quizData.genderIdentity,
        current_mood_scales: { mood: quizData.currentMood, stress: quizData.stressLevel },
        therapy_goals: quizData.therapyGoals,
        previous_experience: quizData.previousExperience,
        custom_notes: quizData.customNotes,
      });

      if (error) throw error;

      // Update profile with demographic info
      await supabase.from("profiles").update({
        age_group: quizData.ageGroup,
        gender_identity: quizData.genderIdentity,
      }).eq("id", userId);

      // Mark session as quiz completed
      await supabase.from("therapy_sessions").update({
        has_quiz_completed: true,
      }).eq("id", sessionId);

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
        return quizData.previousExperience;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">Before We Begin</CardTitle>
          <CardDescription>
            Help me understand you better so I can personalize our session
          </CardDescription>
          <div className="flex gap-1 justify-center mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
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
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">
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
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">
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
                <Label>How are you feeling right now? (1 = Low, 10 = Great)</Label>
                <div className="px-2">
                  <Slider
                    value={[quizData.currentMood]}
                    onValueChange={([v]) => setQuizData({ ...quizData, currentMood: v })}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>😔 Not great</span>
                    <span className="font-medium text-foreground">{quizData.currentMood}</span>
                    <span>Great 😊</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>How stressed do you feel? (1 = Calm, 10 = Very stressed)</Label>
                <div className="px-2">
                  <Slider
                    value={[quizData.stressLevel]}
                    onValueChange={([v]) => setQuizData({ ...quizData, stressLevel: v })}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>🧘 Calm</span>
                    <span className="font-medium text-foreground">{quizData.stressLevel}</span>
                    <span>Stressed 😰</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>What would you like to work on? (Select all that apply)</Label>
              <div className="grid grid-cols-1 gap-2">
                {therapyGoalsOptions.map((goal) => (
                  <Button
                    key={goal}
                    type="button"
                    variant={quizData.therapyGoals.includes(goal) ? "default" : "outline"}
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => handleGoalToggle(goal)}
                  >
                    {goal}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Have you tried therapy before?</Label>
                <RadioGroup
                  value={quizData.previousExperience}
                  onValueChange={(v) => setQuizData({ ...quizData, previousExperience: v })}
                >
                  {experienceOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">
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
            {step < 4 ? (
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
                className="flex-1"
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
