import {
  ChakraPetch_400Regular,
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
} from "@expo-google-fonts/chakra-petch";
import { NeoTheme } from "@/constants/neo-theme";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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

  return (
    <ThemeProvider value={appTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
