import {
  ChakraPetch_400Regular,
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
} from "@expo-google-fonts/chakra-petch";
import { AppToast, type ToastMessage } from "@/components/app-toast";
import { AuthGate } from "@/components/auth-gate";
import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingModal } from "@/components/onboarding-modal";
import { PaywallGate } from "@/components/paywall-gate";
import { NeoTheme } from "@/constants/neo-theme";
import {
  PAID_TIERS,
  TIER_ALERTS,
  findPackageForTier,
  priceLabelForTier,
  type PaidTier,
} from "@/constants/plans";
import { rf, rs } from "@/constants/responsive";
import { DeviceProvider, useDevice } from "@/contexts/DeviceContext";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useSubscription } from "@/hooks/useSubscription";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { confirmSubscriptionDisclosure } from "@/constants/subscription-disclosure";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore repeated splash calls during fast refresh.
});

const ONBOARDING_SEEN_KEY = "market_monitor_onboarding_seen_v1";

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: NeoTheme.colors.background,
    card: NeoTheme.colors.background,
    border: NeoTheme.colors.border,
    notification: NeoTheme.colors.lime,
    primary: NeoTheme.colors.lime,
    text: NeoTheme.colors.text,
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <DeviceProvider>
        <RootLayoutContent />
      </DeviceProvider>
    </ErrorBoundary>
  );
}

function RootLayoutContent() {
  const [fontsLoaded] = useFonts({
    ChakraPetch_400Regular,
    ChakraPetch_500Medium,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
  });

  // Device and profile for paywall gate
  const pathname = usePathname();
  const router = useRouter();
  const { deviceId, loading: deviceLoading, linkAccountToDevice } = useDevice();
  const {
    profile,
    initialized: profileInitialized,
    error: profileError,
    refresh: refreshProfile,
    redeemBronzeCode,
  } = useAccountProfile(deviceId);
  const { offerings, purchasing, purchasePackage, restorePurchases, error: purchaseError, getManagementURL } = useSubscription(profile?.user?.id);
  const managementUrl = getManagementURL();
  const [syncingEntitlement, setSyncingEntitlement] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Potvrda posle prijave/registracije. Drzi se ovde (a ne u AuthGate-u) jer
  // AuthGate nestaje istog trenutka kad se nalog poveze, pa poruka mora da
  // prezivi taj prelaz.
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
      .then((seen) => {
        if (!seen) setShowOnboarding(true);
      })
      .catch(() => {
        // Best effort; if the flag can't be read, skip onboarding rather than block the app.
      });
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true").catch(() => {});
  };

  const wait = (ms: number) => new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });

  const refreshEntitlementState = async () => {
    let latest = await refreshProfile();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (latest && !latest.isLocked) {
        return latest;
      }

      await wait(1200);
      latest = await refreshProfile();
    }

    return latest;
  };

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore splash hide races during development refreshes.
      });
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const clearHandledNotification = async (
      response: Notifications.NotificationResponse | null,
    ) => {
      if (!response) return;
      try {
        await Notifications.clearLastNotificationResponseAsync();
      } catch (error) {
        console.error("[notifications] Failed to clear response", error);
      }
    };

    Notifications.getLastNotificationResponseAsync()
      .then(clearHandledNotification)
      .catch((error) => {
        console.error("[notifications] Failed to restore last response", error);
      });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void clearHandledNotification(response);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  if (deviceLoading || !profileInitialized) {
    return (
      <View style={appLoadingStyles.container}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={appLoadingStyles.logo}
        />
        <ActivityIndicator color={NeoTheme.colors.lime} size="large" style={{ marginTop: rs(24) }} />
      </View>
    );
  }

  // Profil se ucitao, ali fetch nije uspeo (mreza/backend nedostupan) - ne znamo
  // da li nalog postoji ili ne, pa NE prikazujemo AuthGate (bio bi lazan zahtev
  // za ponovnu registraciju vec povezanom korisniku). Nudimo samo retry.
  if (!profile && profileError) {
    return (
      <View style={appLoadingStyles.container}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={appLoadingStyles.logo}
        />
        <Text style={appLoadingStyles.errorText}>
          Ne mozemo da ucitamo profil. Proveri internet konekciju.
        </Text>
        <Pressable style={appLoadingStyles.retryBtn} onPress={() => refreshProfile()}>
          <Text style={appLoadingStyles.retryBtnText}>Pokusaj ponovo</Text>
        </Pressable>
      </View>
    );
  }

  // Nalog je obavezan pre bilo kakvog pristupa aplikaciji - dok se uredjaj ne
  // poveze sa nalogom (profile.user), ne renderujemo Stack/PaywallGate uopste,
  // samo AuthGate. Nema "preskoci"/anonimni put ka tabovima.
  if (!profile?.user) {
    return (
      <ThemeProvider value={appTheme}>
        <AuthGate
          onSubmit={async (account, mode) => {
            await linkAccountToDevice(account);
            await refreshProfile();
            setToast({
              kind: "success",
              text:
                mode === "login"
                  ? "Uspesno si prijavljen. Dobrodosao nazad!"
                  : "Nalog je napravljen. Dobrodosao u Lovac na Oglase!",
            });
          }}
        />
        <AppToast toast={toast} onHide={() => setToast(null)} />
        <StatusBar style="light" />
      </ThemeProvider>
    );
  }

  const isLocked = profile?.isLocked ?? false;
  const trialDaysLeft = profile?.trialDaysLeft ?? 7;

  // Cena se uzima iz RevenueCat-a (Google Play, lokalna valuta) — hardkodovana
  // vrednost iz FALLBACK_PRICE se vidi samo dok offerings nisu ucitani.
  const planOptions: {
    tier: PaidTier;
    label: string;
    price: string;
    alerts: number;
    pkg: PurchasesPackage | null;
  }[] = PAID_TIERS.map((tier) => {
    const pkg = findPackageForTier(offerings, tier);
    return {
      tier,
      label: tier.charAt(0) + tier.slice(1).toLowerCase(),
      price: priceLabelForTier(pkg, tier),
      alerts: TIER_ALERTS[tier],
      pkg,
    };
  });

  async function handlePurchase(pkg: PurchasesPackage): Promise<boolean> {
    if (!profile?.user?.id) {
      Alert.alert(
        "Nalog je potreban",
        "Pre kupovine pretplate, prvo napravi nalog (ime, email, lozinka) na Profil ekranu - inace placanje nece biti povezano sa tvojim nalogom.",
        [
          { text: "Kasnije", style: "cancel" },
          { text: "Idi na profil", onPress: () => router.push("/profile") },
        ],
      );
      return false;
    }

    const confirmed = await confirmSubscriptionDisclosure();
    if (!confirmed) return false;

    const ok = await purchasePackage(pkg);
    if (!ok) return false;

    setSyncingEntitlement(true);
    try {
      const nextProfile = await refreshEntitlementState();
      return !!nextProfile && !nextProfile.isLocked;
    } finally {
      setSyncingEntitlement(false);
    }
  }

  async function handleRestorePurchases(): Promise<boolean> {
    const ok = await restorePurchases();
    if (!ok) return false;

    setSyncingEntitlement(true);
    try {
      const nextProfile = await refreshEntitlementState();
      return !!nextProfile && !nextProfile.isLocked;
    } finally {
      setSyncingEntitlement(false);
    }
  }

  async function handleRedeemCode(code: string): Promise<void> {
    await redeemBronzeCode(code.toUpperCase());
  }

  return (
    <ThemeProvider value={appTheme}>
      <PaywallGate
        isLocked={isLocked && !pathname.startsWith("/profile")}
        trialDaysLeft={trialDaysLeft}
        planOptions={planOptions}
        purchasing={purchasing}
        purchaseError={purchaseError}
        syncingEntitlement={syncingEntitlement}
        managementURL={managementUrl}
        onPurchase={handlePurchase}
        onRestorePurchases={handleRestorePurchases}
        onRedeemCode={handleRedeemCode}
        onRefreshProfile={refreshProfile}
      >
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
      </PaywallGate>
      <OnboardingModal visible={showOnboarding} onDismiss={dismissOnboarding} />
      <AppToast toast={toast} onHide={() => setToast(null)} />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

const appLoadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NeoTheme.colors.background,
  },
  logo: {
    width: rs(96),
    height: rs(96),
    borderRadius: rs(24),
  },
  errorText: {
    marginTop: rs(20),
    marginHorizontal: rs(32),
    textAlign: "center",
    color: NeoTheme.colors.textMuted,
    fontFamily: NeoTheme.fonts.medium,
    fontSize: rf(14),
  },
  retryBtn: {
    marginTop: rs(16),
    minHeight: rs(44),
    paddingHorizontal: rs(24),
    borderRadius: NeoTheme.radius.sm,
    backgroundColor: NeoTheme.colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtnText: {
    color: NeoTheme.colors.black,
    fontFamily: NeoTheme.fonts.bold,
    fontSize: rf(14),
  },
});
