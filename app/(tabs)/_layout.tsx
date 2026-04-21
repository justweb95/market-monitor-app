import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/colors";
import { Tabs } from "expo-router";
import React from "react";
import { Image } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,

        tabBarStyle: {
          backgroundColor: Colors.background, // krem
          borderTopColor: Colors.border,
        },

        tabBarActiveTintColor: Colors.accent, // brass (premium highlight)
        tabBarInactiveTintColor: "rgba(26,37,23,0.55)", // deep-olive, ali blaže
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Početna",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: "Obaveštenja",
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require("../../assets/images/notification.png")}
              style={{
                width: 28,
                height: 28,
                tintColor: color,
                opacity: focused ? 1 : 0.6,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
