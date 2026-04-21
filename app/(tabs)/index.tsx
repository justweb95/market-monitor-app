import { API_URL } from "@/constants/api";
import { useDevice } from "@/hooks/useDevice";
import { useNotifications } from "@/hooks/useNotifications";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type NotifItem = {
  id: string;
  title: string;
  body: string;
  url?: string;
  imageUrl?: string;
  receivedAt: Date;
};

const PALETTE = {
  bg: "#090A0C",
  slate: "#14161B",
  text: "#F3F6EE",
  line: "#080A05",
  accent: "#A2DC47",
  paper: "#D8F29A",
  white: "#F2FFD3",
  ink: "#15190F",
  red: "#F07B7B",
  redBorder: "#A63F3F",
  greenSoft: "#B8E986",
  greenBorder: "#5B8937",
};

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Danas";
  if (date.toDateString() === yesterday.toDateString()) return "Juce";

  return date.toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("sr-RS", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(items: NotifItem[]): { date: string; data: NotifItem[] }[] {
  const map = new Map<string, NotifItem[]>();

  for (const item of items) {
    const key = formatDate(item.receivedAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)?.push(item);
  }

  return Array.from(map.entries()).map(([date, data]) => ({ date, data }));
}

function chunkByTwo<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { deviceId, loading: deviceLoading } = useDevice();
  const { notifications, markAsSeen, dismissNotification, refresh } = useNotifications(deviceId);

  const grouped = useMemo(
    () =>
      groupByDate(
        notifications.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          url: (item.data as Record<string, string> | undefined)?.url,
          imageUrl: (item.data as Record<string, string> | undefined)?.imageUrl,
          receivedAt: new Date(item.createdAt),
        })),
      ),
    [notifications],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const sendTestNotification = useCallback(async () => {
    if (!deviceId) return;

    try {
      const res = await fetch(`${API_URL}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      if (!res.ok) {
        throw new Error(`Greska pri test notifikaciji (${res.status})`);
      }

      setTimeout(() => {
        refresh();
      }, 900);
    } catch (error) {
      console.error(
        "Error sending test notification:",
        error instanceof Error ? error.message : error,
      );
    }
  }, [deviceId, refresh]);

  const handleOpenListing = useCallback(
    (notification: (typeof notifications)[0]) => {
      const url = (notification.data as Record<string, string> | undefined)?.url;
      if (!url) return;

      Linking.openURL(url)
        .then(() => markAsSeen(notification.id))
        .catch((err) => {
          console.error("Greska pri otvaranju URL-a:", err);
        });
    },
    [markAsSeen],
  );

  const handleNotificationDismiss = useCallback(
    (notificationId: string) => {
      dismissNotification(notificationId);
    },
    [dismissNotification],
  );

  if (deviceLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centerText}>Ucitavanje notifikacija...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bgStripeTop} />
      <View style={styles.bgStripeBottom} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>DIGITAL DREAMSCAPE</Text>
          <Text style={styles.h1}>Pocetna</Text>
        </View>
        <View style={styles.headerRight}>
          {notifications.length > 0 && (
            <Text style={styles.badge}>{notifications.length}</Text>
          )}
          {__DEV__ && (
            <Pressable onPress={sendTestNotification} style={styles.testBtn}>
              <Text style={styles.testBtnText}>TEST PUSH</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Kartica vise nije klikabilna. Koristi dugmad Obrisi i Idi na oglas.
        </Text>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(item) => item.date}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PALETTE.accent}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.dateSeparator}>{group.date}</Text>
            {chunkByTwo(group.data).map((row, rowIndex) => (
              <View key={`${group.date}-${rowIndex}`} style={styles.cardGridRow}>
                {row.map((notif) => (
                  <View key={notif.id} style={styles.cardCol}>
                    <View style={styles.card}>
                      {notif.imageUrl ? (
                        <Image source={{ uri: notif.imageUrl }} style={styles.cardImage} />
                      ) : (
                        <View style={styles.cardImageFallback}>
                          <Text style={styles.cardImageFallbackText}>BEZ SLIKE</Text>
                        </View>
                      )}

                      <View style={styles.cardTop}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {notif.title}
                        </Text>
                        <Text style={styles.cardTime}>{formatTime(notif.receivedAt)}</Text>
                      </View>
                      <Text style={styles.cardBody} numberOfLines={2}>
                        {notif.body}
                      </Text>

                      <View style={styles.cardButtonsRow}>
                        <Pressable
                          onPress={() => handleNotificationDismiss(notif.id)}
                          style={({ pressed }) => [
                            styles.dismissBtn,
                            pressed && styles.dismissBtnPressed,
                          ]}
                        >
                          <Text style={styles.dismissBtnText}>Obrisi</Text>
                        </Pressable>

                        <Pressable
                          disabled={!notif.url}
                          onPress={() => handleOpenListing(notif)}
                          style={({ pressed }) => [
                            styles.openBtn,
                            !notif.url && styles.openBtnDisabled,
                            pressed && notif.url && styles.dismissBtnPressed,
                          ]}
                        >
                          <Text style={styles.openBtnText}>Idi na oglas</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
                {row.length === 1 && <View style={styles.cardCol} />}
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Nema notifikacija</Text>
            <Text style={styles.emptyText}>
              Kada se pojavi oglas koji odgovara tvom alertu, prikazace se ovde.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const getShadow = (offset = 5) => ({
  shadowColor: "#000",
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 0.25,
  shadowRadius: 0,
  elevation: offset,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bg,
    paddingHorizontal: 14,
    paddingTop: 26,
  },
  centered: {
    flex: 1,
    backgroundColor: PALETTE.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    color: PALETTE.text,
    fontSize: 16,
    fontWeight: "800",
  },
  bgStripeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: PALETTE.accent,
  },
  bgStripeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: PALETTE.accent,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  kicker: {
    color: PALETTE.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  h1: {
    color: PALETTE.text,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  badge: {
    minWidth: 38,
    textAlign: "center",
    backgroundColor: PALETTE.white,
    color: PALETTE.ink,
    fontSize: 18,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 3,
    borderColor: PALETTE.line,
    borderRadius: 10,
    ...getShadow(4),
  },
  testBtn: {
    backgroundColor: PALETTE.slate,
    borderWidth: 2,
    borderColor: PALETTE.accent,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  testBtnText: {
    color: PALETTE.text,
    fontSize: 12,
    fontWeight: "900",
  },
  infoBox: {
    marginBottom: 8,
    backgroundColor: PALETTE.slate,
    borderWidth: 3,
    borderColor: PALETTE.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  infoText: {
    color: PALETTE.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  list: {
    paddingBottom: 24,
  },
  dateSeparator: {
    marginTop: 12,
    marginBottom: 6,
    color: PALETTE.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardGridRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  cardCol: {
    flex: 1,
  },
  card: {
    backgroundColor: PALETTE.paper,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 9,
    padding: 8,
    ...getShadow(2),
  },
  dismissBtn: {
    backgroundColor: PALETTE.red,
    borderWidth: 1,
    borderColor: PALETTE.redBorder,
    borderRadius: 7,
    minHeight: 32,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  dismissBtnPressed: {
    opacity: 0.82,
  },
  dismissBtnText: {
    color: PALETTE.ink,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  openBtn: {
    backgroundColor: PALETTE.greenSoft,
    borderWidth: 1,
    borderColor: PALETTE.greenBorder,
    borderRadius: 7,
    minHeight: 32,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  openBtnDisabled: {
    opacity: 0.45,
  },
  openBtnText: {
    color: PALETTE.ink,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  cardImage: {
    width: "100%",
    height: 95,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: PALETTE.line,
    marginBottom: 8,
    backgroundColor: PALETTE.white,
  },
  cardImageFallback: {
    width: "100%",
    height: 95,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: PALETTE.line,
    marginBottom: 8,
    backgroundColor: PALETTE.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cardImageFallbackText: {
    color: PALETTE.line,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
    marginTop: 2,
  },
  cardTitle: {
    flex: 1,
    color: PALETTE.line,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  cardTime: {
    color: PALETTE.line,
    fontSize: 12,
    fontWeight: "700",
  },
  cardBody: {
    color: PALETTE.line,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    minHeight: 32,
  },
  cardButtonsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  emptyBox: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 22,
    gap: 6,
  },
  emptyTitle: {
    color: PALETTE.text,
    fontSize: 22,
    fontWeight: "900",
  },
  emptyText: {
    color: PALETTE.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.84,
  },
});
