import { useState, useEffect } from "react";
import { Crown, MessageCircle, Infinity, Settings, LogOut, Sparkles } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccountSettings } from "@/components/AccountSettings";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel("profile-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check pro status and usage
      const { data: profile } = await supabase
        .from("profiles")
        .select("pro_subscription_status, daily_message_count, daily_session_count, last_message_date, username, full_name")
        .eq("id", user.id)
        .single();

      // Get initial from profile name, username, or email
      const name = profile?.full_name || user.user_metadata?.full_name || "";
      const profileUsername = profile?.username || "";
      const email = user.email || "";
      
      if (name) {
        setInitial(name.charAt(0).toUpperCase());
      } else if (profileUsername) {
        setInitial(profileUsername.charAt(0).toUpperCase());
      } else if (email) {
        setInitial(email.charAt(0).toUpperCase());
      }

      setUsername(profileUsername);

      const status = profile?.pro_subscription_status;
      setIsPro(status === "yearly" || status === "monthly");
      
      // Reset counts if new day
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("relative focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full", className)}>
          {/* Pro halo effect */}
          {isPro && (
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse opacity-75 blur-sm" />
          )}
          
          {/* Profile circle */}
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
          
          {/* Crown for pro users */}
          {isPro && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                isPro
                  ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white"
                  : "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
              )}
            >
              {initial}
            </div>
            <div>
              {username && (
                <p className="text-xs text-muted-foreground">@{username}</p>
              )}
              <p className="font-semibold text-sm">
                {isPro ? "Pro Member ✨" : "Free Member"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPro ? "Unlimited access" : "Limited credits"}
              </p>
            </div>
          </div>
          
          <div className="border-t pt-3 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Daily Credits
            </h4>
            
            {isPro ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Messages</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Infinity className="w-4 h-4" />
                    <span className="text-sm">Unlimited</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Sessions</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Infinity className="w-4 h-4" />
                    <span className="text-sm">Unlimited</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Messages</span>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    messagesRemaining < 50 ? "text-orange-500" : "text-foreground"
                  )}>
                    {messagesRemaining}/200
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Sessions</span>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    sessionsRemaining === 0 ? "text-red-500" : "text-foreground"
                  )}>
                    {sessionsRemaining}/3
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Upgrade to Pro for unlimited access
                </p>
              </div>
            )}
          </div>
          
          <div className="border-t pt-3 space-y-2">
            {!isPro && (
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-9 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                onClick={() => navigate("/pro-access")}
              >
                <Sparkles className="w-4 h-4" />
                Get Pro Access
              </Button>
            )}
            
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                  <Settings className="w-4 h-4" />
                  Account Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Account Settings</DialogTitle>
                </DialogHeader>
                <AccountSettings />
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-9 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
