import { NeoTheme, neoGlow } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AppHeaderProps = {
  rightLabel: string;
  rightIcon?: React.ComponentProps<typeof Ionicons>["name"];
  onRightPress?: () => void;
  rightCount?: string;
  description?: string;
  rightIconColor?: string;
  rightBorderColor?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
  onLeftPress?: () => void;
};

export function AppHeader({
  rightLabel,
  rightIcon,
  onRightPress,
  rightCount,
  description = "Pametni signali za nove oglase",
  rightIconColor = NeoTheme.colors.lime,
  rightBorderColor = NeoTheme.colors.limeBorder,
  leftIcon,
  onLeftPress,
}: AppHeaderProps) {
  const isCountAtLimit = (() => {
    if (!rightCount || !rightCount.includes("/")) return false;
    const [currentRaw, maxRaw] = rightCount.split("/");
    const current = Number(currentRaw.trim());
    const max = Number(maxRaw.trim());
    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return false;
    return current >= max;
  })();

  const rightContent = (
    <>
      {rightIcon ? <Ionicons name={rightIcon} size={16} color={rightIconColor} /> : null}
      <Text style={styles.rightLabel}>{rightLabel}</Text>
      {rightCount ? (
        <View
          style={[
            styles.countBadge,
            isCountAtLimit && styles.countBadgeDanger,
          ]}
        >
          <Text style={[styles.countText, isCountAtLimit && styles.countTextDanger]}>{rightCount}</Text>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeftCluster}>
        <View style={styles.brandRow}>
          <View style={styles.logoHex} />
          <View style={styles.brandCopy}>
            <Text style={styles.brandText}>Lovac na Oglase</Text>
            <Text style={styles.brandDescription}>{description}</Text>
          </View>
        </View>
      </View>

      <View style={styles.headerRightCluster}>
        {onLeftPress && leftIcon ? (
          <Pressable onPress={onLeftPress} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name={leftIcon} size={18} color={NeoTheme.colors.lime} />
          </Pressable>
        ) : null}

        {onRightPress ? (
          <Pressable
            onPress={onRightPress}
            style={({ pressed }) => [
              styles.rightPill,
              { borderColor: rightBorderColor },
              pressed && styles.pressed,
            ]}
          >
            {rightContent}
          </Pressable>
        ) : (
          <View style={[styles.rightPill, styles.rightPillStatic, { borderColor: rightBorderColor }]}>
            {rightContent}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: rs(8),
    marginBottom: rs(18),
    gap: rs(12),
  },
  headerLeftCluster: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  headerRightCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    flexShrink: 0,
  },
  backButton: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(8),
    borderWidth: 1,
    borderColor: NeoTheme.colors.limeBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: rs(12),
    flexShrink: 1,
  },
  brandCopy: {
    flexShrink: 1,
  },
  logoHex: {
    width: rs(22),
    height: rs(22),
    backgroundColor: NeoTheme.colors.lime,
    borderRadius: rs(6),
    transform: [{ rotate: "45deg" }],
    marginTop: rs(9),
    ...neoGlow,
  },
  brandText: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.bold,
    fontSize: rf(19),
    lineHeight: rf(22),
  },
  brandDescription: {
    color: NeoTheme.colors.textDim,
    fontFamily: NeoTheme.fonts.medium,
    fontSize: rf(11),
    lineHeight: rf(14),
    marginTop: rs(3),
  },
  rightPill: {
    minHeight: rs(36),
    paddingHorizontal: rs(12),
    borderRadius: rs(8),
    borderWidth: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(6),
  },
  rightPillStatic: {
    backgroundColor: "transparent",
  },
  rightLabel: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.semiBold,
    fontSize: rf(13),
  },
  countBadge: {
    minWidth: rs(40),
    minHeight: rs(24),
    borderRadius: rs(3),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: rs(8),
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  countBadgeDanger: {
    borderColor: "rgba(255, 49, 49, 1)",
    backgroundColor: "rgba(255, 49, 49, 0.18)",
  },
  countText: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.bold,
    fontSize: rf(11),
  },
  countTextDanger: {
    color: "rgba(255, 49, 49, 1)",
  },
  pressed: {
    opacity: 0.84,
  },
});