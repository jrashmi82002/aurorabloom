import { useState, useEffect } from "react";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProfileIconProps {
  className?: string;
}

export const ProfileIcon = ({ className }: ProfileIconProps) => {
  const [initial, setInitial] = useState("U");
  const [isPro, setIsPro] = useState(false);

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

      // Get initial from email or name
      const email = user.email || "";
      const name = user.user_metadata?.full_name || "";
      
      if (name) {
        setInitial(name.charAt(0).toUpperCase());
      } else if (email) {
        setInitial(email.charAt(0).toUpperCase());
      }

      // Check pro status
      const { data: profile } = await supabase
        .from("profiles")
        .select("pro_subscription_status")
        .eq("id", user.id)
        .single();

      const status = profile?.pro_subscription_status;
      setIsPro(status === "yearly" || status === "monthly");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Pro halo effect */}
      {isPro && (
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse opacity-75 blur-sm" />
      )}
      
      {/* Profile circle */}
      <div
        className={cn(
          "relative w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm",
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
    </div>
  );
};
