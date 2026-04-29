import { REVENUECAT_ANDROID_KEY, REVENUECAT_IOS_KEY } from "@/constants/env";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

let rcConfigured = false;

function ensureConfigured() {
  if (rcConfigured) return;
  const apiKey = Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  if (!apiKey) {
    if (__DEV__) console.warn("[RC] Missing RevenueCat API key for platform:", Platform.OS);
    return;
  }
  Purchases.configure({ apiKey });
  rcConfigured = true;
}

export type SubscriptionState = {
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  purchasing: boolean;
  error: string | null;
};

export function useSubscription(userId?: string) {
  const [state, setState] = useState<SubscriptionState>({
    offerings: null,
    customerInfo: null,
    loading: true,
    purchasing: false,
    error: null,
  });

  // Configure + identify user
  useEffect(() => {
    if (Platform.OS === "web") return;
    ensureConfigured();
    if (!rcConfigured) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        if (userId) {
          await Purchases.logIn(userId);
        }
        const [offerings, customerInfo] = await Promise.all([
          Purchases.getOfferings(),
          Purchases.getCustomerInfo(),
        ]);
        if (!cancelled) {
          setState({
            offerings: offerings.current,
            customerInfo,
            loading: false,
            purchasing: false,
            error: null,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : "Greska pri ucitavanju planova",
          }));
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [userId]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!rcConfigured) return false;
    setState((s) => ({ ...s, purchasing: true, error: null }));
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setState((s) => ({ ...s, customerInfo, purchasing: false }));
      return true;
    } catch (e: unknown) {
      // User cancelled — not a real error
      if (e && typeof e === "object" && "userCancelled" in e && (e as { userCancelled: boolean }).userCancelled) {
        setState((s) => ({ ...s, purchasing: false }));
        return false;
      }
      setState((s) => ({
        ...s,
        purchasing: false,
        error: e instanceof Error ? e.message : "Kupovina nije uspela",
      }));
      return false;
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!rcConfigured) return false;
    setState((s) => ({ ...s, purchasing: true, error: null }));
    try {
      const customerInfo = await Purchases.restorePurchases();
      setState((s) => ({ ...s, customerInfo, purchasing: false }));
      return true;
    } catch (e) {
      setState((s) => ({
        ...s,
        purchasing: false,
        error: e instanceof Error ? e.message : "Obnova kupovine nije uspela",
      }));
      return false;
    }
  }, []);

  const getManagementURL = useCallback((): string | null => {
    return state.customerInfo?.managementURL ?? null;
  }, [state.customerInfo]);

  return {
    ...state,
    purchasePackage,
    restorePurchases,
    getManagementURL,
  };
}
