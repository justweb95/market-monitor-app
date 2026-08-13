import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
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
          <Ionicons name="receipt-outline" size={22} color={NeoTheme.colors.textMuted} />
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
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  card: {
    borderRadius: 16,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: 24,
    alignItems: "center",
    gap: 10,
    ...neoShadow,
  },
  text: {
    color: NeoTheme.colors.textMuted,
    fontSize: 14,
    fontFamily: NeoTheme.fonts.medium,
    textAlign: "center",
  },
});
