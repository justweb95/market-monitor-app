import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Podešavanja" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.row}>
                <Ionicons name={item.icon} size={20} color={NeoTheme.colors.lime} />
                <Text style={styles.title}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={NeoTheme.colors.textMuted} />
              </View>
            </Pressable>
          ))}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    flex: 1,
    color: NeoTheme.colors.text,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  pressed: {
    opacity: 0.84,
  },
});
