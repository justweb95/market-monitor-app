import { API_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { usePushToken } from "./usePushToken";

const DEVICE_ID_KEY = "market_monitor_device_id";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const INVALID_DEVICE_IDS = new Set([
  "web-device-dummy",
  "android-device-dummy",
  "ios-device-dummy",
]);

type NotificationMode = "disabled" | "mock" | "remote";

type AccountRegistration = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

function getNotificationMode(
  pushSupported: boolean,
  pushReason: string | null,
  pushToken: string | null,
): NotificationMode {
  if (!pushSupported) {
    return pushReason === "simulator" && Platform.OS === "android"
      ? "mock"
      : "disabled";
  }

  return pushToken ? "remote" : "disabled";
}

function isStoredDeviceIdValid(deviceId: string | null): deviceId is string {
  return !!deviceId && !INVALID_DEVICE_IDS.has(deviceId.trim());
}

export function useDevice() {
  const {
    pushToken,
    loading: pushTokenLoading,
    error: pushTokenError,
    supported: pushSupported,
    reason: pushReason,
  } = usePushToken();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [notificationMode, setNotificationMode] =
    useState<NotificationMode>("disabled");

  const registerDevice = useCallback(async (account?: AccountRegistration): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
      const storedDeviceId = isStoredDeviceIdValid(stored) ? stored : null;

      if (stored && !storedDeviceId) {
        await AsyncStorage.removeItem(DEVICE_ID_KEY);
      }

      const mode = getNotificationMode(pushSupported, pushReason, pushToken);
      setNotificationMode(mode);

      if (mode === "disabled") {
        throw new Error(
          pushTokenError ||
            "Push registracija jos nije spremna. Proveri dozvole i push setup.",
        );
      }

      const payload = {
        deviceId: storedDeviceId,
        platform: mode === "mock" ? "android-emulator" : Platform.OS,
        expoPushToken:
          mode === "remote"
            ? pushToken
            : mode === "mock"
              ? `mock:${Platform.OS}`
              : null,
        ...(account
          ? {
              firstName: account.firstName.trim(),
              lastName: account.lastName.trim(),
              email: account.email.trim().toLowerCase(),
              password: account.password,
            }
          : {}),
      };

      console.log("[useDevice] register payload", payload);

      const res = await fetch(`${API_URL}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let details = "";
        try {
          const data = await res.json();
          details = data?.error ? ` ${data.error}` : "";
        } catch {
          details = ` ${await res.text()}`;
        }
        throw new Error(
          `Registracija uredaja nije uspela (${res.status}).${details}`,
        );
      }

      const device = await res.json();
      if (!device?.id) {
        throw new Error("Backend nije vratio device ID.");
      }

      await AsyncStorage.setItem(DEVICE_ID_KEY, device.id);
      setDeviceId(device.id);
      return device.id;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);

      if (retryCount < MAX_RETRIES && !pushTokenLoading) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, RETRY_DELAY);
      }

      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [
    pushReason,
    pushSupported,
    pushToken,
    pushTokenError,
    pushTokenLoading,
    retryCount,
  ]);

  const ensureDeviceRegistered = useCallback(async (): Promise<string> => {
    if (isStoredDeviceIdValid(deviceId)) {
      return deviceId;
    }

    return registerDevice();
  }, [deviceId, registerDevice]);

  const linkAccountToDevice = useCallback(
    async (account: AccountRegistration): Promise<string> => {
      return registerDevice(account);
    },
    [registerDevice],
  );

  const invalidateDeviceRegistration = useCallback(async () => {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    setDeviceId(null);
  }, []);

  useEffect(() => {
    setNotificationMode(getNotificationMode(pushSupported, pushReason, pushToken));
  }, [pushReason, pushSupported, pushToken]);

  useEffect(() => {
    if (pushTokenLoading) {
      return;
    }

    const mode = getNotificationMode(pushSupported, pushReason, pushToken);
    if (mode === "disabled") {
      setLoading(false);
      if (pushTokenError) {
        setError(pushTokenError);
      }
      return;
    }

    registerDevice().catch(() => {
      // registration error state is already stored locally
    });
  }, [
    pushReason,
    pushSupported,
    pushToken,
    pushTokenError,
    pushTokenLoading,
    registerDevice,
    retryCount,
  ]);

  return {
    deviceId,
    loading,
    error,
    retryCount,
    notificationMode,
    supportsRemotePush: !!pushToken,
    pushTokenLoading,
    pushTokenError,
    ensureDeviceRegistered,
    linkAccountToDevice,
    invalidateDeviceRegistration,
  };
}
