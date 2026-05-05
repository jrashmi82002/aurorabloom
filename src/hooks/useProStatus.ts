import { useMemo } from "react";
import { profileService } from "@/services/profile.service";
import { useProfile } from "./useProfile";

/**
 * Convenience hook: derives whether the current user has an active Pro
 * subscription. Wraps useProfile + profileService.isPro().
 */
export function useProStatus() {
  const { profile, loading, refresh } = useProfile();
  const isPro = useMemo(() => profileService.isPro(profile), [profile]);
  const tier = profile?.pro_subscription_status ?? "free";
  const endsAt = profile?.pro_subscription_ends_at ?? null;
  return { isPro, tier, endsAt, profile, loading, refresh };
}
