import { AppHeader } from "@/components/app-header";
import { CutCard } from "@/components/cut-card";
import { NeoTheme } from "@/constants/neo-theme";
import { hasDrugarskiPlan } from "@/constants/promo";
import {
  PAID_TIERS,
  TIER_PRODUCT_ID,
  findPackageForTier,
  priceLabelForTier,
  type PaidTier,
} from "@/constants/plans";
import { rf, rs } from "@/constants/responsive";
import { useDevice } from "@/contexts/DeviceContext";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useSubscription } from "@/hooks/useSubscription";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PurchasesSubscriptionInfo } from "react-native-purchases";

const TIER_LABEL: Record<PaidTier, string> = {
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
};

type PurchaseEntry = {
  key: string;
  label: string;
  accent: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  statusLabel: string;
  statusColor: string;
  priceLabel: string | null;
  purchasedLabel: string;
  expiryLabel: string | null;
  sortAt: number;
};

/** RevenueCat na Androidu ume da vrati "market_monitor_gold_monthly:gold-monthly" - ovde nas zanima samo deo pre ":". */
function baseProductId(identifier: string): string {
  return identifier.split(":")[0];
}

function findSubscriptionInfoForTier(
  byProductId: Record<string, PurchasesSubscriptionInfo> | undefined,
  tier: PaidTier,
): PurchasesSubscriptionInfo | null {
  const wanted = TIER_PRODUCT_ID[tier];
  const entries = Object.entries(byProductId ?? {});
  const match = entries.find(([productId]) => baseProductId(productId) === wanted);
  return match ? match[1] : null;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("sr-RS");
}

export default function PurchaseHistoryScreen() {
  const router = useRouter();
  const { deviceId, loading: deviceLoading } = useDevice();
  const { profile, loading: profileLoading } = useAccountProfile(deviceId);
  const { offerings, customerInfo, loading: subscriptionLoading } = useSubscription(
    profile?.user?.id,
  );

  const isDrugarskiActive = hasDrugarskiPlan(profile?.user?.promoCodeUsed);

  const entries = useMemo<PurchaseEntry[]>(() => {
    const list: PurchaseEntry[] = [];

    for (const tier of PAID_TIERS) {
      const info = findSubscriptionInfoForTier(customerInfo?.subscriptionsByProductIdentifier, tier);
      if (!info) continue;

      const purchasedLabel = formatDate(info.purchaseDate) ?? "-";
      const expiryLabel = formatDate(info.expiresDate);
      const pkg = findPackageForTier(offerings, tier);

      let statusLabel = "Isteklo";
      let statusColor: string = NeoTheme.colors.textDim;
      if (info.refundedAt) {
        statusLabel = "Refundirano";
        statusColor = NeoTheme.colors.danger;
      } else if (info.isActive && info.willRenew) {
        statusLabel = "Aktivno";
        statusColor = NeoTheme.colors.lime;
      } else if (info.isActive && !info.willRenew) {
        statusLabel = "Aktivno do isteka";
        statusColor = "#F6A623";
      }

      list.push({
        key: `sub-${tier}`,
        label: TIER_LABEL[tier],
        accent: NeoTheme.colors.planAccent[tier],
        icon: tier === "BRONZE" ? "shield-half-outline" : tier === "SILVER" ? "diamond-outline" : "medal-outline",
        statusLabel,
        statusColor,
        priceLabel: priceLabelForTier(pkg, tier),
        purchasedLabel,
        expiryLabel,
        sortAt: new Date(info.purchaseDate).getTime() || 0,
      });
    }

    if (hasDrugarskiPlan(profile?.user?.promoCodeUsed)) {
      const redeemedAt = profile?.user?.promoRedeemedAt ?? null;
      const purchasedLabel = formatDate(redeemedAt) ?? "-";
      list.push({
        key: "drugarski",
        label: "Drugarski plan",
        accent: "rgba(215, 242, 13, 1)",
        icon: "gift-outline",
        statusLabel: "Aktivno",
        statusColor: NeoTheme.colors.lime,
        priceLabel: null,
        purchasedLabel,
        expiryLabel: null,
        sortAt: redeemedAt ? new Date(redeemedAt).getTime() : Date.now(),
      });
    }

    return list.sort((a, b) => b.sortAt - a.sortAt);
  }, [customerInfo, offerings, profile?.user?.promoCodeUsed, profile?.user?.promoRedeemedAt]);

  const loading = deviceLoading || profileLoading || (Platform.OS !== "web" && subscriptionLoading);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Istorija kupovina" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={NeoTheme.colors.lime} size="large" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {entries.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.iconBadge}>
                  <Ionicons name="receipt-outline" size={22} color={NeoTheme.colors.textMuted} />
                </View>
                <Text style={styles.emptyText}>
                  {isDrugarskiActive
                    ? "Ovde ce se prikazati tvoja istorija kupovina."
                    : "Jos nema kupovina. Kad kupis plan, ovde ces videti istoriju."}
                </Text>
              </View>
            ) : (
              entries.map((entry) => (
                <CutCard key={entry.key} notch={rs(10)} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleRow}>
                      <Ionicons name={entry.icon} size={18} color={entry.accent} />
                      <Text style={[styles.entryLabel, { color: entry.accent }]}>{entry.label}</Text>
                    </View>
                    <Text style={[styles.statusPill, { color: entry.statusColor }]}>{entry.statusLabel}</Text>
                  </View>

                  <View style={styles.entryMetaRow}>
                    <Text style={styles.entryMeta}>Kupljeno: {entry.purchasedLabel}</Text>
                    {entry.expiryLabel ? (
                      <Text style={styles.entryMeta}>
                        {entry.statusLabel === "Aktivno" ? "Obnavlja se" : "Isteklo"}: {entry.expiryLabel}
                      </Text>
                    ) : null}
                  </View>

                  {entry.priceLabel ? (
                    <Text style={styles.entryPrice}>{entry.priceLabel} / mesecno</Text>
                  ) : null}
                </CutCard>
              ))
            )}

            {Platform.OS === "web" && (
              <Text style={styles.webNote}>
                Istorija kupovina je dostupna samo u mobilnoj aplikaciji.
              </Text>
            )}
          </ScrollView>
        )}
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
    paddingHorizontal: rs(24),
    paddingTop: rs(10),
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: rs(36),
    gap: rs(12),
  },
  emptyCard: {
    borderRadius: rs(20),
    backgroundColor: NeoTheme.colors.surfaceSolid,
    paddingVertical: rs(44),
    paddingHorizontal: rs(24),
    alignItems: "center",
    gap: rs(14),
  },
  iconBadge: {
    width: rs(52),
    height: rs(52),
    borderRadius: rs(14),
    backgroundColor: NeoTheme.colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.medium,
    textAlign: "center",
  },
  entryCard: {
    padding: rs(16),
    gap: rs(8),
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  entryLabel: {
    fontFamily: NeoTheme.fonts.bold,
    fontSize: rf(16),
  },
  statusPill: {
    fontFamily: NeoTheme.fonts.bold,
    fontSize: rf(11),
  },
  entryMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(14),
  },
  entryMeta: {
    color: NeoTheme.colors.textMuted,
    fontFamily: NeoTheme.fonts.medium,
    fontSize: rf(12),
  },
  entryPrice: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.semiBold,
    fontSize: rf(13),
  },
  webNote: {
    color: NeoTheme.colors.textDim,
    fontFamily: NeoTheme.fonts.medium,
    fontSize: rf(12),
    textAlign: "center",
    marginTop: rs(8),
  },
});
