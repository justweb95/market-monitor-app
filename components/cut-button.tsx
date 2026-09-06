import { NeoTheme, neoGlow } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

export type CutButtonVariant = "lime" | "orange" | "white" | "danger" | "danger-muted" | "ghost";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant: CutButtonVariant;
  /** Ikonica pre teksta (npr. "mail-outline" dugme za support). */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Boja "isecenih" uglova - mora da se poklopi sa pozadinom ispod dugmeta. */
  cutoutColor?: string;
  /** Vizuelna dubina iseka u px (pre responsive skaliranja). Podrazumevano 10 (mala dugmad na karticama oglasa). */
  notch?: number;
  style?: StyleProp<ViewStyle>;
};

const VARIANT_STYLES: Record<
  CutButtonVariant,
  { background: string; text: string; glow?: boolean }
> = {
  lime: { background: NeoTheme.colors.lime, text: NeoTheme.colors.black, glow: true },
  orange: { background: "rgba(255, 149, 0, 1)", text: NeoTheme.colors.black },
  white: { background: NeoTheme.colors.text, text: NeoTheme.colors.black },
  // Puno crveno, za usamljeno/glavno rusilacko dugme (npr. "Trajno obrisi nalog") -
  // kad je jedino dugme u tom kontekstu i mora da nosi puni vizuelni naglasak.
  danger: { background: "rgba(255, 49, 49, 1)", text: NeoTheme.colors.text },
  // Prigušeno - kad "Obrisi" stoji U REDU sa drugim dugmadima (Ukljuci/Izmeni), iz
  // dizajna (Claude Design v5): tamna crvenkasta pozadina + crveni tekst, ne puno
  // crveno - da ne "vice" glasnije od ostalih dugmadi pored sebe.
  "danger-muted": { background: "#2C1614", text: NeoTheme.colors.danger },
  // Sekundarno/neutralno dugme (npr. "Ponisti"/"Odustani" pored primarnog) - tamno
  // sivo, ne belo/crno.
  ghost: { background: NeoTheme.colors.inputFill, text: "#E6E6E6" },
};

/**
 * Dugme sa "isecenim" (chamfered) uglovima - deljeni neo-brutalist stil sa
 * pocetnog ekrana (Obrisi/Vidi oglas dugmad na karticama oglasa). `cutoutColor`
 * mora da odgovara pozadini ispod dugmeta (podrazumevano "#2a2a2a" - tamna
 * povrsina kartica), inace se umesto efekta isecenog ugla vide siva polja.
 */
export function CutButton({
  label,
  onPress,
  disabled = false,
  variant,
  icon,
  cutoutColor = "#2a2a2a",
  notch = 10,
  style,
}: Props) {
  const { background, text, glow } = VARIANT_STYLES[variant];
  const cutoutSize = rs(notch * 2);
  const offset = rs(-notch);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // Bez ovoga, Android ne renderuje disabled/pressed opacity kao jedan
      // sloj vec blenduje svako dete (isecene "cutout" ivice) posebno sa onim
      // sto je vec iscrtano ispod - to pusta pozadinu dugmeta (npr. lime) da
      // se probije preko izsecenih uglova. Sa ovim se ceo sadrzaj prvo
      // renderuje offscreen pa se opacity primenjuje na gotovu sliku.
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        glow && !disabled && neoGlow,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          styles.cutout,
          { width: cutoutSize, height: cutoutSize, top: offset, right: offset, backgroundColor: cutoutColor },
        ]}
      />
      <View
        style={[
          styles.cutout,
          { width: cutoutSize, height: cutoutSize, bottom: offset, left: offset, backgroundColor: cutoutColor },
        ]}
      />
      <View style={styles.content}>
        {icon ? <Ionicons name={icon} size={16} color={text} /> : null}
        <Text style={[styles.text, { color: text }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: rs(36),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
  },
  cutout: {
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  text: {
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.bold,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.84,
  },
});
