import { API_URL } from "@/constants/api";
import { parseApiErrorMessage } from "@/constants/apiError";
import { useCallback, useEffect, useState } from "react";

export type PlanTier = "FREE" | "BRONZE" | "SILVER" | "GOLD";

type PricingPlan = {
  tier: Exclude<PlanTier, "FREE">;
  /** Koliko signala sme istovremeno da bude ukljuceno. */
  alerts: number;
  /** Koliko signala jos sme da stoji u rezervi (nacrti/pauzirani). */
  drafts: number;
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
  /** Koliko signala sme istovremeno da bude UKLJUCENO (limit plana). */
  alertLimit: number;
  /** Koliko signala sme da stoji u rezervi (pauzirano/nacrt) - isto kao alertLimit. */
  draftLimit: number;
  /** alertLimit + draftLimit - ukupno sacuvanih signala. */
  totalAlertLimit: number;
  /** Ukupno sacuvanih signala (aktivni + pauzirani). */
  signalCount: number;
  /** Samo ukljuceni signali. */
  activeSignalCount: number;
  pricingPlans: PricingPlan[];
  freeBronzeCode: string;
  // Trial + subscription
  trialActive: boolean;
  trialDaysLeft: number;
  trialExpiredAt: string | null;
  isLocked: boolean;
  subscription: {
    tier: PlanTier;
    status: "TRIAL" | "ACTIVE" | "PAUSED" | "EXPIRED" | "CANCELLED";
    productId: string | null;
    startedAt: string;
    renewsAt: string | null;
    pausedAt: string | null;
  } | null;
};

type ProfilePatchPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

type ProfileStore = {
  profile: AccountProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

type StoreListener = (deviceId: string) => void;

const profileStores = new Map<string, ProfileStore>();
const profileListeners = new Set<StoreListener>();

function getStore(deviceId: string): ProfileStore {
  const existing = profileStores.get(deviceId);
  if (existing) return existing;

  const created: ProfileStore = {
    profile: null,
    loading: false,
    error: null,
    initialized: false,
  };
  profileStores.set(deviceId, created);
  return created;
}

function emit(deviceId: string) {
  profileListeners.forEach((listener) => listener(deviceId));
}

function subscribeProfile(listener: StoreListener) {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}

export function useAccountProfile(deviceId: string | null) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const refresh = useCallback(async () => {
    if (!deviceId) return null;
    const store = getStore(deviceId);
    store.loading = true;
    emit(deviceId);
    try {
      const res = await fetch(`${API_URL}/profile/${deviceId}`);
      if (!res.ok) {
        throw new Error(
          await parseApiErrorMessage(res, "Profil trenutno nije dostupan. Pokušaj ponovo."),
        );
      }
      const data = (await res.json()) as AccountProfile;
      store.profile = data;
      store.error = null;
      store.initialized = true;
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Nepoznata greska";
      store.error = message;
      store.initialized = true;
      return null;
    } finally {
      store.loading = false;
      emit(deviceId);
    }
  }, [deviceId]);

  const updateProfile = useCallback(
    async (payload: ProfilePatchPayload) => {
      if (!deviceId) {
        throw new Error("Device nije registrovan");
      }

      const store = getStore(deviceId);
      const res = await fetch(`${API_URL}/profile/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          await parseApiErrorMessage(res, "Snimanje profila nije uspelo. Pokušaj ponovo."),
        );
      }
      const data = (await res.json()) as AccountProfile;
      store.profile = data;
      store.error = null;
      store.initialized = true;
      emit(deviceId);
      return data;
    },
    [deviceId],
  );

  const redeemBronzeCode = useCallback(
    async (code: string) => {
      if (!deviceId) {
        throw new Error("Device nije registrovan");
      }

      const store = getStore(deviceId);
      const res = await fetch(`${API_URL}/promo/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, code }),
      });

      if (!res.ok) {
        throw new Error(
          await parseApiErrorMessage(res, "Kod nije prihvaćen. Proveri i pokušaj ponovo."),
        );
      }

      const data = (await res.json()) as AccountProfile;
      store.profile = data;
      store.error = null;
      store.initialized = true;
      emit(deviceId);
      return data;
    },
    [deviceId],
  );

  const cancelDrugarskiCode = useCallback(
    async () => {
      if (!deviceId) {
        throw new Error("Device nije registrovan");
      }

      const store = getStore(deviceId);
      const res = await fetch(`${API_URL}/promo/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      if (!res.ok) {
        throw new Error(
          await parseApiErrorMessage(res, "Otkazivanje nije uspelo. Pokušaj ponovo."),
        );
      }

      const data = (await res.json()) as AccountProfile;
      store.profile = data;
      store.error = null;
      store.initialized = true;
      emit(deviceId);
      return data;
    },
    [deviceId],
  );

  useEffect(() => {
    if (!deviceId) {
      setProfile(null);
      setError(null);
      setLoading(false);
      setInitialized(false);
      return;
    }

    const syncFromStore = () => {
      const store = getStore(deviceId);
      setProfile(store.profile);
      setError(store.error);
      setLoading(store.loading);
      setInitialized(store.initialized);
    };

    syncFromStore();

    const unsubscribe = subscribeProfile((changedDeviceId) => {
      if (changedDeviceId !== deviceId) return;
      syncFromStore();
    });

    const store = getStore(deviceId);
    if (!store.initialized && !store.loading) {
      void refresh();
    }

    return unsubscribe;
  }, [deviceId, refresh]);

  return {
    profile,
    loading,
    error,
    initialized,
    refresh,
    updateProfile,
    redeemBronzeCode,
    cancelDrugarskiCode,
  };
}
