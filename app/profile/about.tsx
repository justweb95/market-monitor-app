import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="O aplikaciji" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Pressable onPress={() => Linking.openURL("https://lovacnaoglase.rs")} style={styles.legalRow}>
              <Text style={styles.legalLink}>Landing stranica</Text>
              <Ionicons name="open-outline" size={14} color={NeoTheme.colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => Linking.openURL("https://lovacnaoglase.rs/privacy")} style={styles.legalRow}>
              <Text style={styles.legalLink}>Politika privatnosti</Text>
              <Ionicons name="open-outline" size={14} color={NeoTheme.colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => Linking.openURL("https://lovacnaoglase.rs/terms")} style={styles.legalRow}>
              <Text style={styles.legalLink}>Uslovi korišćenja</Text>
              <Ionicons name="open-outline" size={14} color={NeoTheme.colors.textMuted} />
            </Pressable>
            <Text style={styles.versionText}>Verzija {Constants.expoConfig?.version ?? "1.0.0"}</Text>
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
  content: {
    paddingBottom: 36,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: 14,
    ...neoShadow,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: NeoTheme.colors.border,
  },
  legalLink: {
    color: NeoTheme.colors.text,
    fontSize: 14,
    fontFamily: NeoTheme.fonts.medium,
  },
  versionText: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    marginTop: 10,
    textAlign: "center",
  },
});
