import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

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
  const colorScheme = useColorScheme();

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

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
