import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { useRouter } from "expo-router";
import React, { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PurchasesPackage } from "react-native-purchases";

type PlanOption = {
  tier: "BRONZE" | "SILVER" | "GOLD";
  label: string;
  price: string;
  alerts: number;
  pkg: PurchasesPackage | null;
};

const PLAN_ACCENT = NeoTheme.colors.planAccent;

type Props = {
  children: ReactNode;
  isLocked: boolean;
  trialDaysLeft: number;
  planOptions: PlanOption[];
  purchasing: boolean;
  purchaseError?: string | null;
  syncingEntitlement?: boolean;
  managementURL: string | null;
  onPurchase: (pkg: PurchasesPackage) => Promise<boolean>;
  onRestorePurchases: () => Promise<boolean>;
  onRedeemCode: (code: string) => Promise<void>;
  onRefreshProfile: () => void;
};

export function PaywallGate({
  children,
  isLocked,
  planOptions,
  purchasing,
  purchaseError = null,
  syncingEntitlement = false,
  managementURL,
  onPurchase,
  onRestorePurchases,
  onRedeemCode,
  onRefreshProfile,
}: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // The gate doesn't unmount when isLocked flips - it just stops rendering
  // its own JSX and renders children instead. Without this, a stale
  // "Kod aktiviran!" / "Kupovina je uspesno obnovljena" success message from
  // a previous unlock would still be sitting in state the next time the
  // trial/subscription lapses and the gate reappears.
  useEffect(() => {
    if (isLocked) {
      setCode("");
      setCodeError(null);
      setCodeSuccess(false);
      setCodeLoading(false);
      setRestoreError(null);
      setRestoreSuccess(null);
    }
  }, [isLocked]);

  if (!isLocked) return <>{children}</>;

  async function handleRedeem() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setCodeError(null);
    setCodeSuccess(false);
    setCodeLoading(true);
    try {
      await onRedeemCode(trimmed);
      setCodeSuccess(true);
      setCode("");
      onRefreshProfile();
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : "Nevazeci kod");
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleRestore() {
    setRestoreError(null);
    setRestoreSuccess(null);

    const ok = await onRestorePurchases();
    if (!ok) {
      setRestoreError("Obnova kupovine nije uspela.");
      return;
    }

    setRestoreSuccess("Kupovina je uspesno obnovljena.");
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🔒 Probni period istekao</Text>
        <Text style={styles.subtitle}>
          Odaberi plan i nastavi da koristis Lovca na Oglase.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mesecna pretplata</Text>
          <Text style={styles.noticeText}>Cena je prikazana po mesecu za svaki paket ispod.</Text>
          <Text style={styles.noticeText}>Pretplata se automatski obnavlja dok je ne otkazes.</Text>
          <Text style={styles.noticeText}>Otkazivanje radis kroz Google Play Subscriptions.</Text>
        </View>

        <View style={styles.planList}>
          {planOptions.map((plan) => {
            const accent = PLAN_ACCENT[plan.tier];
            return (
              <Pressable
                key={plan.tier}
                style={({ pressed }) => [
                  styles.planRow,
                  { borderColor: accent },
                  pressed && styles.pressed,
                ]}
                onPress={async () => {
                  if (!plan.pkg || purchasing || syncingEntitlement) return;
                  const ok = await onPurchase(plan.pkg);
                  if (ok) onRefreshProfile();
                }}
                disabled={purchasing || syncingEntitlement || !plan.pkg}
              >
                <View style={styles.planCopy}>
                  <Text style={[styles.planTier, { color: accent }]}>{plan.label}</Text>
                  <Text style={styles.planMeta}>{plan.alerts} aktivna signala</Text>
                </View>
                <View style={styles.planPrice}>
                  {purchasing ? (
                    <ActivityIndicator color={NeoTheme.colors.lime} />
                  ) : (
                    <>
                      <Text style={styles.planPriceText}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>/ mesec</Text>
                    </>
                  )}
                  {!plan.pkg && <Text style={styles.planUnavailable}>Trenutno nije dostupno</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.purchaseHint}>
          Kupovinu potvrdjujes u sledecem koraku, pre nego sto Google Play naplata pocne.
        </Text>
        {purchaseError ? <Text style={styles.inlineError}>{purchaseError}</Text> : null}

        {syncingEntitlement && (
          <View style={styles.syncingRow}>
            <ActivityIndicator color={NeoTheme.colors.lime} size="small" />
            <Text style={styles.syncingText}>Proveravamo aktivaciju premijuma...</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Promo / Drugarski kod</Text>
          <View style={styles.codeRow}>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              placeholder="Unesi kod"
              placeholderTextColor={NeoTheme.colors.textDim}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Pressable
              style={({ pressed }) => [styles.codeBtn, pressed && styles.pressed, codeLoading && styles.disabled]}
              onPress={handleRedeem}
              disabled={codeLoading || !code.trim()}
            >
              {codeLoading ? (
                <ActivityIndicator color={NeoTheme.colors.black} size="small" />
              ) : (
                <Text style={styles.codeBtnText}>Aktiviraj</Text>
              )}
            </Pressable>
          </View>
          {codeError ? <Text style={styles.inlineError}>{codeError}</Text> : null}
          {codeSuccess ? <Text style={styles.inlineSuccess}>Kod aktiviran!</Text> : null}
        </View>

        <Pressable style={styles.linkBtn} onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.linkBtnText}>Vrati kupovinu</Text>
        </Pressable>
        {restoreError ? <Text style={styles.inlineError}>{restoreError}</Text> : null}
        {restoreSuccess ? <Text style={styles.inlineSuccess}>{restoreSuccess}</Text> : null}

        {managementURL && (
          <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(managementURL)}>
            <Text style={styles.linkBtnText}>Pauziraj automatsko obnavljanje</Text>
          </Pressable>
        )}

        <Pressable style={styles.profileBtn} onPress={() => router.push("/profile")}>
          <Text style={styles.profileBtnText}>Idi na profil →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontFamily: NeoTheme.fonts.bold,
    color: NeoTheme.colors.text,
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
    textAlign: "center",
    marginBottom: 6,
  },
  card: {
    borderRadius: 16,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: 14,
    gap: 6,
    ...neoShadow,
  },
  cardTitle: {
    color: NeoTheme.colors.text,
    fontSize: 15,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
    lineHeight: 18,
  },
  planList: {
    gap: 8,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 14,
  },
  pressed: {
    opacity: 0.75,
  },
  planCopy: {
    gap: 4,
  },
  planTier: {
    fontSize: 16,
    fontFamily: NeoTheme.fonts.bold,
  },
  planMeta: {
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
  },
  planPrice: {
    alignItems: "flex-end",
    gap: 2,
  },
  planPriceText: {
    fontSize: 16,
    fontFamily: NeoTheme.fonts.bold,
    color: NeoTheme.colors.lime,
  },
  planPeriod: {
    fontSize: 11,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
  },
  planUnavailable: {
    fontSize: 11,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textDim,
  },
  purchaseHint: {
    fontSize: 11,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textDim,
    textAlign: "center",
    lineHeight: 16,
    marginTop: -6,
  },
  syncingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  syncingText: {
    fontSize: 13,
    fontFamily: NeoTheme.fonts.semiBold,
    color: NeoTheme.colors.lime,
  },
  codeRow: {
    flexDirection: "row",
    gap: 8,
  },
  codeInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.text,
  },
  codeBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: NeoTheme.colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  codeBtnText: {
    color: NeoTheme.colors.black,
    fontSize: 14,
    fontFamily: NeoTheme.fonts.bold,
  },
  disabled: {
    opacity: 0.5,
  },
  inlineError: {
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.danger,
  },
  inlineSuccess: {
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.lime,
  },
  linkBtn: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkBtnText: {
    fontSize: 13,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
    textDecorationLine: "underline",
  },
  profileBtn: {
    alignSelf: "center",
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: NeoTheme.colors.lime,
  },
  profileBtnText: {
    fontSize: 14,
    fontFamily: NeoTheme.fonts.semiBold,
    color: NeoTheme.colors.lime,
  },
});
