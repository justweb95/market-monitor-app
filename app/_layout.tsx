import {
  ChakraPetch_400Regular,
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
} from "@expo-google-fonts/chakra-petch";
import { PaywallGate } from "@/components/paywall-gate";
import { NeoTheme } from "@/constants/neo-theme";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useDevice } from "@/hooks/useDevice";
import { useSubscription } from "@/hooks/useSubscription";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import type Purchases from "react-native-purchases";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore repeated splash calls during fast refresh.
});

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
  const [fontsLoaded] = useFonts({
    ChakraPetch_400Regular,
    ChakraPetch_500Medium,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
  });

  // Device and profile for paywall gate
  const { deviceId } = useDevice();
  const { profile, refresh: refreshProfile } = useAccountProfile(deviceId);
  const { purchasing, purchasePackage, restorePurchases, getManagementURL } = useSubscription(profile?.user?.id);
  const [managementUrl] = useState<string | null>(getManagementURL());

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

  const isLocked = profile?.isLocked ?? false;
  const trialDaysLeft = profile?.trialDaysLeft ?? 7;

  const planOptions: {
    tier: "BRONZE" | "SILVER" | "GOLD";
    label: string;
    price: string;
    alerts: number;
    pkg: Purchases.PurchasesPackage | null;
  }[] = [
    {
      tier: "BRONZE",
      label: "Bronze",
      price: "10 €",
      alerts: 3,
      pkg: profile?.pricingPlans
        ? null // Would fetch from offerings in PaywallGate
        : null,
    },
    {
      tier: "SILVER",
      label: "Silver",
      price: "15 €",
      alerts: 6,
      pkg: null,
    },
    {
      tier: "GOLD",
      label: "Gold",
      price: "20 €",
      alerts: 10,
      pkg: null,
    },
  ];

  async function handlePurchase(pkg: Purchases.PurchasesPackage): Promise<boolean> {
    const ok = await purchasePackage(pkg);
    if (ok) refreshProfile();
    return ok;
  }

  async function handleRedeemCode(code: string): Promise<void> {
    // This is called from PaywallGate, would link to profile redemption
    // For now, we rely on the profile screen to handle this
    throw new Error("Promo kod se aktivira na profilu");
  }

  return (
    <ThemeProvider value={appTheme}>
      <PaywallGate
        isLocked={isLocked}
        trialDaysLeft={trialDaysLeft}
        planOptions={planOptions}
        purchasing={purchasing}
        managementURL={managementUrl}
        onPurchase={handlePurchase}
        onRestorePurchases={restorePurchases}
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
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
