import { HapticTab } from "@/components/haptic-tab";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

function TabIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={24} color={color} />
      <View style={[styles.activeLine, !focused && styles.activeLineHidden]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        sceneStyle: { backgroundColor: NeoTheme.colors.background },
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <LinearGradient
            colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabBarBackground}
          />
        ),
        tabBarActiveTintColor: NeoTheme.colors.lime,
        tabBarInactiveTintColor: "rgba(255,255,255,0.78)",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Početna",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: "Signali",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="pulse" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoriti",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="heart" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 26,
    right: 26,
    bottom: 20,
    height: 52,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    borderRadius: 22,
    backgroundColor: "transparent",
    ...neoShadow,
  },
  tabBarBackground: {
    flex: 1,
    borderRadius: 22,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: 42,
  },
  activeLine: {
    width: 18,
    height: 3,
    borderRadius: 999,
    backgroundColor: NeoTheme.colors.limeSoft,
  },
  activeLineHidden: {
    opacity: 0,
  },
});
