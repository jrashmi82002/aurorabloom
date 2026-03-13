import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileIcon } from "@/components/ProfileIcon";
import { NotificationBell } from "@/components/NotificationBell";
import { ProAccessRequest } from "@/components/ProAccessRequest";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProAccess = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo size="md" />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <ProfileIcon />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif font-semibold">Pro Membership</h1>
            <p className="text-muted-foreground">
              Unlock unlimited access to all premium features
            </p>
          </div>

          {/* Pro Benefits Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
            <h2 className="text-lg font-semibold mb-4">Pro Benefits Include:</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-500">✓</span>
                <span><strong>Unlimited Therapy Sessions</strong> - No daily limits on sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">✓</span>
                <span><strong>Unlimited Messages</strong> - Chat as much as you need</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">✓</span>
                <span><strong>Premium Voices</strong> - Multiple therapy voice options</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">✓</span>
                <span><strong>Enhanced Diary</strong> - Add images and mood stickers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">✓</span>
                <span><strong>Extra Activities</strong> - Gita Wisdom, Yoga Poses & more</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">✓</span>
                <span><strong>PDF Export</strong> - Download your diary entries</span>
              </li>
            </ul>
          </div>

          {/* Pro Access Request Form */}
          <ProAccessRequest />
        </div>
      </main>
    </div>
  );
};

export default ProAccess;