import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Crown, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";
import { proAccessService } from "@/services/pro-access.service";

export const ProAccessRequest = () => {
  const { user } = useAuth();
  const { isPro, refresh: refreshProfile } = useProStatus();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProGrantedNotification, setShowProGrantedNotification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    proAccessService
      .myRequest(user.id)
      .then((r) => {
        if (active && r?.status === "pending") setHasRequested(true);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    const unsub = proAccessService.subscribeToProfile(user.id, (newRow, oldRow) => {
      const newStatus = newRow?.pro_subscription_status;
      const oldStatus = oldRow?.pro_subscription_status;
      if ((newStatus === "yearly" || newStatus === "monthly") && oldStatus !== newStatus) {
        setHasRequested(false);
        setShowProGrantedNotification(true);
        toast({ title: "🎉 Pro Access Granted!", description: "You now have access to all premium features." });
        refreshProfile();
      } else if (newStatus === "free" && (oldStatus === "yearly" || oldStatus === "monthly")) {
        setHasRequested(false);
        toast({
          title: "Pro Access Revoked",
          description: "Your pro access has been discontinued. You can request again.",
          variant: "destructive",
        });
        refreshProfile();
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [user, toast, refreshProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to request pro access.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await proAccessService.create(user.id, user.email ?? "", reason);
      setHasRequested(true);
      toast({ title: "Request Submitted", description: "We'll review your request and get back to you soon via email." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit request. Please try again.", variant: "destructive" });
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
                Enjoy unlimited chat credits, diary themes, image uploads, and PDF export.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="px-2 py-1 bg-amber-500/20 rounded-full">Unlimited Chat</span>
              <span className="px-2 py-1 bg-amber-500/20 rounded-full">Diary Themes</span>
              <span className="px-2 py-1 bg-amber-500/20 rounded-full">Diary Images</span>
              <span className="px-2 py-1 bg-amber-500/20 rounded-full">PDF Export</span>
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
            <Input id="email" type="email" value={user?.email ?? ""} disabled className="bg-muted" />
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
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
