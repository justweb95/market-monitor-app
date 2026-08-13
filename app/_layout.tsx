import {
  ChakraPetch_400Regular,
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
} from "@expo-google-fonts/chakra-petch";
import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingModal } from "@/components/onboarding-modal";
import { PaywallGate } from "@/components/paywall-gate";
import { NeoTheme } from "@/constants/neo-theme";
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
import { ActivityIndicator, Alert, Image, StyleSheet, View } from "react-native";
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
  const { deviceId, loading: deviceLoading } = useDevice();
  const { profile, refresh: refreshProfile, redeemBronzeCode } = useAccountProfile(deviceId);
  const { offerings, purchasing, purchasePackage, restorePurchases, error: purchaseError, getManagementURL } = useSubscription(profile?.user?.id);
  const managementUrl = getManagementURL();
  const [syncingEntitlement, setSyncingEntitlement] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  if (deviceLoading) {
    return (
      <View style={appLoadingStyles.container}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={appLoadingStyles.logo}
        />
        <ActivityIndicator color={NeoTheme.colors.lime} size="large" style={{ marginTop: 24 }} />
      </View>
    );
  }

  const isLocked = profile?.isLocked ?? false;
  const trialDaysLeft = profile?.trialDaysLeft ?? 7;

  const planOptions: {
    tier: "BRONZE" | "SILVER" | "GOLD";
    label: string;
    price: string;
    alerts: number;
    pkg: PurchasesPackage | null;
  }[] = [
    {
      tier: "BRONZE",
      label: "Bronze",
      price: "10 €",
      alerts: 3,
      pkg:
        offerings?.availablePackages.find((p) => p.identifier.toLowerCase().includes("bronze")) ??
        null,
    },
    {
      tier: "SILVER",
      label: "Silver",
      price: "15 €",
      alerts: 6,
      pkg:
        offerings?.availablePackages.find((p) => p.identifier.toLowerCase().includes("silver")) ??
        null,
    },
    {
      tier: "GOLD",
      label: "Gold",
      price: "20 €",
      alerts: 10,
      pkg:
        offerings?.availablePackages.find((p) => p.identifier.toLowerCase().includes("gold")) ??
        null,
    },
  ];

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
    width: 96,
    height: 96,
    borderRadius: 24,
  },
});
