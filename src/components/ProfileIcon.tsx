import { useState } from "react";
import { Crown, MessageCircle, Infinity, Settings, LogOut, Sparkles, BookHeart, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";
import { authService } from "@/services/auth.service";
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
  const { user, loading: authLoading } = useAuth();
  const { profile, isPro } = useProStatus();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const username = profile?.username ?? "";

  const initial = (() => {
    const name = profile?.full_name || (user?.user_metadata as any)?.full_name || "";
    const email = user?.email || "";
    if (name) return name.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "U";
  })();

  // Daily counts: reset display if last_message_date is not today.
  const today = new Date().toISOString().split("T")[0];
  const isToday = profile?.last_message_date === today;
  const dailyMessageCount = isToday ? profile?.daily_message_count ?? 0 : 0;
  const dailySessionCount = isToday ? profile?.daily_session_count ?? 0 : 0;

  const messagesRemaining = Math.max(0, 200 - dailyMessageCount);
  const sessionsRemaining = Math.max(0, 3 - dailySessionCount);

  const handleSignOut = async () => {
    await authService.signOut();
    navigate("/auth");
  };

  if (authLoading) return null;
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
