import { API_URL } from "@/constants/api";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  createdAt: string;
};

export function useNotifications(deviceId: string | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialFetch = useRef(false);
  const inFlightRef = useRef(false);
  const pendingRefetchRef = useRef(false);

  const fetchPendingNotifications = useCallback(async () => {
    if (!deviceId) return;
    if (inFlightRef.current) {
      pendingRefetchRef.current = true;
      return;
    }

    inFlightRef.current = true;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/pending/${deviceId}`);
      if (!res.ok) {
        throw new Error(`Nije moguce preuzeti notifikacije (${res.status})`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setNotifications(
          data.map((n: {
            id: string;
            title: string;
            body: string;
            data?: Record<string, string>;
            createdAt: string;
          }) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            data: n.data || {},
            createdAt: n.createdAt,
          })),
        );
        setError(null);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Nepoznata greska";
      console.error("[useNotifications] Error fetching:", message);
      setError(message);
    } finally {
      inFlightRef.current = false;
      setLoading(false);

      if (pendingRefetchRef.current) {
        pendingRefetchRef.current = false;
        void fetchPendingNotifications();
      }
    }
  }, [deviceId]);

  const markAsSeen = useCallback(async (notificationId: string) => {
    try {
      const res = await fetch(`${API_URL}/${notificationId}/seen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Nije moguce oznaciti kao vidjeno (${res.status})`);
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Nepoznata greska";
      console.error("[useNotifications] Error marking as seen:", message);
    }
  }, []);

  const dismissNotification = useCallback(async (notificationId: string) => {
    await markAsSeen(notificationId);
  }, [markAsSeen]);

  useEffect(() => {
    if (!deviceId) return;

    if (!hasInitialFetch.current) {
      void fetchPendingNotifications();
      hasInitialFetch.current = true;
    }

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void fetchPendingNotifications();
      }
    });

    if (Platform.OS === "web") {
      return () => {
        appStateSubscription.remove();
      };
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      () => {
        void fetchPendingNotifications();
      },
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(() => {
        void fetchPendingNotifications();
      });

    return () => {
      appStateSubscription.remove();
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [deviceId, fetchPendingNotifications]);

  return {
    notifications,
    loading,
    error,
    markAsSeen,
    dismissNotification,
    refresh: fetchPendingNotifications,
  };
}
