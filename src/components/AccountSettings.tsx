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
import { Trash2, Loader2, Save, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

interface ProfileData {
  username: string;
  full_name: string;
  age_group: string;
  gender_identity: string;
}

export const AccountSettings = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    username: "",
    full_name: "",
    age_group: "",
    gender_identity: "",
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
        .select("username, full_name, age_group, gender_identity")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({
          username: profileData.username || "",
          full_name: profileData.full_name || "",
          age_group: profileData.age_group || "",
          gender_identity: profileData.gender_identity || "",
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

      // Validate username if changed
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

        // Check if username is taken by another user
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

      // Delete user data in order (respecting foreign keys)
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <User className="w-5 h-5" />
          Profile Information
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="your_username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            />
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Age Group</Label>
              <Input value={profile.age_group || "Not set"} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Gender Identity</Label>
              <Input value={profile.gender_identity || "Not set"} disabled className="bg-muted" />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
        <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. All your data including 
          diary entries, therapy sessions, and personal information will be permanently removed.
        </p>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers, including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All diary entries and images</li>
                  <li>Therapy session history</li>
                  <li>Profile information</li>
                  <li>Pro subscription status</li>
                </ul>
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
  );
};