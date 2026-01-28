import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/Logo";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Mail, RefreshCw } from "lucide-react";

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
  const [loginMethod, setLoginMethod] = useState<"username" | "email">("username");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [suggestedUsername, setSuggestedUsername] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Generate username suggestion when full name changes
  useEffect(() => {
    if (fullName && !username) {
      generateUsernameSuggestion(fullName);
    }
  }, [fullName]);

  const generateUsernameSuggestion = async (name: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_username_suggestion', {
        base_name: name
      });
      if (!error && data) {
        setSuggestedUsername(data);
      }
    } catch (error) {
      console.error("Error generating username:", error);
    }
  };

  const useSuggestedUsername = () => {
    setUsername(suggestedUsername);
    // Generate a new suggestion
    if (fullName) {
      generateUsernameSuggestion(fullName);
    }
  };

  const validateUsername = (value: string) => {
    // Username must be alphanumeric, 3-20 characters
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(value);
  };

  const checkUsernameAvailability = async (usernameToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', usernameToCheck.toLowerCase())
        .maybeSingle();
      
      return !data && !error;
    } catch {
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        let emailToUse = usernameOrEmail;
        
        // If using username login, look up the email
        if (loginMethod === "username") {
          const { data: userEmail, error } = await supabase.rpc('get_user_email_by_username', {
            username_param: usernameOrEmail
          });
          
          if (error || !userEmail) {
            toast({
              title: "User Not Found",
              description: "No account found with that username. Please check and try again.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          emailToUse = userEmail;
        }
        
        const { error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });
        
        if (error) throw error;
        
        navigate("/");
      } else {
        // Validate signup step 1 before proceeding
        if (signupStep === 1) {
          if (!email || !password || !fullName || !username) {
            toast({
              title: "Missing Information",
              description: "Please fill in all fields including username",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          // Validate username format
          if (!validateUsername(username)) {
            toast({
              title: "Invalid Username",
              description: "Username must be 3-20 characters, alphanumeric and underscores only",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          // Check username availability
          const isAvailable = await checkUsernameAvailability(username);
          if (!isAvailable) {
            toast({
              title: "Username Taken",
              description: "This username is already in use. Please choose another.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          // Validate password strength
          if (password.length < 6) {
            toast({
              title: "Weak Password",
              description: "Password must be at least 6 characters long",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          setSignupStep(2);
          setLoading(false);
          return;
        }

        // Signup with email verification required
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: username.toLowerCase(),
              age_group: ageGroup,
              gender_identity: genderIdentity,
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (error) throw error;

        // Create profile with username and demographics
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName,
            username: username.toLowerCase(),
            age_group: ageGroup,
            gender_identity: genderIdentity,
          });
        }

        toast({
          title: "Account Created",
          description: `Welcome! Your username is @${username.toLowerCase()}. You can now sign in.`,
        });
        
        // Switch to login view
        resetSignup();
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
    setUsernameOrEmail("");
    setEmail("");
    setPassword("");
    setFullName("");
    setUsername("");
    setSuggestedUsername("");
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
              ? "Sign in with your username or email"
              : signupStep === 1
              ? "Create your unique username to get started"
              : "This helps us personalize your experience"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isLogin ? (
              <>
                {/* Login method toggle */}
                <div className="flex rounded-lg bg-muted p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("username")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      loginMethod === "username"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Username
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      loginMethod === "email"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="usernameOrEmail">
                    {loginMethod === "username" ? "Username" : "Email"}
                  </Label>
                  <Input
                    id="usernameOrEmail"
                    type={loginMethod === "email" ? "email" : "text"}
                    placeholder={loginMethod === "username" ? "your_username" : "you@example.com"}
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
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
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="choose_a_username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      required
                      className="transition-all duration-300 focus:shadow-gentle pr-10"
                    />
                    {suggestedUsername && !username && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={useSuggestedUsername}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                        title="Use suggested username"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Use
                      </Button>
                    )}
                  </div>
                  {suggestedUsername && !username && (
                    <p className="text-xs text-muted-foreground">
                      Suggestion: <span className="font-medium text-primary cursor-pointer hover:underline" onClick={useSuggestedUsername}>@{suggestedUsername}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, letters, numbers and underscores only
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    For account recovery and optional verification
                  </p>
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