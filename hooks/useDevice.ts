import { API_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { usePushToken } from "./usePushToken";

const DEVICE_ID_KEY = "market_monitor_device_id";
const MOCK_PUSH_TOKEN_KEY = "market_monitor_mock_push_token";
const NOTIFICATIONS_ENABLED_KEY = "market_monitor_notifications_enabled";
const LAST_SENT_PUSH_TOKEN_KEY = "market_monitor_last_sent_push_token";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const INVALID_DEVICE_IDS = new Set([
  "web-device-dummy",
  "android-device-dummy",
  "ios-device-dummy",
]);

type NotificationMode = "disabled" | "mock" | "remote";

type AccountRegistration =
  | {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }
  | { googleIdToken: string };

function getNotificationMode(
  pushSupported: boolean,
  pushReason: string | null,
  pushToken: string | null,
): NotificationMode {
  if (Platform.OS === "web") {
    return "disabled";
  }

  if (!pushSupported) {
    return "mock";
  }

  return pushToken ? "remote" : "mock";
}

async function getOrCreateMockPushToken() {
  const existing = await AsyncStorage.getItem(MOCK_PUSH_TOKEN_KEY);
  if (existing?.trim()) return existing;

  const generated = `mock:${Platform.OS}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(MOCK_PUSH_TOKEN_KEY, generated);
  return generated;
}

function isStoredDeviceIdValid(deviceId: string | null): deviceId is string {
  return !!deviceId && !INVALID_DEVICE_IDS.has(deviceId.trim());
}

export function useDeviceState() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsPreferenceLoaded, setNotificationsPreferenceLoaded] = useState(false);
  const {
    pushToken,
    loading: pushTokenLoading,
    error: pushTokenError,
    supported: pushSupported,
    reason: pushReason,
  } = usePushToken(notificationsEnabled);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
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
      const shouldUseRemotePush = notificationsEnabled && mode === "remote";
      const resolvedMode: NotificationMode = notificationsEnabled ? mode : "disabled";
      setNotificationMode(resolvedMode);

      if (notificationsEnabled && mode === "disabled") {
        throw new Error(
          pushTokenError ||
            "Push registracija jos nije spremna. Proveri dozvole i push setup.",
        );
      }

      const payload = {
        deviceId: storedDeviceId,
        platform: Platform.OS.toUpperCase(),
        expoPushToken:
          shouldUseRemotePush
            ? pushToken
            : await getOrCreateMockPushToken(),
        ...(account
          ? "googleIdToken" in account
            ? { googleIdToken: account.googleIdToken }
            : {
                firstName: account.firstName.trim(),
                lastName: account.lastName.trim(),
                email: account.email.trim().toLowerCase(),
                password: account.password,
              }
          : {}),
      };

      if (__DEV__) {
        // Never log the raw payload - it can carry the user's plaintext password
        // or a Google bearer token.
        const safePayload: Record<string, unknown> = { ...payload };
        if ("password" in safePayload) safePayload.password = "[redacted]";
        if ("googleIdToken" in safePayload) safePayload.googleIdToken = "[redacted]";
        console.log("[useDevice] register payload", safePayload);
      }

      const res = await fetch(`${API_URL}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfterSec = Number(res.headers.get("Retry-After"));
          const waitMinutes = Number.isFinite(retryAfterSec) && retryAfterSec > 0
            ? Math.ceil(retryAfterSec / 60)
            : null;
          const rateLimitError = new Error(
            waitMinutes
              ? `Previse pokusaja registracije. Pokusaj ponovo za oko ${waitMinutes} min.`
              : "Previse pokusaja registracije. Pokusaj ponovo kasnije.",
          ) as Error & { status?: number };
          rateLimitError.status = 429;
          throw rateLimitError;
        }

        const rawBody = await res.text();
        // Backend salje ili { error: "citljiva poruka" } ili, za Zod validacione
        // greske, { error: "Nevaljana ulazna polja", details: [{field, message}] }
        // — details[0].message je specificna i citljiva (npr. "Email adresa nije
        // validna"), dok je top-level error generican. Prikazujemo korisniku
        // najspecificniju poruku koju imamo, nikad sirov status kod.
        let friendlyMessage = "Registracija uredjaja nije uspela. Pokusaj ponovo.";
        try {
          const data = JSON.parse(rawBody);
          friendlyMessage = data?.details?.[0]?.message || data?.error || friendlyMessage;
        } catch {
          // rawBody nije JSON (npr. HTML greska sa proxy-ja) — ostaje generican tekst
        }
        const httpError = new Error(friendlyMessage) as Error & { status?: number };
        httpError.status = res.status;
        throw httpError;
      }

      const device = await res.json();
      if (!device?.id) {
        throw new Error("Backend nije vratio device ID.");
      }

      await AsyncStorage.setItem(DEVICE_ID_KEY, device.id);
      if (typeof payload.expoPushToken === "string") {
        await AsyncStorage.setItem(LAST_SENT_PUSH_TOKEN_KEY, payload.expoPushToken);
      }
      setDeviceId(device.id);
      return device.id;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      const status = e instanceof Error ? (e as Error & { status?: number }).status : undefined;
      // Client errors (4xx) won't succeed on retry - only retry network failures / server errors.
      const isRetryable = status === undefined || status >= 500;
      setError(errorMsg);

      if (isRetryable && retryCount < MAX_RETRIES && !pushTokenLoading) {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
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
    notificationsEnabled,
    retryCount,
  ]);

  const updateNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(enabled));
  }, []);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY)
      .then((storedValue) => {
        if (!mounted) return;

        if (storedValue === null) {
          setNotificationsEnabled(true);
        } else {
          setNotificationsEnabled(storedValue === "true");
        }
        setNotificationsPreferenceLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        setNotificationsEnabled(true);
        setNotificationsPreferenceLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
    await AsyncStorage.removeItem(LAST_SENT_PUSH_TOKEN_KEY);
    setDeviceId(null);
  }, []);

  useEffect(() => {
    if (!notificationsPreferenceLoaded) return;
    setNotificationMode(
      notificationsEnabled
        ? getNotificationMode(pushSupported, pushReason, pushToken)
        : "disabled",
    );
  }, [notificationsEnabled, notificationsPreferenceLoaded, pushReason, pushSupported, pushToken]);

  useEffect(() => {
    if (!notificationsPreferenceLoaded) {
      return;
    }

    if (pushTokenLoading) {
      return;
    }

    const mode = getNotificationMode(pushSupported, pushReason, pushToken);
    if (notificationsEnabled && mode === "disabled") {
      setLoading(false);
      if (pushTokenError) {
        setError(pushTokenError);
      }
      return;
    }

    let cancelled = false;

    (async () => {
      const shouldUseRemotePush = notificationsEnabled && mode === "remote";
      const effectiveToken = shouldUseRemotePush
        ? pushToken
        : await getOrCreateMockPushToken();

      const [storedId, lastSentToken] = await Promise.all([
        AsyncStorage.getItem(DEVICE_ID_KEY),
        AsyncStorage.getItem(LAST_SENT_PUSH_TOKEN_KEY),
      ]);
      const storedDeviceId = isStoredDeviceIdValid(storedId) ? storedId : null;

      if (cancelled) return;

      if (storedDeviceId && effectiveToken && effectiveToken === lastSentToken) {
        // Device is already registered and the backend already has this exact push
        // token - re-hydrate local state without hitting the rate-limited endpoint
        // again. Registration should happen once per device, not once per app launch.
        setDeviceId(storedDeviceId);
        setNotificationMode(notificationsEnabled ? mode : "disabled");
        setLoading(false);
        return;
      }

      registerDevice().catch(() => {
        // registration error state is already stored locally
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pushReason,
    pushSupported,
    pushToken,
    pushTokenError,
    pushTokenLoading,
    notificationsEnabled,
    notificationsPreferenceLoaded,
    registerDevice,
    retryCount,
  ]);

  return {
    deviceId,
    loading,
    error,
    retryCount,
    notificationMode,
    pushReason,
    notificationsEnabled,
    notificationsPreferenceLoaded,
    supportsRemotePush: !!pushToken,
    pushTokenLoading,
    pushTokenError,
    updateNotificationsEnabled,
    ensureDeviceRegistered,
    linkAccountToDevice,
    invalidateDeviceRegistration,
  };
}
