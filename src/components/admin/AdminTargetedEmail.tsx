import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, UserCheck, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

export const AdminTargetedEmail = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.email.toLowerCase().includes(query) ||
            u.full_name?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      // Get users from auth via edge function
      const { data, error } = await supabase.functions.invoke("get-users", {});
      if (error) throw error;
      setUsers(data?.users || []);
      setFilteredUsers(data?.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.size === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one user.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const selectedEmails = users
        .filter((u) => selectedUsers.has(u.id))
        .map((u) => u.email);

      const { error } = await supabase.functions.invoke("send-targeted-email", {
        body: {
          emails: selectedEmails,
          subject,
          message,
        },
      });

      if (error) throw error;

      toast({
        title: "Emails Sent!",
        description: `Email sent to ${selectedEmails.length} user(s).`,
      });

      setSubject("");
      setMessage("");
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send emails.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Targeted Email
        </CardTitle>
        <CardDescription>Send emails to specific users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Recipients</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <button
              type="button"
              onClick={selectAll}
              className="text-sm text-primary hover:underline"
            >
              {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0
                ? "Deselect All"
                : "Select All"}
            </button>
            <span className="text-sm text-muted-foreground">
              {selectedUsers.size} selected
            </span>
          </div>
          <ScrollArea className="h-48">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      {user.full_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.full_name}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targeted-subject">Subject</Label>
            <Input
              id="targeted-subject"
              placeholder="Your email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targeted-message">Message</Label>
            <Textarea
              id="targeted-message"
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>

          <Button type="submit" disabled={sending || selectedUsers.size === 0} className="w-full gap-2">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {selectedUsers.size} User(s)
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
