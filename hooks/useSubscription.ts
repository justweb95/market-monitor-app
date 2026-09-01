import { REVENUECAT_ANDROID_KEY, REVENUECAT_IOS_KEY } from "@/constants/env";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  PRORATION_MODE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type GoogleProductChangeInfo,
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

function toSerbianError(e: unknown, fallback = "Kupovina nije uspela. Pokušaj ponovo."): string {
  if (e && typeof e === "object" && "code" in e) {
    const code = (e as { code: unknown }).code;
    if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR)
      return "Plaćanje je na čekanju. Bićeš obavešten kad Google Play potvrdi transakciju.";
    if (code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR)
      return "Ova pretplata je već aktivna na ovom nalogu.";
    if (code === PURCHASES_ERROR_CODE.NETWORK_ERROR)
      return "Proveri internet vezu i pokušaj ponovo.";
    if (code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR)
      return "Ovaj paket trenutno nije dostupan na Google Play-u.";
    if (code === PURCHASES_ERROR_CODE.INSUFFICIENT_PERMISSIONS_ERROR)
      return "Nedovoljne dozvole. Proveri Google Play nalog.";
  }
  return fallback;
}

export type SubscriptionState = {
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  purchasing: boolean;
  pending: boolean;
  error: string | null;
};

/** `market_monitor_silver_monthly:silver-monthly` -> `market_monitor_silver_monthly`. */
function baseProductId(identifier: string): string {
  return identifier.split(":")[0];
}

/**
 * Google Play tretira svaku pretplatu kao zaseban proizvod. Ako se nova kupi bez podatka o
 * staroj, korisnik ostane pretplacen na OBE i placa obe. Zato pri prelasku na drugi plan mora
 * da se prosledi `oldProductIdentifier` - tek tada Play zameni staru pretplatu novom.
 *
 * `IMMEDIATE_WITH_TIME_PRORATION` je Google-ov podrazumevani rezim i jedini koji radi i za
 * nadogradnju i za prelazak na nizi plan: ostatak vec placenog perioda se preracuna u vreme.
 */
async function resolveGoogleProductChange(
  pkg: PurchasesPackage,
): Promise<GoogleProductChangeInfo | null> {
  if (Platform.OS !== "android") return null;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const target = baseProductId(pkg.product.identifier);
    const oldProductIdentifier = customerInfo.activeSubscriptions.find(
      (identifier) => baseProductId(identifier) !== target,
    );
    if (!oldProductIdentifier) return null;

    return {
      oldProductIdentifier,
      prorationMode: PRORATION_MODE.IMMEDIATE_WITH_TIME_PRORATION,
    };
  } catch (e) {
    // Ako se stanje ne moze procitati, bolje pustiti obicnu kupovinu nego je blokirati.
    console.warn("[RC] Ne mogu da procitam aktivne pretplate, kupovina ide bez zamene", e);
    return null;
  }
}

function hasAnyActiveEntitlement(customerInfo: CustomerInfo): boolean {
  if (customerInfo.activeSubscriptions.length > 0) {
    return true;
  }

  return Object.keys(customerInfo.entitlements.active ?? {}).length > 0;
}

export function useSubscription(userId?: string) {
  const [state, setState] = useState<SubscriptionState>({
    offerings: null,
    customerInfo: null,
    loading: true,
    purchasing: false,
    pending: false,
    error: null,
  });

  const isPurchasingRef = useRef(false);

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
            pending: false,
            error: null,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: toSerbianError(e, "Greška pri učitavanju planova. Pokušaj ponovo."),
          }));
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [userId]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!rcConfigured) return false;
    if (isPurchasingRef.current) {
      console.warn("[RC] Kupovina već u toku, ignorišem duplikat");
      return false;
    }
    isPurchasingRef.current = true;
    setState((s) => ({ ...s, purchasing: true, pending: false, error: null }));
    try {
      console.log("[RC] Pokretanje kupovine:", pkg.identifier);
      const productChange = await resolveGoogleProductChange(pkg);
      if (productChange) {
        console.log(
          "[RC] Zamena pretplate:",
          productChange.oldProductIdentifier,
          "->",
          pkg.product.identifier,
        );
      }
      await Purchases.purchasePackage(pkg, null, productChange);
      const customerInfo = await Purchases.getCustomerInfo();
      const hasAccess = hasAnyActiveEntitlement(customerInfo);
      console.log("[RC] Kupovina završena, entitlement aktivan:", hasAccess);
      setState((s) => ({ ...s, customerInfo, purchasing: false, pending: false }));
      return hasAccess;
    } catch (e: unknown) {
      // Korisnik otkazao — nije greška
      if (e && typeof e === "object" && "userCancelled" in e && (e as { userCancelled: boolean }).userCancelled) {
        console.log("[RC] Kupovina otkazana od strane korisnika");
        setState((s) => ({ ...s, purchasing: false, pending: false }));
        return false;
      }
      // Plaćanje na čekanju (bankovni redirect, Google verifikacija)
      const isPending = e && typeof e === "object" && "code" in e &&
        (e as { code: unknown }).code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR;
      if (isPending) {
        console.log("[RC] Kupovina na čekanju — čeka Google potvrdu");
        setState((s) => ({
          ...s,
          purchasing: false,
          pending: true,
          error: "Plaćanje je na čekanju. Bićeš obavešten kad Google Play potvrdi transakciju.",
        }));
        return false;
      }
      console.error("[RC] Greška pri kupovini:", e);
      setState((s) => ({
        ...s,
        purchasing: false,
        pending: false,
        error: toSerbianError(e),
      }));
      return false;
    } finally {
      isPurchasingRef.current = false;
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!rcConfigured) return false;
    setState((s) => ({ ...s, purchasing: true, pending: false, error: null }));
    try {
      console.log("[RC] Pokretanje vraćanja kupovina");
      await Purchases.syncPurchases();
      const customerInfo = await Purchases.restorePurchases();
      const hasAccess = hasAnyActiveEntitlement(customerInfo);
      console.log("[RC] Vraćanje završeno, entitlement aktivan:", hasAccess);
      setState((s) => ({ ...s, customerInfo, purchasing: false }));
      return hasAccess;
    } catch (e) {
      console.error("[RC] Greška pri vraćanju kupovina:", e);
      setState((s) => ({
        ...s,
        purchasing: false,
        error: toSerbianError(e, "Obnova kupovine nije uspela. Pokušaj ponovo."),
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
