import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/Logo";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RefreshCw, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
    if (fullName) {
      generateUsernameSuggestion(fullName);
    }
  };

  const validateUsername = (value: string) => {
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      
      if (error) {
        toast({
          title: "Google Sign-In Failed",
          description: error.message || "Failed to sign in with Google",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Determine if identifier is email or username
        const isEmail = identifier.includes("@");
        let emailToUse = identifier;
        
        if (!isEmail) {
          // It's a username, look up the email
          const { data: userEmail, error } = await supabase.rpc('get_user_email_by_username', {
            username_param: identifier.toLowerCase()
          });
          
          if (error || !userEmail) {
            toast({
              title: "User Not Found",
              description: "No account found with that username or email. Please check and try again.",
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
          if (!email || !password || !confirmPassword || !fullName || !username) {
            toast({
              title: "Missing Information",
              description: "Please fill in all fields",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          // Check confirm password
          if (password !== confirmPassword) {
            toast({
              title: "Passwords Don't Match",
              description: "Please make sure your passwords match",
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

        // Signup with email
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
    setIdentifier("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
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
              ? "Create your account to get started"
              : "This helps us personalize your experience"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 gap-2"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isLogin ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Username or Email</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="your_username or you@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
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
                    For account recovery and verification
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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