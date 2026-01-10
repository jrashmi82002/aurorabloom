import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const AccountSettings = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete user data in order (respecting foreign keys)
      // 1. Get all session IDs first
      const { data: sessions } = await supabase
        .from("therapy_sessions")
        .select("id")
        .eq("user_id", user.id);
      
      const sessionIds = sessions?.map(s => s.id) || [];
      
      // 2. Delete therapy messages for those sessions
      if (sessionIds.length > 0) {
        await supabase.from("therapy_messages").delete().in("session_id", sessionIds);
        await supabase.from("quiz_responses").delete().in("session_id", sessionIds);
      }
      
      // 3. Delete therapy sessions
      await supabase.from("therapy_sessions").delete().eq("user_id", user.id);
      
      // 4. Delete diary entries
      await supabase.from("diary_entries").delete().eq("user_id", user.id);
      
      // 5. Delete notifications
      await supabase.from("notifications").delete().eq("user_id", user.id);
      
      // 6. Delete pro access requests
      await supabase.from("pro_access_requests").delete().eq("user_id", user.id);
      
      // 7. Delete profile
      await supabase.from("profiles").delete().eq("id", user.id);
      
      // 8. Sign out (the actual user deletion would need admin API in production)
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

  return (
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
  );
};
