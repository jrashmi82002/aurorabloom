import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DiaryEntry = Database["public"]["Tables"]["diary_entries"]["Row"];
export type DiaryInsert = Database["public"]["Tables"]["diary_entries"]["Insert"];

export const diaryService = {
  async list(userId: string): Promise<DiaryEntry[]> {
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async upsert(entry: DiaryInsert) {
    const { data, error } = await supabase
      .from("diary_entries")
      .upsert(entry, { onConflict: "user_id,entry_date" })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase.from("diary_entries").delete().eq("id", id);
    if (error) throw error;
  },
};
