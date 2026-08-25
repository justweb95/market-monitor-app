import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import { useDevice } from "@/contexts/DeviceContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notificationsEnabled, notificationsPreferenceLoaded, updateNotificationsEnabled } = useDevice();
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Notifikacije" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.cardTitle}>Push obavestenja</Text>
                <Text style={styles.toggleHint}>
                  Uključi ili isključi push obavestenja za nove oglase.
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                disabled={!notificationsPreferenceLoaded || notificationsSaving}
                onValueChange={async (value) => {
                  setNotificationsSaving(true);
                  try {
                    await updateNotificationsEnabled(value);
                  } finally {
                    setNotificationsSaving(false);
                  }
                }}
                trackColor={{ false: "rgba(255,255,255,0.18)", true: "rgba(215, 242, 13, 0.55)" }}
                thumbColor={notificationsEnabled ? NeoTheme.colors.lime : "#F4F3F4"}
              />
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
    paddingHorizontal: rs(24),
    paddingTop: rs(10),
  },
  content: {
    paddingBottom: rs(36),
    gap: rs(12),
  },
  card: {
    borderRadius: rs(16),
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: rs(14),
    ...neoShadow,
  },
  cardTitle: {
    color: NeoTheme.colors.text,
    fontSize: rf(16),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(10),
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: rs(12),
  },
  toggleCopy: {
    flex: 1,
  },
  toggleHint: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(12),
    lineHeight: rf(18),
    fontFamily: NeoTheme.fonts.medium,
  },
});
