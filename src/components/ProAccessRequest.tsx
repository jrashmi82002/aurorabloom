import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Crown, Bell } from "lucide-react";

export const ProAccessRequest = () => {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProGrantedNotification, setShowProGrantedNotification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkProStatus();
    
    // Subscribe to profile changes to detect pro access changes
    const channel = supabase
      .channel('pro-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && payload.new && (payload.new as any).id === user.id) {
            const newStatus = (payload.new as any).pro_subscription_status;
            const oldStatus = (payload.old as any)?.pro_subscription_status;
            
            // Pro granted: yearly or monthly status
            if ((newStatus === 'yearly' || newStatus === 'monthly') && 
                oldStatus !== 'yearly' && oldStatus !== 'monthly') {
              setIsPro(true);
              setHasRequested(false);
              setShowProGrantedNotification(true);
              toast({
                title: "🎉 Pro Access Granted!",
                description: "You now have access to all premium features.",
              });
            } 
            // Pro revoked: back to free
            else if (newStatus === 'free' && (oldStatus === 'yearly' || oldStatus === 'monthly')) {
              setIsPro(false);
              setHasRequested(false);
              toast({
                title: "Pro Access Revoked",
                description: "Your pro access has been discontinued. You can request again.",
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const checkProStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Set the email from the logged-in user
      setEmail(user.email || "");

      // Check if user is already pro
      const { data: profile } = await supabase
        .from("profiles")
        .select("pro_subscription_status")
        .eq("id", user.id)
        .single();

      if (profile?.pro_subscription_status === "yearly" || profile?.pro_subscription_status === "monthly") {
        setIsPro(true);
      }

      // Check if user has a pending request
      const { data: existingRequest } = await supabase
        .from("pro_access_requests")
        .select("status")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false })
        .limit(1)
        .single();

      if (existingRequest?.status === "pending") {
        setHasRequested(true);
      }
    } catch (error) {
      // No existing request, that's fine
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to request pro access.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("pro_access_requests")
        .insert({
          user_id: user.id,
          email: user.email || email,
          reason: reason,
        });

      if (error) throw error;

      setHasRequested(true);
      toast({
        title: "Request Submitted",
        description: "We'll review your request and get back to you soon via email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // User is already Pro - show celebration
  if (isPro) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {showProGrantedNotification && (
              <div className="absolute top-2 right-2 animate-bounce">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
            )}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">You're a Pro Member! 🎉</h3>
              <p className="text-muted-foreground">
                Enjoy unlimited messages, enhanced diary features, 4 extra therapy activities, and all premium features.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="px-2 py-1 bg-amber-500/20 rounded-full">Unlimited Sessions</span>
              <span className="px-2 py-1 bg-amber-500/20 rounded-full">Extra Activities</span>
              <span className="px-2 py-1 bg-amber-500/20 rounded-full">Diary Images</span>
              <span className="px-2 py-1 bg-amber-500/20 rounded-full">8 AI Voices</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasRequested) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
              <p className="text-muted-foreground">
                We've received your pro access request. You'll receive a notification here and via email when approved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Pro Access</CardTitle>
        <CardDescription>
          Get unlimited messages and premium features. Fill out this form and we'll manually activate your pro access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">This is your registered email address</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Why do you need pro access?</Label>
            <Textarea
              id="reason"
              placeholder="Tell us about your use case or why you're interested in pro features..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};