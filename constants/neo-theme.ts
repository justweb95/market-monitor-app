export const NeoTheme = {
  colors: {
    background: "#161616",
    backgroundAlt: "#1D1D1D",
    surface: "rgba(255,255,255,0.08)",
    surfaceStrong: "rgba(255,255,255,0.14)",
    border: "rgba(255,255,255,0.12)",
    borderStrong: "rgba(255,255,255,0.24)",
    text: "#FFFFFF",
    textMuted: "#C6C6C6",
    textDim: "rgba(255,255,255,0.48)",
    lime: "#D7F20D",
    limeSoft: "#F6FF96",
    limeGlow: "rgba(215,242,13,0.22)",
    limeBorder: "rgba(215,242,13,0.78)",
    black: "#000000",
    danger: "#FF6767",
    dangerSoft: "rgba(255,103,103,0.18)",
    // Plan-tier accent colors - shared by paywall-gate.tsx and profile/plan.tsx
    // so the two screens can't drift apart on what "Bronze/Silver/Gold" look like.
    planAccent: {
      BRONZE: "#CD7F32",
      SILVER: "#BFC5CE",
      GOLD: "#F0C419",
    },
  },
  radius: {
    xs: 2,
    sm: 8,
    md: 16,
    lg: 22,
    xl: 30,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fonts: {
    regular: "ChakraPetch_400Regular",
    medium: "ChakraPetch_500Medium",
    semiBold: "ChakraPetch_600SemiBold",
    bold: "ChakraPetch_700Bold",
  },
} as const;

export const neoShadow = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: 0.28,
  shadowRadius: 22,
  elevation: 14,
};

export const neoGlow = {
  shadowColor: "#D7F20D",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.18,
  shadowRadius: 22,
  elevation: 0,
};