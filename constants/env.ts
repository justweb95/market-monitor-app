export type PushMode = "auto" | "off";

const DEFAULT_API_BASE_URL = "https://quietistic-unsettlingly-mavis.ngrok-free.dev";
const rawApiBaseUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;
const rawPushMode = process.env.EXPO_PUBLIC_PUSH_MODE?.trim().toLowerCase();

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");
export const PUSH_MODE: PushMode = rawPushMode === "off" ? "off" : "auto";
