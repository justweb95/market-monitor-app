import { Colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ReactNode,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";

type PlanOption = {
  tier: "BRONZE" | "SILVER" | "GOLD";
  label: string;
  price: string;
  alerts: number;
  pkg: PurchasesPackage | null;
};

type Props = {
  children: ReactNode;
  isLocked: boolean;
  trialDaysLeft: number;
  planOptions: PlanOption[];
  purchasing: boolean;
  managementURL: string | null;
  onPurchase: (pkg: PurchasesPackage) => Promise<boolean>;
  onRestorePurchases: () => Promise<boolean>;
  onRedeemCode: (code: string) => Promise<void>;
  onRefreshProfile: () => void;
};

export function PaywallGate({
  children,
  isLocked,
  trialDaysLeft,
  planOptions,
  purchasing,
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
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

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
      onRefreshProfile();
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : "Nevazeci kod");
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleRestore() {
    setRestoreMsg(null);
    setRestoreLoading(true);
    const ok = await onRestorePurchases();
    setRestoreLoading(false);
    if (ok) {
      setRestoreMsg("Kupovina obnovljena!");
      onRefreshProfile();
    } else {
      setRestoreMsg("Nema aktivnih kupovina za ovaj nalog.");
    }
  }

  return (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🔒 Probni period istekao</Text>
        <Text style={styles.subtitle}>
          Odaberi plan i nastavi da koristiš Lovca na Oglase.
        </Text>

        {planOptions.map((plan) => (
          <Pressable
            key={plan.tier}
            style={({ pressed }) => [styles.planCard, pressed && styles.planCardPressed]}
            onPress={async () => {
              if (!plan.pkg || purchasing) return;
              const ok = await onPurchase(plan.pkg);
              if (ok) onRefreshProfile();
            }}
            disabled={purchasing || !plan.pkg}
          >
            <View style={styles.planInfo}>
              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={styles.planMeta}>{plan.alerts} signala</Text>
            </View>
            <View style={styles.planPrice}>
              {purchasing ? (
                <ActivityIndicator color={Colors.accent} />
              ) : (
                <Text style={styles.planPriceText}>{plan.price}</Text>
              )}
              {!plan.pkg && (
                <Text style={styles.planUnavailable}>Nedostupno</Text>
              )}
            </View>
          </Pressable>
        ))}

        {/* Drugarski code */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Promo / Drugarski kod</Text>
          <View style={styles.codeRow}>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              placeholder="Unesi kod"
              placeholderTextColor="rgba(26,37,23,0.4)"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={({ pressed }) => [styles.codeBtn, pressed && styles.codeBtnPressed]}
              onPress={handleRedeem}
              disabled={codeLoading || !code.trim()}
            >
              {codeLoading ? (
                <ActivityIndicator color={Colors.surface} size="small" />
              ) : (
                <Text style={styles.codeBtnText}>Aktiviraj</Text>
              )}
            </Pressable>
          </View>
          {codeError && <Text style={styles.errorText}>{codeError}</Text>}
          {codeSuccess && <Text style={styles.successText}>Kod aktiviran!</Text>}
        </View>

        {/* Restore purchases */}
        <Pressable style={styles.restoreBtn} onPress={handleRestore} disabled={restoreLoading}>
          {restoreLoading ? (
            <ActivityIndicator color={Colors.text} size="small" />
          ) : (
            <Text style={styles.restoreBtnText}>Vrati kupovinu</Text>
          )}
        </Pressable>
        {restoreMsg && <Text style={styles.restoreMsg}>{restoreMsg}</Text>}

        {/* Manage subscription (if user has managementURL) */}
        {managementURL && (
          <Pressable
            style={styles.restoreBtn}
            onPress={() => Linking.openURL(managementURL)}
          >
            <Text style={styles.restoreBtnText}>Upravljaj pretplatom</Text>
          </Pressable>
        )}

        {/* Go to profile */}
        <Pressable
          style={styles.profileBtn}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.profileBtnText}>Idi na profil →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    zIndex: 100,
  },
  container: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 48,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 8,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  planCardPressed: {
    opacity: 0.75,
  },
  planInfo: {
    gap: 4,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  planMeta: {
    fontSize: 13,
    color: Colors.text,
    opacity: 0.6,
  },
  planPrice: {
    alignItems: "flex-end",
    gap: 2,
  },
  planPriceText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.accent,
  },
  planUnavailable: {
    fontSize: 11,
    color: Colors.text,
    opacity: 0.4,
  },
  section: {
    gap: 8,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: "row",
    gap: 8,
  },
  codeInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  codeBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  codeBtnPressed: {
    opacity: 0.8,
  },
  codeBtnText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 13,
    color: "#C0392B",
  },
  successText: {
    fontSize: 13,
    color: "#27AE60",
  },
  restoreBtn: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  restoreBtnText: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.6,
    textDecorationLine: "underline",
  },
  restoreMsg: {
    textAlign: "center",
    fontSize: 13,
    color: Colors.text,
    opacity: 0.7,
  },
  profileBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.sage,
  },
  profileBtnText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
  },
});
