import { AppHeader } from "@/components/app-header";
import { confirmSubscriptionDisclosure } from "@/constants/subscription-disclosure";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import type { PlanTier } from "@/hooks/useAccountProfile";
import { useDevice } from "@/contexts/DeviceContext";
import { useSubscription } from "@/hooks/useSubscription";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PlanCard = {
  id: "DRUGARSKI" | "BRONZE" | "SILVER" | "GOLD";
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  description: string;
  alerts: number;
  rightLabel: string;
  priceEur?: number;
};

const PLAY_STORE_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions?package=com.paki_dev.marketmonitorapp";

const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: "Nijedan",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
};

const PLANS: PlanCard[] = [
  {
    id: "DRUGARSKI",
    title: "Drugarski",
    icon: "gift-outline",
    accent: "rgba(215, 242, 13, 1)",
    description: "Drugarski plan se aktivira unosom koda.",
    alerts: 5,
    rightLabel: "Code aktivacija",
  },
  {
    id: "BRONZE",
    title: "Bronze",
    icon: "shield-half-outline",
    accent: "#CD7F32",
    description: "Bronzani tier vam dozvoljava 3 aktivna signala.",
    alerts: 3,
    rightLabel: "10€",
    priceEur: 10,
  },
  {
    id: "SILVER",
    title: "Silver",
    icon: "diamond-outline",
    accent: "#BFC5CE",
    description: "Silver tier vam dozvoljava 6 aktivnih signala.",
    alerts: 6,
    rightLabel: "15€",
    priceEur: 15,
  },
  {
    id: "GOLD",
    title: "Gold",
    icon: "medal-outline",
    accent: "#F0C419",
    description: "Gold tier vam dozvoljava 10 aktivnih signala.",
    alerts: 10,
    rightLabel: "20€",
    priceEur: 20,
  },
];

export default function PlanScreen() {
  const router = useRouter();
  const { deviceId, loading: deviceLoading } = useDevice();
  const { profile, loading, redeemBronzeCode, cancelDrugarskiCode, refresh: refreshProfile } = useAccountProfile(deviceId);
  const { offerings, purchasing, purchasePackage, error: purchaseError, getManagementURL } = useSubscription(profile?.user?.id);

  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCard["id"]>("DRUGARSKI");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cancellingDrugarski, setCancellingDrugarski] = useState(false);
  const managementUrl = getManagementURL();

  const wait = (ms: number) => new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });

  const refreshEntitlementState = async () => {
    let latest = await refreshProfile();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (latest && !latest.isLocked) {
        return latest;
      }

      await wait(1200);
      latest = await refreshProfile();
    }

    return latest;
  };

  const isDrugarskiActive = useMemo(
    () => profile?.user?.promoCodeUsed === "03081995",
    [profile?.user?.promoCodeUsed],
  );

  const hasCancelledAccess = useMemo(() => {
    if (profile?.subscription?.status !== "CANCELLED" || !profile.subscription?.renewsAt) {
      return false;
    }

    return new Date(profile.subscription.renewsAt).getTime() > Date.now();
  }, [profile?.subscription?.renewsAt, profile?.subscription?.status]);

  const periodStatus = useMemo(() => {
    if (isDrugarskiActive) {
      return { label: "∞", style: styles.periodFriend };
    }

    if (profile?.subscription?.status === "PAUSED") {
      return { label: "PAUZIRANO", style: styles.periodPaused };
    }

    if (profile?.subscription?.status === "ACTIVE" || hasCancelledAccess) {
      if (profile?.subscription?.renewsAt) {
        const renewAt = new Date(profile.subscription.renewsAt).getTime();
        const daysLeft = Math.max(0, Math.ceil((renewAt - Date.now()) / (24 * 60 * 60 * 1000)));
        return { label: `${daysLeft} dana`, style: styles.periodPaid };
      }
      return { label: "AKTIVNO", style: styles.periodPaid };
    }

    if (profile?.trialActive) {
      const daysLeft = Math.max(0, profile?.trialDaysLeft ?? 0);
      return { label: `${daysLeft} dana`, style: styles.periodTrial };
    }

    return { label: "ISTEKLO", style: styles.periodPaused };
  }, [
    hasCancelledAccess,
    isDrugarskiActive,
    profile?.subscription?.renewsAt,
    profile?.subscription?.status,
    profile?.trialActive,
    profile?.trialDaysLeft,
  ]);

  const tierText = useMemo(() => {
    if (isDrugarskiActive) return "Drugarski";
    if (profile?.subscription?.status === "ACTIVE" || profile?.subscription?.status === "PAUSED" || hasCancelledAccess) {
      const currentTier = profile?.planTier ?? "FREE";
      return PLAN_LABELS[currentTier];
    }
    if (profile?.trialActive) return "Trial";
    if (profile?.subscription?.status === "EXPIRED") return "Isteklo";
    const currentTier = profile?.planTier ?? "FREE";
    return PLAN_LABELS[currentTier];
  }, [hasCancelledAccess, isDrugarskiActive, profile?.planTier, profile?.subscription?.status, profile?.trialActive]);

  const maxSignalsLabel = useMemo(() => {
    return String(profile?.alertLimit ?? 0);
  }, [profile?.alertLimit]);

  const activePlan = useMemo(() => {
    return PLANS.find((plan) => plan.id === selectedPlan) ?? PLANS[0];
  }, [selectedPlan]);

  const activePkg = useMemo(() => {
    if (activePlan.id === "DRUGARSKI") return null;
    return offerings?.availablePackages.find((p) => {
      const id = p.identifier.toLowerCase();
      return (
        (activePlan.id === "BRONZE" && id.includes("bronze")) ||
        (activePlan.id === "SILVER" && id.includes("silver")) ||
        (activePlan.id === "GOLD" && id.includes("gold"))
      );
    }) ?? null;
  }, [activePlan.id, offerings]);

  const canManageSubscription =
    !isDrugarskiActive &&
    (profile?.subscription?.status === "ACTIVE" || profile?.subscription?.status === "PAUSED" || hasCancelledAccess);

  const onRedeem = async () => {
    setPromoError(null);
    setPromoSuccess(null);

    if (!code.trim()) {
      setPromoError("Unesi promo kod.");
      return;
    }

    setSaving(true);
    try {
      await redeemBronzeCode(code.trim().toUpperCase());
      setPromoSuccess("Drugarski plan je aktiviran!");
      setCode("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPromoError(message);
    } finally {
      setSaving(false);
    }
  };

  const onCancelDrugarski = () => {
    Alert.alert(
      "Prekid drugarski plana",
      "Da li sigurno zelis da prekines drugarski plan? Ponovo ces moci da ga aktiviras unosom koda.",
      [
        { text: "Otkazi", style: "cancel" },
        {
          text: "Prekini",
          style: "destructive",
          onPress: async () => {
            setCancellingDrugarski(true);
            setPromoError(null);
            setPromoSuccess(null);
            try {
              await cancelDrugarskiCode();
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              setPromoError(message);
            } finally {
              setCancellingDrugarski(false);
            }
          },
        },
      ],
    );
  };

  if (deviceLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={NeoTheme.colors.lime} size="large" />
          <Text style={styles.loaderText}>Ucitavanje profila...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Moj plan" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Plan: {tierText}</Text>
            <Text style={styles.summaryText}>
              Signali: {profile?.signalCount ?? 0}/{maxSignalsLabel}
            </Text>
            {periodStatus ? (
              <Text style={[styles.summaryTextTrial, periodStatus.style]}>
                {periodStatus.label}
              </Text>
            ) : null}
          </View>

          {!profile?.trialActive && (profile?.subscription?.status === "ACTIVE" || profile?.subscription?.status === "PAUSED" || hasCancelledAccess) && (
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionText}>
                {profile?.subscription?.status === "PAUSED"
                  ? "Pretplata je pauzirana. Automatska naplata je iskljucena."
                  : profile?.subscription?.status === "CANCELLED"
                    ? `Pretplata je otkazana i ostaje aktivna do: ${
                        profile?.subscription?.renewsAt
                          ? new Date(profile.subscription.renewsAt).toLocaleDateString("sr-RS")
                          : "-"
                      }`
                  : `Pretplata aktivna do: ${
                      profile?.subscription?.renewsAt
                        ? new Date(profile.subscription.renewsAt).toLocaleDateString("sr-RS")
                        : "-"
                    }`}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <Pressable
              onPress={() => setShowChangePlan((prev) => !prev)}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            >
              <Text style={styles.actionText}>Promeni plan</Text>
              <Ionicons
                name={showChangePlan ? "chevron-up" : "chevron-down"}
                size={18}
                color={NeoTheme.colors.textMuted}
              />
            </Pressable>

            {canManageSubscription ? (
              <Pressable
                style={({ pressed }) => [styles.actionRow, styles.actionRowBorder, pressed && styles.pressed]}
                onPress={() => Linking.openURL(managementUrl ?? PLAY_STORE_SUBSCRIPTIONS_URL)}
              >
                <Text style={[styles.actionText, styles.dangerText]}>
                  {profile?.subscription?.status === "PAUSED"
                    ? "Nastavi placanje"
                    : profile?.subscription?.status === "CANCELLED"
                      ? "Pretplata aktivna do isteka"
                      : "Otkaži pretplatu"}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={NeoTheme.colors.danger} />
              </Pressable>
            ) : null}
          </View>

          {showChangePlan ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Planovi</Text>
              <Text style={styles.planIntro}>Planovi prate landing cene i broj signala. Drugarski plan koristi unos koda.</Text>

              <View style={styles.planList}>
                {PLANS.map((plan) => {
                  const isActivePlan =
                    plan.id === "DRUGARSKI"
                      ? isDrugarskiActive
                      : !isDrugarskiActive && profile?.planTier === plan.id;
                  return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={({ pressed }) => [
                      styles.planRow,
                      { borderColor: plan.accent },
                      selectedPlan === plan.id && { backgroundColor: "rgba(255,255,255,0.08)" },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name={plan.icon} size={18} color={plan.accent} />
                    <View style={styles.planCopy}>
                      <Text style={[styles.planTier, { color: plan.accent }]}>{plan.title}</Text>
                      <Text style={styles.planMeta}>{`${plan.alerts} signala`}</Text>
                    </View>
                    {isActivePlan ? (
                      <Text style={styles.planActive}>Aktivno</Text>
                    ) : (
                      <Text style={styles.planSoon}>{plan.rightLabel}</Text>
                    )}
                  </Pressable>
                  );
                })}
              </View>

              <View style={[styles.planDetailCard, { borderColor: activePlan.accent }]}>
                <View style={styles.planDetailHeader}>
                  <Ionicons name={activePlan.icon} size={20} color={activePlan.accent} />
                  <Text style={[styles.planDetailTitle, { color: activePlan.accent }]}>{activePlan.title}</Text>
                </View>
                <Text style={styles.planDetailText}>{activePlan.description}</Text>

                {activePlan.id === "DRUGARSKI" ? (
                  isDrugarskiActive ? (
                    <>
                      <Pressable
                        onPress={onCancelDrugarski}
                        disabled={cancellingDrugarski}
                        style={({ pressed }) => [
                          styles.freeBtn,
                          styles.dangerBtn,
                          pressed && styles.pressed,
                          cancellingDrugarski && styles.disabled,
                        ]}
                      >
                        {cancellingDrugarski ? (
                          <ActivityIndicator color={NeoTheme.colors.danger} />
                        ) : (
                          <Text style={[styles.freeBtnText, styles.dangerText]}>Prekini drugarski plan</Text>
                        )}
                      </Pressable>
                      {promoError ? <Text style={styles.inlineError}>{promoError}</Text> : null}
                      {promoSuccess ? <Text style={styles.inlineSuccess}>{promoSuccess}</Text> : null}
                    </>
                  ) : (
                    <>
                      <TextInput
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="characters"
                        style={styles.input}
                        placeholder="Unesi code"
                        placeholderTextColor={NeoTheme.colors.textDim}
                      />
                      <Pressable onPress={onRedeem} disabled={saving} style={({ pressed }) => [styles.freeBtn, pressed && styles.pressed, saving && styles.disabled]}>
                        <Text style={styles.freeBtnText}>Unesi code</Text>
                      </Pressable>
                      {promoError ? <Text style={styles.inlineError}>{promoError}</Text> : null}
                      {promoSuccess ? <Text style={styles.inlineSuccess}>{promoSuccess}</Text> : null}
                    </>
                  )
                ) : (
                  <>
                    {!isDrugarskiActive &&
                    profile?.planTier === activePlan.id &&
                    canManageSubscription ? (
                      <Pressable
                        style={({ pressed }) => [styles.buyBtn, pressed && styles.pressed]}
                        onPress={() => Linking.openURL(managementUrl ?? PLAY_STORE_SUBSCRIPTIONS_URL)}
                      >
                        <Text style={styles.buyBtnText}>
                          {profile?.subscription?.status === "PAUSED"
                            ? "Nastavi placanje"
                            : profile?.subscription?.status === "CANCELLED"
                              ? "Pretplata aktivna do isteka"
                            : "Zaustavi placanje"}
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [styles.buyBtn, pressed && styles.pressed, (purchasing || syncing) && styles.disabled]}
                        onPress={async () => {
                          if (!activePkg) return;

                          if (!profile?.user?.id) {
                            Alert.alert(
                              "Nalog je potreban",
                              "Pre kupovine pretplate, prvo napravi nalog (ime, email, lozinka) - inace placanje nece biti povezano sa tvojim nalogom.",
                              [
                                { text: "Kasnije", style: "cancel" },
                                { text: "Napravi nalog", onPress: () => router.push("/profile/user-info") },
                              ],
                            );
                            return;
                          }

                          const confirmed = await confirmSubscriptionDisclosure();
                          if (!confirmed) return;

                          const ok = await purchasePackage(activePkg);
                          if (ok) {
                            setSyncing(true);
                            try {
                              await refreshEntitlementState();
                            } finally {
                              setSyncing(false);
                            }
                          } else if (purchaseError) {
                            Alert.alert("Kupovina nije uspela", purchaseError);
                          }
                        }}
                        disabled={purchasing || syncing || !activePkg}
                      >
                        {purchasing || syncing ? (
                          <ActivityIndicator color={NeoTheme.colors.black} />
                        ) : (
                          <Text style={styles.buyBtnText}>
                            Kupi {activePkg?.product.priceString ?? (activePlan.priceEur ? `${activePlan.priceEur}€` : "")}
                          </Text>
                        )}
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            </View>
          ) : null}
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
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderText: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  content: {
    paddingBottom: 36,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryText: {
    color: NeoTheme.colors.lime,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  summaryTextTrial: {
    fontSize: 10,
    fontFamily: NeoTheme.fonts.bold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    textAlign: "center",
    minWidth: 74,
  },
  periodTrial: {
    color: "#F6A623",
    backgroundColor: "rgba(246, 166, 35, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(246, 166, 35, 0.45)",
  },
  periodFriend: {
    color: "#3DDC97",
    backgroundColor: "rgba(61, 220, 151, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(61, 220, 151, 0.45)",
  },
  periodPaid: {
    color: "#4DA3FF",
    backgroundColor: "rgba(77, 163, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(77, 163, 255, 0.45)",
  },
  periodPaused: {
    color: "#FF7A59",
    backgroundColor: "rgba(255, 122, 89, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 122, 89, 0.45)",
  },
  subscriptionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "rgba(215, 242, 13, 0.08)",
    borderRadius: 10,
  },
  subscriptionText: {
    flex: 1,
    color: NeoTheme.colors.lime,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
  },
  card: {
    borderRadius: 16,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: 14,
    ...neoShadow,
  },
  cardTitle: {
    color: NeoTheme.colors.text,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  actionRowBorder: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NeoTheme.colors.border,
  },
  actionText: {
    color: NeoTheme.colors.text,
    fontSize: 15,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  dangerText: {
    color: NeoTheme.colors.danger,
  },
  planIntro: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: 10,
  },
  planList: {
    gap: 8,
  },
  planRow: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planCopy: {
    flex: 1,
  },
  planTier: {
    fontFamily: NeoTheme.fonts.semiBold,
    fontSize: 14,
  },
  planMeta: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  planSoon: {
    color: NeoTheme.colors.textMuted,
    fontFamily: NeoTheme.fonts.medium,
    fontSize: 12,
  },
  planActive: {
    color: NeoTheme.colors.lime,
    fontFamily: NeoTheme.fonts.bold,
    fontSize: 11,
  },
  planDetailCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
  },
  planDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  planDetailTitle: {
    fontFamily: NeoTheme.fonts.bold,
    fontSize: 18,
  },
  planDetailText: {
    color: NeoTheme.colors.textMuted,
    fontFamily: NeoTheme.fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: NeoTheme.colors.text,
    paddingHorizontal: 12,
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: 8,
  },
  freeBtn: {
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(215, 242, 13, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(215, 242, 13, 0.7)",
  },
  freeBtnText: {
    color: "rgba(215, 242, 13, 1)",
    fontFamily: NeoTheme.fonts.semiBold,
    fontSize: 13,
  },
  dangerBtn: {
    backgroundColor: "rgba(255, 49, 49, 0.12)",
    borderColor: NeoTheme.colors.danger,
  },
  buyBtn: {
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NeoTheme.colors.lime,
  },
  buyBtnText: {
    color: NeoTheme.colors.black,
    fontFamily: NeoTheme.fonts.semiBold,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.84,
  },
  inlineError: {
    color: NeoTheme.colors.danger,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.regular,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  inlineSuccess: {
    color: NeoTheme.colors.lime,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.semiBold,
    marginTop: 6,
    paddingHorizontal: 2,
  },
});
