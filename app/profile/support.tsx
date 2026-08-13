import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@lovacnaoglase.rs";

export default function SupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Support" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kontaktiraj podršku</Text>
            <Text style={styles.hint}>
              Imaš problem sa aplikacijom ili pretplatom? Pošalji nam email i javićemo se.
            </Text>
            <Text style={styles.email}>{SUPPORT_EMAIL}</Text>
            <Pressable
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
            >
              <Ionicons name="mail-outline" size={16} color={NeoTheme.colors.black} />
              <Text style={styles.saveBtnText}>Pošalji email</Text>
            </Pressable>
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
  cardTitle: {
    color: NeoTheme.colors.text,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 10,
  },
  hint: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: 10,
  },
  email: {
    color: NeoTheme.colors.lime,
    fontSize: 14,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 14,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: NeoTheme.colors.lime,
  },
  saveBtnText: {
    color: NeoTheme.colors.black,
    fontFamily: NeoTheme.fonts.bold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.84,
  },
});
