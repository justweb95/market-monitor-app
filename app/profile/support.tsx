import { AppHeader } from "@/components/app-header";
import { CutButton } from "@/components/cut-button";
import { NeoTheme } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
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
            <CutButton
              label="Pošalji email"
              variant="lime"
              icon="mail-outline"
              notch={16}
              cutoutColor={NeoTheme.colors.surfaceSolid}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              style={styles.saveBtn}
            />
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
    paddingHorizontal: rs(24),
    paddingTop: rs(10),
  },
  content: {
    paddingBottom: rs(36),
    gap: rs(12),
  },
  card: {
    borderRadius: rs(18),
    backgroundColor: NeoTheme.colors.surfaceSolid,
    padding: rs(16),
  },
  cardTitle: {
    color: NeoTheme.colors.text,
    fontSize: rf(16),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(10),
  },
  hint: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(12),
    lineHeight: rf(18),
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: rs(10),
  },
  email: {
    color: NeoTheme.colors.lime,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(14),
  },
  saveBtn: {
    height: rs(48),
  },
});
