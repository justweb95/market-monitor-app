import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastKind = "success" | "error" | "info";

export type ToastMessage = {
  kind: ToastKind;
  text: string;
};

type Props = {
  toast: ToastMessage | null;
  onHide: () => void;
  /** Koliko dugo poruka stoji na ekranu pre automatskog sklanjanja. */
  durationMs?: number;
};

const ICONS: Record<ToastKind, React.ComponentProps<typeof Ionicons>["name"]> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};

/**
 * Kratka poruka preko celog ekrana (toast). Renderuje se iznad svega, pa moze
 * da prezivi i gasenje ekrana koji ju je izazvao (npr. AuthGate nestaje cim se
 * nalog poveze, a potvrda o uspehu i dalje treba da se vidi).
 */
export function AppToast({ toast, onHide, durationMs = 3200 }: Props) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!toast) return;

    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => onHideRef.current());
    }, durationMs);

    return () => clearTimeout(timer);
  }, [anim, durationMs, toast]);

  if (!toast) return null;

  const accent =
    toast.kind === "error" ? NeoTheme.colors.danger : NeoTheme.colors.lime;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: insets.top + rs(10),
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-rs(24), 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onHide}
        style={[styles.card, { borderColor: accent }]}
        accessibilityRole="alert"
      >
        <Ionicons name={ICONS[toast.kind]} size={rs(20)} color={accent} />
        <Text style={styles.text}>{toast.text}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: rs(16),
    right: rs(16),
    zIndex: 9999,
    elevation: 9999,
    ...Platform.select({ web: { pointerEvents: "box-none" as const } }),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
    borderRadius: NeoTheme.radius.sm,
    borderWidth: 1,
    // Neprozirna pozadina: toast se crta preko sadrzaja, providna bi bila necitljiva.
    backgroundColor: NeoTheme.colors.backgroundAlt,
    ...neoShadow,
  },
  text: {
    flex: 1,
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.semiBold,
    fontSize: rf(13),
    lineHeight: rf(18),
  },
});
