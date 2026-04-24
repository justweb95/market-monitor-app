import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import type { PlanTier } from "@/hooks/useAccountProfile";
import { useDevice } from "@/hooks/useDevice";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: "Zakljucan",
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
    description: "Bronzani tir vam dozvoljava 3 aktivna Signala.",
    alerts: 3,
    rightLabel: "10 €",
    priceEur: 10,
  },
  {
    id: "SILVER",
    title: "Silver",
    icon: "diamond-outline",
    accent: "#BFC5CE",
    description: "Silver tir vam dozvoljava 6 aktivnih Signala.",
    alerts: 6,
    rightLabel: "15 €",
    priceEur: 15,
  },
  {
    id: "GOLD",
    title: "Gold",
    icon: "medal-outline",
    accent: "#F0C419",
    description: "Gold tir vam dozvoljava 10 aktivnih Signala.",
    alerts: 10,
    rightLabel: "20 €",
    priceEur: 20,
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { deviceId, linkAccountToDevice, loading: deviceLoading } = useDevice();
  const { profile, loading, updateProfile, redeemBronzeCode } = useAccountProfile(deviceId);

  const [firstName, setFirstName] = useState(profile?.user?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.user?.lastName ?? "");
  const [email, setEmail] = useState(profile?.user?.email ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCard["id"]>("DRUGARSKI");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.user) return;
    setFirstName(profile.user.firstName);
    setLastName(profile.user.lastName);
    setEmail(profile.user.email);
  }, [profile?.user]);

  const isDrugarskiActive = useMemo(
    () => profile?.user?.promoCodeUsed === "03081995",
    [profile?.user?.promoCodeUsed],
  );

  const tierText = useMemo(() => {
    const currentTier = profile?.planTier ?? "FREE";
    if (isDrugarskiActive) return "Drugarski";
    return PLAN_LABELS[currentTier];
  }, [isDrugarskiActive, profile?.planTier]);

  const activePlan = useMemo(() => {
    return PLANS.find((plan) => plan.id === selectedPlan) ?? PLANS[0];
  }, [selectedPlan]);

  const onSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    if (!deviceId) {
      setSaveError("Uredjaj jos nije registrovan.");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setSaveError("Ime, prezime i email su obavezni.");
      return;
    }

    if (!profile?.user && !password.trim()) {
      setSaveError("Za prvo povezivanje naloga potreban je password.");
      return;
    }

    setSaving(true);
    try {
      if (!profile?.user) {
        await linkAccountToDevice({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
      }

      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        ...(password.trim() ? { password } : {}),
      });

      setSaveSuccess("Profil je uspesno azuriran.");
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

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
        <AppHeader rightLabel="Profil" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Plan: {tierText}</Text>
            <Text style={styles.summaryText}>
              Signali: {profile?.signalCount ?? 0}/{isDrugarskiActive ? 5 : (profile?.alertLimit ?? 0)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Korisnicki podaci</Text>
            <Text style={styles.label}>Ime</Text>
            <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholder="Ime" placeholderTextColor={NeoTheme.colors.textDim} />
            <Text style={styles.label}>Prezime</Text>
            <TextInput value={lastName} onChangeText={setLastName} style={styles.input} placeholder="Prezime" placeholderTextColor={NeoTheme.colors.textDim} />
            <Text style={styles.label}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} placeholder="Email" placeholderTextColor={NeoTheme.colors.textDim} />
            <Text style={styles.label}>Password</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholder="Password" placeholderTextColor={NeoTheme.colors.textDim} />
            <Pressable onPress={onSave} disabled={saving} style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, saving && styles.disabled]}>
              <Text style={styles.saveBtnText}>{saving ? "Cuvam..." : "Sacuvaj profil"}</Text>
            </Pressable>
            {saveError ? <Text style={styles.inlineError}>{saveError}</Text> : null}
            {saveSuccess ? <Text style={styles.inlineSuccess}>{saveSuccess}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Planovi</Text>
            <Text style={styles.planIntro}>Planovi su vidljivi korisnicima unapred, a kupovina dolazi uskoro. Drugarski plan koristi unos koda.</Text>

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
                    <Text style={styles.planMeta}>{plan.alerts} signala</Text>
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
              ) : (
                <View style={styles.buyBtnBlurred}>
                  <Text style={styles.buyBtnBlurredText}>Kupi {activePlan.priceEur ? `(${activePlan.priceEur} €)` : ""}</Text>
                </View>
              )}
            </View>
          </View>
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
  label: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: 6,
    marginTop: 8,
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
  saveBtn: {
    marginTop: 6,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NeoTheme.colors.lime,
  },
  saveBtnText: {
    color: NeoTheme.colors.black,
    fontFamily: NeoTheme.fonts.bold,
    fontSize: 14,
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
  buyBtnBlurred: {
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    opacity: 0.48,
  },
  buyBtnBlurredText: {
    color: NeoTheme.colors.text,
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
