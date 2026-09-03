import { AppHeader } from "@/components/app-header";
import { CutCard } from "@/components/cut-card";
import { NeoTheme } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import { useDevice } from "@/contexts/DeviceContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MenuItem = {
  route:
    | "/profile/user-info"
    | "/profile/plan"
    | "/profile/purchase-history"
    | "/profile/notifications"
    | "/profile/support"
    | "/profile/about";
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const MENU_ITEMS: MenuItem[] = [
  { route: "/profile/user-info", title: "Korisnički podaci", icon: "person-outline" },
  { route: "/profile/plan", title: "Moj plan", icon: "card-outline" },
  { route: "/profile/purchase-history", title: "Istorija kupovina", icon: "receipt-outline" },
  { route: "/profile/notifications", title: "Notifikacije", icon: "notifications-outline" },
  { route: "/profile/support", title: "Support", icon: "help-buoy-outline" },
  { route: "/profile/about", title: "O aplikaciji", icon: "information-circle-outline" },
];

export default function ProfileMenuScreen() {
  const router = useRouter();
  const { invalidateDeviceRegistration } = useDevice();

  // Odjava samo zaboravlja lokalnu registraciju uredjaja. Nalog i signali ostaju na
  // serveru; app pada na ekran za prijavu jer profil vise nema povezanog korisnika.
  function confirmLogout() {
    Alert.alert("Odjaviti se?", "Signali i nalog ostaju sačuvani. Možeš se prijaviti ponovo.", [
      { text: "Odustani", style: "cancel" },
      {
        text: "Odjavi se",
        style: "destructive",
        onPress: () => void invalidateDeviceRegistration(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Podešavanja" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {MENU_ITEMS.map((item) => (
            <CutCard key={item.route} onPress={() => router.push(item.route)} style={styles.card}>
              <View style={styles.row}>
                <Ionicons name={item.icon} size={20} color={NeoTheme.colors.lime} />
                <Text style={styles.title}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={NeoTheme.colors.textMuted} />
              </View>
            </CutCard>
          ))}

          <CutCard onPress={() => router.push("/profile/delete-account")} style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="trash-outline" size={20} color={NeoTheme.colors.danger} />
              <Text style={[styles.title, styles.dangerTitle]}>Obriši nalog</Text>
              <Ionicons name="chevron-forward" size={18} color={NeoTheme.colors.danger} />
            </View>
          </CutCard>

          <CutCard onPress={confirmLogout} style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="log-out-outline" size={20} color={NeoTheme.colors.lime} />
              <Text style={styles.title}>Odjavi se</Text>
              <Ionicons name="chevron-forward" size={18} color={NeoTheme.colors.textMuted} />
            </View>
          </CutCard>
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
    paddingVertical: rs(17),
    paddingHorizontal: rs(16),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(14),
  },
  title: {
    flex: 1,
    color: NeoTheme.colors.text,
    fontSize: rf(15),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  dangerTitle: {
    color: NeoTheme.colors.danger,
  },
});
