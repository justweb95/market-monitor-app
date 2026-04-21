/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#4CAF50"; // Green accent for dark mode

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    surface: "#FFFFFF",
    border: "rgba(0,0,0,0.12)",
    mutedText: "rgba(0,0,0,0.65)",
    accent: "#4CAF50",
    enabledDot: "#4CAF50",
    disabledDot: "#F44336",
    save: "#4CAF50",
    sage: "#ACC8A2",
    toggleOnText: "#8C3F3F",
    toggleOffText: "#2E6B3A",
  },
  dark: {
    text: "#ECEDEE",
    background: "#121212", // Dark background
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    surface: "#1E1E1E", // Dark surface
    border: "rgba(255,255,255,0.12)",
    mutedText: "rgba(255,255,255,0.65)",
    accent: "#4CAF50",
    enabledDot: "#4CAF50",
    disabledDot: "#F44336",
    save: "#4CAF50",
    sage: "#2E7D32",
    toggleOnText: "#EF5350",
    toggleOffText: "#66BB6A", // Darker sage
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
