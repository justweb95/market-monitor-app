export type PushMode = "auto" | "off";

const DEFAULT_API_BASE_URL = "https://api.lovacnaoglase.rs";
const rawApiBaseUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;
const rawPushMode = process.env.EXPO_PUBLIC_PUSH_MODE?.trim().toLowerCase();

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");
export const PUSH_MODE: PushMode = rawPushMode === "off" ? "off" : "auto";

export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
export const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

// Web Client ID iz Google Cloud Console — koristi ga @react-native-google-signin i na
// Androidu (standardni obrazac te biblioteke), ne samo web. Nije tajna — namenjen je
// da bude ugradjen u klijentski kod.
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
