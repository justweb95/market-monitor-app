import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useDevice } from "@/hooks/useDevice";
import { useFavorites } from "@/hooks/useFavorites";
import { useNotifications } from "@/hooks/useNotifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterKey = "all" | "today" | "yesterday" | "older";

type NotifItem = {
  id: string;
  title: string;
  body: string;
  url?: string;
  imageUrl?: string;
  receivedAt: Date;
  sourceLabel: string;
  bucket: FilterKey;
  isPreview?: boolean;
  priceText?: string;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Sve" },
  { key: "today", label: "Danas" },
  { key: "yesterday", label: "Juce" },
  { key: "older", label: "Starije" },
];

const WEB_PREVIEW_CARD: NotifItem = {
  id: "preview-web-card",
  title: "[TEST] Audi A4 2.0 TDI 2018",
  body: "11.900 EUR | Beograd",
  url: "https://www.kupujemprodajem.com/",
  receivedAt: new Date(),
  sourceLabel: "KupujemProdajem",
  bucket: "today",
  isPreview: true,
  priceText: "11.900 EUR",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("sr-RS", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBucket(date: Date): FilterKey {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "today";
  if (date.toDateString() === yesterday.toDateString()) return "yesterday";
  return "older";
}

function getSourceLabel(url?: string): string {
  if (!url) return "Bez izvora";
  if (url.includes("kupujemprodajem")) return "KupujemProdajem";
  if (url.includes("polovniautomobili")) return "Polovni Automobili";
  if (url.includes("facebook")) return "Facebook";
  return "Spoljni oglas";
}

function getPriceText(body: string): string | undefined {
  const match = body.match(/(\d[\d.,\s]*\s*EUR|Cena nije navedena)/i);
  return match?.[1]?.trim();
}

function formatPriceLabel(priceText?: string): string | null {
  if (!priceText) return null;
  if (/cena nije navedena/i.test(priceText)) return priceText;
  return priceText.replace(/\s*EUR/i, " €");
}

function chunkItems<T>(items: T[], chunkSize: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    rows.push(items.slice(index, index + chunkSize));
  }
  return rows;
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { deviceId, loading: deviceLoading } = useDevice();
  const { profile, refresh: refreshProfile } = useAccountProfile(deviceId);
  const { notifications, dismissNotification, refresh } = useNotifications(deviceId);

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );
  const { isFavorite, toggleFavorite } = useFavorites();

  const feed = useMemo(() => {
    return notifications.map<NotifItem>((item) => {
      const data = (item.data as Partial<Record<string, string>> | undefined) ?? {};
      const receivedAt = new Date(item.createdAt);

      return {
        id: item.id,
        title: item.title,
        body: item.body,
        url: data.url,
        imageUrl: data.imageUrl,
        receivedAt,
        sourceLabel: getSourceLabel(data.url),
        bucket: getBucket(receivedAt),
        priceText: getPriceText(item.body),
      };
    });
  }, [notifications]);

  const visibleItems = useMemo(
    () => feed.filter((item) => activeFilter === "all" || item.bucket === activeFilter),
    [activeFilter, feed],
  );

  const displayItems = useMemo(() => {
    if (Platform.OS === "web" && visibleItems.length === 0) {
      return [WEB_PREVIEW_CARD];
    }
    return visibleItems;
  }, [visibleItems]);

  const displaySignalCount = profile?.signalCount ?? 0;
  const displaySignalLimit =
    profile?.alertLimit && profile.alertLimit > 0
      ? profile.alertLimit
      : profile?.user?.promoCodeUsed === "03081995"
        ? 5
        : 0;

  const columnCount = width > 380 ? 2 : 1;
  const listingRows = useMemo(() => chunkItems(displayItems, columnCount), [columnCount, displayItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleOpenListing = useCallback(
    (notification: Pick<NotifItem, "id" | "url">) => {
      if (!notification.url) return;

      Linking.openURL(notification.url)
        .catch((err) => {
          console.error("Greska pri otvaranju URL-a:", err);
        });
    },
    [],
  );

  const handleNotificationDismiss = useCallback(
    (notificationId: string) => {
      dismissNotification(notificationId);
      void removeFavorite(notificationId);
    },
    [dismissNotification, removeFavorite],
  );

  const renderListingCard = useCallback(
    (item: NotifItem) => (
      <View key={item.id} style={styles.featuredCard}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
        ) : (
          <LinearGradient
            colors={["#2A193E", "#1A1A1A", "#0C0C0C"]}
            style={styles.featuredFallback}
          >
            <Ionicons name="sparkles" size={30} color={NeoTheme.colors.lime} />
          </LinearGradient>
        )}

        <View style={styles.featuredOverlay}>
          {item.priceText ? (
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>{formatPriceLabel(item.priceText)}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => {
              void toggleFavorite({
                id: item.id,
                title: item.title,
                body: item.body,
                url: item.url,
                imageUrl: item.imageUrl,
                sourceLabel: item.sourceLabel,
                createdAt: item.receivedAt.toISOString(),
                priceText: item.priceText,
              });
            }}
            style={({ pressed }) => [styles.favoriteIconButton, pressed && styles.pressed]}
          >
            <Ionicons
              name={isFavorite(item.id) ? "heart" : "heart-outline"}
              size={18}
              color={NeoTheme.colors.lime}
            />
          </Pressable>

          <View style={styles.featuredInfoStack}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.featuredMetaRow}>
              <Text style={styles.featuredMeta}>{item.sourceLabel}</Text>
              <Text style={styles.featuredMeta}>{formatTime(item.receivedAt)}</Text>
            </View>
          </View>

          <View style={styles.featuredButtonRow}>
            <Pressable
              onPress={() => {
                handleNotificationDismiss(item.id);
              }}
              style={({ pressed }) => [
                styles.cutButton,
                styles.cutButtonDanger,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.cutout, styles.cutoutTopRight, styles.cutoutSolid]} />
              <View style={[styles.cutout, styles.cutoutBottomLeft, styles.cutoutSolid]} />
              <Text style={styles.cutButtonTextDanger}>Obrisi</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (item.url) handleOpenListing(item);
              }}
              style={({ pressed }) => [
                styles.cutButton,
                styles.cutButtonPrimary,
                pressed && item.url && styles.pressed,
              ]}
            >
              <View style={[styles.cutout, styles.cutoutTopLeft, styles.cutoutSolid]} />
              <View style={[styles.cutout, styles.cutoutBottomRight, styles.cutoutSolid]} />
              <Text style={styles.cutButtonTextPrimary}>Vidi oglas</Text>
            </Pressable>
          </View>
        </View>
      </View>
    ),
    [handleNotificationDismiss, handleOpenListing, isFavorite, toggleFavorite],
  );

  if (deviceLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centered}>
          <Text style={styles.centerText}>Ucitavanje signala...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader
          rightLabel="Profil"
          rightIcon="person-circle-outline"
          onRightPress={() => router.push("/profile")}
        />

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={NeoTheme.colors.lime}
            />
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#060606", "#141414", "#23290B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Kreiraj prvi signal.</Text>
                <Text style={styles.heroBody}>
                  Podesi kategoriju, naziv i cenu, a aplikacija prati oglase koje trazis i javlja cim se pojavi dobar rezultat.
                </Text>
                <Pressable
                  onPress={() => router.push("/alerts")}
                  style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
                >
                  <Text style={styles.heroButtonText}>Idi na signal</Text>
                  <Ionicons name="arrow-forward" size={16} color={NeoTheme.colors.black} />
                </Pressable>
              </View>

              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatLabel}>Aktivnih signala</Text>
                <Text style={styles.heroStatValue}>
                  {displaySignalCount}/{displaySignalLimit}
                </Text>
                <Text style={styles.heroStatFoot}>Kreni od jednog preciznog kriterijuma.</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.filterRow}>
            {FILTERS.map((filter) => {
              const focused = activeFilter === filter.key;
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  style={styles.filterItem}
                >
                  <Text style={[styles.filterText, focused && styles.filterTextActive]}>
                    {filter.label}
                  </Text>
                  <View style={[styles.filterUnderline, focused && styles.filterUnderlineActive]} />
                </Pressable>
              );
            })}
          </View>

          {listingRows.length > 0 ? (
            listingRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.gridRow}>
                {row.map((notif) => (
                  <View key={notif.id} style={styles.gridCol}>
                    {renderListingCard(notif)}
                  </View>
                ))}
                {columnCount === 2 && row.length === 1 ? <View style={styles.gridCol} /> : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyBoxCompact}>
              <Text style={styles.emptyText}>Izaberi drugi filter ili povuci za osvezavanje.</Text>
            </View>
          )}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NeoTheme.colors.background,
  },
  centerText: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.semiBold,
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroCard: {
    minHeight: 188,
    borderRadius: NeoTheme.radius.md,
    overflow: "hidden",
    marginBottom: 18,
    ...neoShadow,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 18,
    flex: 1,
  },
  heroCopy: {
    flex: 1,
    justifyContent: "space-between",
  },
  heroTitle: {
    color: NeoTheme.colors.lime,
    fontSize: 28,
    lineHeight: 30,
    fontFamily: NeoTheme.fonts.bold,
    maxWidth: 186,
  },
  heroBody: {
    color: NeoTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: NeoTheme.fonts.medium,
    maxWidth: 220,
    marginTop: 10,
  },
  heroButton: {
    height: 36,
    minWidth: 150,
    borderRadius: NeoTheme.radius.xs,
    backgroundColor: NeoTheme.colors.lime,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    marginTop: 18,
  },
  heroButtonDisabled: {
    opacity: 0.55,
  },
  heroButtonText: {
    color: NeoTheme.colors.black,
    fontSize: 13,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  heroStatCard: {
    width: 120,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: 14,
    justifyContent: "space-between",
  },
  heroStatLabel: {
    color: NeoTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: NeoTheme.fonts.medium,
  },
  heroStatValue: {
    color: NeoTheme.colors.lime,
    fontSize: 26,
    lineHeight: 30,
    fontFamily: NeoTheme.fonts.bold,
    marginTop: 12,
  },
  heroStatFoot: {
    color: NeoTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: NeoTheme.fonts.medium,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(145,145,145,0.45)",
  },
  filterItem: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
  },
  filterText: {
    color: NeoTheme.colors.text,
    opacity: 0.74,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.medium,
  },
  filterTextActive: {
    opacity: 1,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  filterUnderline: {
    width: 52,
    height: 2,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  filterUnderlineActive: {
    backgroundColor: NeoTheme.colors.lime,
  },
  featuredCard: {
    height: 268,
    borderRadius: NeoTheme.radius.xs,
    overflow: "hidden",
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    ...neoShadow,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredOverlay: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 4,
    height: "40%",
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#2a2a2a",
    justifyContent: "flex-end",
  },
  featuredInfoStack: {
    justifyContent: "flex-start",
    marginBottom: 6,
  },
  featuredTitle: {
    color: NeoTheme.colors.text,
    fontSize: 12,
    lineHeight: 15,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 8,
    marginTop: 4,
  },
  featuredMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
    flexWrap: "wrap",
  },
  featuredMeta: {
    color: NeoTheme.colors.text,
    fontSize: 11,
    fontFamily: NeoTheme.fonts.medium,
    textAlign: "right",
  },
  pricePill: {
    position: "absolute",
    top: -12,
    left: 4,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    zIndex: 2,
  },
  favoriteIconButton: {
    position: "absolute",
    top: -12,
    right: 4,
    padding: 4,
    zIndex: 3,
  },
  pricePillText: {
    color: NeoTheme.colors.lime,
    fontSize: 10,
    fontFamily: NeoTheme.fonts.bold,
  },
  featuredButtonRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    zIndex: 4,
  },
  cutButton: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
    zIndex: 5,
  },
  cutButtonPrimary: {
    flex: 1,
    backgroundColor: NeoTheme.colors.lime,
  },
  cutButtonDanger: {
    flex: 1,
    backgroundColor: "rgba(255, 49, 49, 1)",
  },
  cutout: {
    position: "absolute",
    width: 20,
    height: 20,
    transform: [{ rotate: "45deg" }],
  },
  cutoutTopLeft: {
    top: -10,
    left: -10,
  },
  cutoutTopRight: {
    top: -10,
    right: -10,
  },
  cutoutBottomLeft: {
    bottom: -10,
    left: -10,
  },
  cutoutBottomRight: {
    bottom: -10,
    right: -10,
  },
  cutoutSolid: {
    backgroundColor: "#2a2a2a",
  },
  cutButtonTextPrimary: {
    color: NeoTheme.colors.black,
    fontSize: 11,
    fontFamily: NeoTheme.fonts.bold,
  },
  cutButtonTextDanger: {
    color: NeoTheme.colors.text,
    fontSize: 11,
    fontFamily: NeoTheme.fonts.bold,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.4,
  },
  emptyBox: {
    minHeight: 180,
    backgroundColor: NeoTheme.colors.surface,
    borderRadius: NeoTheme.radius.md,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    gap: 8,
    marginTop: 10,
  },
  emptyBoxCompact: {
    borderRadius: NeoTheme.radius.md,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  emptyTitle: {
    color: NeoTheme.colors.text,
    fontSize: 22,
    fontFamily: NeoTheme.fonts.bold,
  },
  emptyText: {
    color: NeoTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: NeoTheme.fonts.medium,
  },
  pressed: {
    opacity: 0.84,
  },
});
