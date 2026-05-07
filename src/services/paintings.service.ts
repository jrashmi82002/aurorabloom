import { supabase } from "@/integrations/supabase/client";

export interface Painting {
  id: string;
  user_id: string;
  title: string | null;
  image_data: string;
  created_at: string;
  updated_at: string;
}

const MAX_PAINTINGS = 10;

export const paintingsService = {
  async list(userId: string): Promise<Painting[]> {
    const { data, error } = await supabase
      .from("paintings" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Painting[];
  },

  async create(userId: string, imageData: string, title?: string): Promise<Painting> {
    const { data, error } = await supabase
      .from("paintings" as any)
      .insert({ user_id: userId, image_data: imageData, title: title ?? null })
      .select()
      .single();
    if (error) throw error;

    // Enforce max 10: delete oldest extras
    const all = await this.list(userId);
    if (all.length > MAX_PAINTINGS) {
      const toDelete = all.slice(MAX_PAINTINGS).map((p) => p.id);
      if (toDelete.length > 0) {
        await supabase.from("paintings" as any).delete().in("id", toDelete);
      }
    }
    return data as unknown as Painting;
  },

  async update(id: string, imageData: string): Promise<Painting> {
    const { data, error } = await supabase
      .from("paintings" as any)
      .update({ image_data: imageData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Painting;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("paintings" as any).delete().eq("id", id);
    if (error) throw error;
  },
};
