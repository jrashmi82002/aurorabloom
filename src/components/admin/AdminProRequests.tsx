import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Loader2, Crown, UserX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProRequest {
  id: string;
  user_id: string;
  email: string;
  reason: string | null;
  status: string;
  requested_at: string;
}

interface ProUser {
  id: string;
  full_name: string | null;
  pro_subscription_status: string | null;
  pro_subscription_ends_at: string | null;
  email?: string;
}

export const AdminProRequests = () => {
  const [requests, setRequests] = useState<ProRequest[]>([]);
  const [proUsers, setProUsers] = useState<ProUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pro requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("pro_access_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Fetch pro users - get via edge function for email access
      const { data: usersData, error: usersError } = await supabase.functions.invoke("get-pro-users", {});
      if (usersError) throw usersError;
      setProUsers(usersData?.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ProRequest) => {
    setProcessingId(request.id);
    try {
      // Use edge function for admin operations
      const { error } = await supabase.functions.invoke("admin-pro-action", {
        body: {
          action: "approve",
          userId: request.user_id,
          requestId: request.id,
          email: request.email,
        },
      });

      if (error) throw error;

      toast({
        title: "Approved!",
        description: `Pro access granted to ${request.email}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (user: ProUser) => {
    setProcessingId(user.id);
    try {
      const { error } = await supabase.functions.invoke("admin-pro-action", {
        body: {
          action: "revoke",
          userId: user.id,
          email: user.email,
        },
      });

      if (error) throw error;

      toast({
        title: "Revoked",
        description: `Pro access revoked from ${user.email || user.full_name}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: ProRequest) => {
    setProcessingId(request.id);
    try {
      // Delete the rejected request so user can request again
      const { error } = await supabase
        .from("pro_access_requests")
        .delete()
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Rejected",
        description: `Request from ${request.email} rejected`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500 gap-1"><Check className="w-3 h-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pro Access Management</CardTitle>
        <CardDescription>Review requests and manage pro users</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests" className="gap-2">
              <Clock className="w-4 h-4" />
              Requests ({requests.filter(r => r.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="pro-users" className="gap-2">
              <Crown className="w-4 h-4" />
              Pro Users ({proUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {requests.filter(r => r.status === "pending").length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {requests.filter(r => r.status === "pending").map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{request.email}</p>
                      {request.reason && (
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request.status)}
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request)}
                            disabled={processingId === request.id}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pro-users">
            {proUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pro users yet</p>
            ) : (
              <div className="space-y-4">
                {proUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <p className="font-medium">{user.email || user.full_name || "User"}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expires: {user.pro_subscription_ends_at 
                          ? new Date(user.pro_subscription_ends_at).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRevoke(user)}
                      disabled={processingId === user.id}
                      className="gap-2"
                    >
                      {processingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserX className="w-4 h-4" />
                          Revoke
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
