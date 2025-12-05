import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/Logo";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      } else {
        // Validate signup step 1 before proceeding
        if (signupStep === 1) {
          if (!email || !password || !fullName) {
            toast({
              title: "Missing Information",
              description: "Please fill in all fields",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          setSignupStep(2);
          setLoading(false);
          return;
        }

        // Signup with email verification
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              age_group: ageGroup,
              gender_identity: genderIdentity,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        // Create profile with demographics
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName,
            age_group: ageGroup,
            gender_identity: genderIdentity,
          });
        }

        toast({
          title: "Check your email!",
          description: "We've sent you a verification link. Please check your inbox to confirm your account.",
        });
      }
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

  const resetSignup = () => {
    setIsLogin(true);
    setSignupStep(1);
    setEmail("");
    setPassword("");
    setFullName("");
    setAgeGroup("");
    setGenderIdentity("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <Card className="w-full max-w-md shadow-calm border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-3xl font-serif">
            {isLogin ? "Welcome Back" : signupStep === 1 ? "Begin Your Journey" : "Tell Us About You"}
          </CardTitle>
          <CardDescription className="text-base">
            {isLogin
              ? "Continue your path to wellness"
              : signupStep === 1
              ? "Start your healing journey with us"
              : "This helps us personalize your experience"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isLogin ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-gentle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-gentle"
                  />
                </div>
              </>
            ) : signupStep === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-gentle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-gentle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-gentle"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Label>What's your age group?</Label>
                  <RadioGroup value={ageGroup} onValueChange={setAgeGroup}>
                    {ageGroups.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`age-${option.value}`} />
                        <Label htmlFor={`age-${option.value}`} className="cursor-pointer text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>How do you identify?</Label>
                  <RadioGroup value={genderIdentity} onValueChange={setGenderIdentity}>
                    {genderOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                        <Label htmlFor={`gender-${option.value}`} className="cursor-pointer text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}
            
            <div className="flex gap-2">
              {!isLogin && signupStep === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSignupStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 bg-gradient-calm hover:opacity-90 transition-opacity"
                disabled={loading || (!isLogin && signupStep === 2 && (!ageGroup || !genderIdentity))}
              >
                {loading 
                  ? "Please wait..." 
                  : isLogin 
                  ? "Sign In" 
                  : signupStep === 1 
                  ? "Continue" 
                  : "Create Account"}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                if (isLogin) {
                  setIsLogin(false);
                  setSignupStep(1);
                } else {
                  resetSignup();
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
