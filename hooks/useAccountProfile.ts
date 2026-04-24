import { API_URL } from "@/constants/api";
import { useCallback, useEffect, useState } from "react";

export type PlanTier = "FREE" | "BRONZE" | "SILVER" | "GOLD";

type PricingPlan = {
  tier: Exclude<PlanTier, "FREE">;
  alerts: number;
  monthlyEur: number;
};

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  planTier: PlanTier;
  promoCodeUsed: string | null;
  promoRedeemedAt: string | null;
};

export type AccountProfile = {
  deviceId: string;
  user: UserProfile | null;
  planTier: PlanTier;
  alertLimit: number;
  signalCount: number;
  pricingPlans: PricingPlan[];
  freeBronzeCode: string;
};

type ProfilePatchPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

export function useAccountProfile(deviceId: string | null) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!deviceId) return null;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/profile/${deviceId}`);
      if (!res.ok) {
        throw new Error(`Profil nije dostupan (${res.status})`);
      }
      const data = (await res.json()) as AccountProfile;
      setProfile(data);
      setError(null);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Nepoznata greska";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const updateProfile = useCallback(
    async (payload: ProfilePatchPayload) => {
      if (!deviceId) {
        throw new Error("Device nije registrovan");
      }
      const res = await fetch(`${API_URL}/profile/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Snimanje profila nije uspelo (${res.status}): ${await res.text()}`);
      }
      const data = (await res.json()) as AccountProfile;
      setProfile(data);
      setError(null);
      return data;
    },
    [deviceId],
  );

  const redeemBronzeCode = useCallback(
    async (code: string) => {
      if (!deviceId) {
        throw new Error("Device nije registrovan");
      }

      const res = await fetch(`${API_URL}/promo/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, code }),
      });

      if (!res.ok) {
        throw new Error(`Kod nije prihvacen (${res.status}): ${await res.text()}`);
      }

      const data = (await res.json()) as AccountProfile;
      setProfile(data);
      setError(null);
      return data;
    },
    [deviceId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    profile,
    loading,
    error,
    refresh,
    updateProfile,
    redeemBronzeCode,
  };
}
