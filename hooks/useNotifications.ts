import { API_URL } from "@/constants/api";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

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
  const appStateRef = useRef<AppStateStatus>("active");
  const hasInitialFetch = useRef(false);

  const fetchPendingNotifications = useCallback(async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/pending/${deviceId}`);
      if (!res.ok) {
        throw new Error(`Nije moguce preuzeti notifikacije (${res.status})`);
      }

      const data = await res.json();
      console.log("[useNotifications] Fetched pending notifications:", data.length);

      if (Array.isArray(data)) {
        setNotifications(
          data.map((n: any) => ({
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
      setLoading(false);
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

      console.log("[useNotifications] Marked as seen:", notificationId);
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

    console.log("[useNotifications] Initializing for device:", deviceId);

    if (!hasInitialFetch.current) {
      fetchPendingNotifications();
      hasInitialFetch.current = true;
    }

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
      console.log("[useNotifications] AppState changed to:", state);

      if (state === "active") {
        fetchPendingNotifications();
      }
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      () => {
        console.log("[useNotifications] Push received - fetching notifications");
        fetchPendingNotifications();
      },
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(() => {
        console.log(
          "[useNotifications] Notification opened - fetching notifications",
        );
        fetchPendingNotifications();
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
