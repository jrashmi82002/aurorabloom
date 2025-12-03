import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BarChart3, Mail, Crown } from "lucide-react";
import { AdminProRequests } from "@/components/admin/AdminProRequests";
import { AdminUserAnalytics } from "@/components/admin/AdminUserAnalytics";
import { AdminSessionInsights } from "@/components/admin/AdminSessionInsights";
import { AdminEmailBroadcast } from "@/components/admin/AdminEmailBroadcast";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (roles && roles.length > 0) {
        setIsAdmin(true);
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Checking access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Logo size="sm" />
          <div className="flex items-center gap-2 ml-auto">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-semibold">Admin Panel</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="requests" className="gap-2">
              <Crown className="w-4 h-4" />
              Pro Requests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Users className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-2">
              <Mail className="w-4 h-4" />
              Broadcast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <AdminProRequests />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminUserAnalytics />
          </TabsContent>

          <TabsContent value="sessions">
            <AdminSessionInsights />
          </TabsContent>

          <TabsContent value="broadcast">
            <AdminEmailBroadcast />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
