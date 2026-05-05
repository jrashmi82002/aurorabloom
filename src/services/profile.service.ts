import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async update(
    userId: string,
    patch: Partial<Pick<Profile, "full_name" | "username" | "age_group" | "gender_identity">>,
  ) {
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  isPro(p: Profile | null): boolean {
    if (!p) return false;
    const status = p.pro_subscription_status;
    if (status !== "monthly" && status !== "yearly") return false;
    if (!p.pro_subscription_ends_at) return true;
    return new Date(p.pro_subscription_ends_at) > new Date();
  },
};
