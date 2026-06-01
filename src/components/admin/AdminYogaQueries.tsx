import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Check, Flower2 } from "lucide-react";

interface YogaQuery {
  id: string;
  user_id: string;
  name: string;
  email: string;
  level: string | null;
  message: string;
  status: string;
  created_at: string;
}

export const AdminYogaQueries = () => {
  const [queries, setQueries] = useState<YogaQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("yoga_queries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setQueries(data || []);
    }
    setLoading(false);
  };

  const markResolved = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from("yoga_queries").update({ status: "resolved" }).eq("id", id);
    setProcessingId(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setQueries((qs) => qs.map((q) => (q.id === id ? { ...q, status: "resolved" } : q)));
    toast({ title: "Marked as resolved" });
  };

  const deleteQuery = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from("yoga_queries").delete().eq("id", id);
    setProcessingId(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setQueries((qs) => qs.filter((q) => q.id !== id));
    toast({ title: "Deleted" });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const newCount = queries.filter((q) => q.status === "new").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flower2 className="w-5 h-5 text-emerald-500" />
              Yoga Queries
            </CardTitle>
            <CardDescription>Questions from users on the Yoga page</CardDescription>
          </div>
          <Badge variant="outline">{newCount} new</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {queries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No queries yet</p>
        ) : (
          <div className="space-y-3">
            {queries.map((q) => (
              <div key={q.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium">{q.name} <span className="text-muted-foreground font-normal">· {q.email}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleString()}
                      {q.level && <> · Level: <span className="capitalize">{q.level}</span></>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.status === "resolved" ? (
                      <Badge className="bg-green-500 gap-1"><Check className="w-3 h-3" /> Resolved</Badge>
                    ) : (
                      <Badge variant="outline">New</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{q.message}</p>
                <div className="flex gap-2 pt-1">
                  {q.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markResolved(q.id)}
                      disabled={processingId === q.id}
                      className="gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark Resolved
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteQuery(q.id)}
                    disabled={processingId === q.id}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
