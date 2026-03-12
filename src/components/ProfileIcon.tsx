import { useState, useEffect } from "react";
import { Crown, MessageCircle, Infinity, Settings, LogOut, Sparkles, BookHeart, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccountSettings } from "@/components/AccountSettings";
import { MyPersona } from "@/components/MyPersona";

interface ProfileIconProps {
  className?: string;
}

export const ProfileIcon = ({ className }: ProfileIconProps) => {
  const [initial, setInitial] = useState("U");
  const [username, setUsername] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        fetchUserProfile();
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsLoggedIn(true);
      fetchUserProfile();
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    
    const channel = supabase
      .channel("profile-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && (payload.new as any).id === user.id) {
            const status = (payload.new as any).pro_subscription_status;
            setIsPro(status === "yearly" || status === "monthly");
            setDailyMessageCount((payload.new as any).daily_message_count || 0);
            setDailySessionCount((payload.new as any).daily_session_count || 0);
            if ((payload.new as any).username) {
              setUsername((payload.new as any).username);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLoggedIn]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("pro_subscription_status, daily_message_count, daily_session_count, last_message_date, username, full_name")
        .eq("id", user.id)
        .single();

      const name = profile?.full_name || user.user_metadata?.full_name || "";
      const profileUsername = profile?.username || "";
      const email = user.email || "";
      
      if (name) setInitial(name.charAt(0).toUpperCase());
      else if (profileUsername) setInitial(profileUsername.charAt(0).toUpperCase());
      else if (email) setInitial(email.charAt(0).toUpperCase());

      setUsername(profileUsername);
      const status = profile?.pro_subscription_status;
      setIsPro(status === "yearly" || status === "monthly");
      
      const today = new Date().toISOString().split('T')[0];
      const lastMessageDate = profile?.last_message_date;
      
      if (lastMessageDate !== today) {
        setDailyMessageCount(0);
        setDailySessionCount(0);
      } else {
        setDailyMessageCount(profile?.daily_message_count || 0);
        setDailySessionCount(profile?.daily_session_count || 0);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const messagesRemaining = Math.max(0, 200 - dailyMessageCount);
  const sessionsRemaining = Math.max(0, 3 - dailySessionCount);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Not logged in - show login button
  if (!isLoggedIn) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-2">
        <LogIn className="w-4 h-4" />
        Sign In
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("relative focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full", className)}>
          {isPro && (
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse opacity-75 blur-sm" />
          )}
          <div
            className={cn(
              "relative w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-transform hover:scale-105",
              isPro
                ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white ring-2 ring-emerald-400"
                : "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
            )}
          >
            {initial}
          </div>
          {isPro && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm",
                isPro
                  ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white"
                  : "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
              )}
            >
              {initial}
            </div>
            <div>
              {username && <p className="text-xs text-muted-foreground">@{username}</p>}
              <p className="font-semibold text-xs">
                {isPro ? "Pro Member ✨" : "Free Member"}
              </p>
            </div>
          </div>
          
          <div className="border-t pt-2 space-y-1.5">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Credits</h4>
            {isPro ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between p-1.5 rounded bg-emerald-500/10 text-xs">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    <span>Messages</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                    <Infinity className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-emerald-500/10 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-emerald-600" />
                    <span>Sessions</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                    <Infinity className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-xs">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3 h-3 text-muted-foreground" />
                    <span>Messages</span>
                  </div>
                  <span className={cn("font-semibold", messagesRemaining < 50 ? "text-orange-500" : "")}>
                    {messagesRemaining}/200
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-muted-foreground" />
                    <span>Sessions</span>
                  </div>
                  <span className={cn("font-semibold", sessionsRemaining === 0 ? "text-red-500" : "")}>
                    {sessionsRemaining}/3
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t pt-2 space-y-0.5">
            {!isPro && (
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                onClick={() => navigate("/pro-access")}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Get Pro Access
              </Button>
            )}

            <Dialog open={personaOpen} onOpenChange={setPersonaOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-xs">
                  <BookHeart className="w-3.5 h-3.5" />
                  My Persona
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif">My Persona</DialogTitle>
                  <DialogDescription>Your personalized reflection based on your journey</DialogDescription>
                </DialogHeader>
                <MyPersona />
              </DialogContent>
            </Dialog>
            
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-xs">
                  <Settings className="w-3.5 h-3.5" />
                  Account Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">Account Settings</DialogTitle>
                  <DialogDescription>Manage your account preferences</DialogDescription>
                </DialogHeader>
                <AccountSettings />
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
