import { AppHeader } from "@/components/app-header";
import { NeoTheme } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PurchaseHistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Istorija kupovina" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons name="receipt-outline" size={22} color={NeoTheme.colors.textMuted} />
          </View>
          <Text style={styles.text}>Istorija kupovina uskoro stiže.</Text>
        </View>
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
  card: {
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
  text: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.medium,
    textAlign: "center",
  },
});
