import { NeoTheme } from "@/constants/neo-theme";
import { rs } from "@/constants/responsive";
import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

export type CutCorners = "tl-br" | "tr-bl";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Koji par naspramnih uglova je "isecen" - podrazumevano gornji-levi + donji-desni (redovi u listama). */
  corners?: CutCorners;
  /** Vizuelna dubina iseka u px (pre responsive skaliranja). */
  notch?: number;
  fillColor?: string;
  /**
   * Boja POZADI kartice - mora da se poklopi sa pozadinom ekrana/roditelja na
   * kome kartica sedi, inace se umesto iseka vidi kvadratic pogresne boje.
   */
  cutoutColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Tamna kartica/red sa "isecenim" (chamfered) naspramnim uglovima - deljeni
 * neo-brutalist stil iz redizajna (Claude Design v5, projectId
 * 1d1c0356-0b6c-45df-bf14-ed95a8ad3988). CSS `clip-path` nema RN ekvivalent,
 * pa se ugao "sece" istim trikom kao `CutButton`: rotirani kvadrat u boji
 * pozadine prekriva ugao kartice.
 */
export function CutCard({
  children,
  onPress,
  disabled = false,
  corners = "tl-br",
  notch = rs(10),
  fillColor = NeoTheme.colors.surfaceSolid,
  cutoutColor = NeoTheme.colors.background,
  style,
}: Props) {
  const cutoutSize = notch * 2;
  const cutoutStyle = { width: cutoutSize, height: cutoutSize, backgroundColor: cutoutColor };
  const cornerA = corners === "tl-br" ? { top: -notch, left: -notch } : { top: -notch, right: -notch };
  const cornerB = corners === "tl-br" ? { bottom: -notch, right: -notch } : { bottom: -notch, left: -notch };

  const cutouts = (
    <>
      <View style={[styles.cutout, cutoutStyle, cornerA]} />
      <View style={[styles.cutout, cutoutStyle, cornerB]} />
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          { backgroundColor: fillColor },
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
          style,
        ]}
      >
        {cutouts}
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, { backgroundColor: fillColor }, disabled && styles.disabled, style]}>
      {cutouts}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: "relative",
    overflow: "hidden",
  },
  cutout: {
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.5,
  },
});
