import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  username: string;
  full_name: string;
}

export const AccountSettings = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    username: "",
    full_name: "",
  });
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({
          username: profileData.username || "",
          full_name: profileData.full_name || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (profile.username) {
        const regex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!regex.test(profile.username)) {
          toast({
            title: "Invalid Username",
            description: "Username must be 3-20 characters, alphanumeric and underscores only",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", profile.username.toLowerCase())
          .neq("id", user.id)
          .maybeSingle();

        if (existingUser) {
          toast({
            title: "Username Taken",
            description: "This username is already in use",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username.toLowerCase(),
          full_name: profile.full_name,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: sessions } = await supabase
        .from("therapy_sessions")
        .select("id")
        .eq("user_id", user.id);
      
      const sessionIds = sessions?.map(s => s.id) || [];
      
      if (sessionIds.length > 0) {
        await supabase.from("therapy_messages").delete().in("session_id", sessionIds);
        await supabase.from("quiz_responses").delete().in("session_id", sessionIds);
      }
      
      await supabase.from("therapy_sessions").delete().eq("user_id", user.id);
      await supabase.from("diary_entries").delete().eq("user_id", user.id);
      await supabase.from("notifications").delete().eq("user_id", user.id);
      await supabase.from("pro_access_requests").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      
      await supabase.auth.signOut();
      
      toast({ title: "Account deleted successfully" });
      navigate("/auth");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({ 
        title: "Error deleting account", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input id="email" type="email" value={email} disabled className="bg-muted h-8 text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-xs">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="your_username"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Your name"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        <Button onClick={handleSaveProfile} disabled={isSaving} size="sm" className="gap-1.5 h-8 text-xs">
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save Changes
        </Button>
      </div>

      <div className="border-t pt-3 mt-3">
        <div className="p-3 border border-destructive/30 rounded-md bg-destructive/5">
          <h3 className="text-sm font-semibold text-destructive mb-1">Danger Zone</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Permanently delete your account and all data.
          </p>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5 h-7 text-xs">
                <Trash2 className="w-3 h-3" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, delete my account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
