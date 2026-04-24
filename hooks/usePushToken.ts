import { PUSH_MODE } from "@/constants/env";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

type PushReason =
  | "disabled"
  | "web"
  | "simulator"
  | "permission"
  | "error"
  | null;

type PushTokenState = {
  pushToken: string | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
  reason: PushReason;
};

type PushRegistrationResult = {
  token: string | null;
  supported: boolean;
  error?: string | null;
  reason: PushReason;
};

export function usePushToken(): PushTokenState {
  const [state, setState] = useState<PushTokenState>({
    pushToken: null,
    loading: true,
    error: null,
    supported: true,
    reason: null,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const result = await registerForPushNotifications();

      if (!mounted) return;

      setState({
        pushToken: result.token,
        loading: false,
        error: result.error ?? null,
        supported: result.supported,
        reason: result.reason,
      });
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  console.log(
    `[usePushToken] Start platform=${Platform.OS} device=${Device.isDevice} pushMode=${PUSH_MODE}`,
  );

  if (PUSH_MODE === "off") {
    return {
      token: null,
      supported: false,
      reason: "disabled",
    };
  }

  if (Platform.OS === "web") {
    return {
      token: null,
      supported: false,
      reason: "web",
    };
  }

  if (!Device.isDevice) {
    return {
      token: null,
      supported: false,
      reason: "simulator",
    };
  }

  try {
    if (Platform.OS === "android") {
      console.log("[usePushToken] Setting Android notification channel");
      await Notifications.setNotificationChannelAsync("default", {
        name: "Lovac na Oglase",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        enableLights: true,
        lightColor: "#FF0000",
      });
      console.log("[usePushToken] Android notification channel set");
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return {
        token: null,
        supported: true,
        error: "Dozvola za notifikacije nije odobrena.",
        reason: "permission",
      };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    console.log("[usePushToken] Token acquired:", tokenData.data);

    return {
      token: tokenData.data,
      supported: true,
      reason: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nepoznata greska pri push registraciji.";

    console.error("[usePushToken] Error:", message, error);

    return {
      token: null,
      supported: true,
      error:
        Platform.OS === "android" &&
        message.includes("FirebaseApp") &&
        message.includes("not initialized")
          ? "Android build nema ispravnu native push konfiguraciju. Napravi novi build aplikacije sa ukljucenim expo-notifications."
          : message,
      reason: "error",
    };
  }
}
