import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

export type PaidTier = "BRONZE" | "SILVER" | "GOLD";

export const PAID_TIERS: PaidTier[] = ["BRONZE", "SILVER", "GOLD"];

/**
 * Product ID-jevi kako su podeseni u Google Play Console-u i mapirani u
 * RevenueCat-u. Backend koristi iste vrednosti u PRODUCT_TIER mapi
 * (fb-alert-api/src/features/subscription/subscription.controller.ts) — ako se
 * ovde nesto menja, mora i tamo.
 */
export const TIER_PRODUCT_ID: Record<PaidTier, string> = {
  BRONZE: "market_monitor_bronze_monthly",
  SILVER: "market_monitor_silver_monthly",
  GOLD: "market_monitor_gold_monthly",
};

/**
 * Rezervna cena — prikazuje se SAMO dok RevenueCat offerings nisu ucitani
 * (nema mreze, SDK jos radi init). Cim paket stigne, prikazuje se cena iz
 * Google Play-a u lokalnoj valuti; Play zahteva da korisnik vidi tacno onu
 * cenu koja ce mu biti naplacena, pa ove vrednosti nikad ne smeju da zamene
 * `product.priceString` kad je on dostupan.
 */
export const FALLBACK_PRICE: Record<PaidTier, string> = {
  BRONZE: "10 €",
  SILVER: "15 €",
  GOLD: "20 €",
};

/** Broj aktivnih signala po tieru; isto toliko sme da stoji u rezervi. */
export const TIER_ALERTS: Record<PaidTier, number> = {
  BRONZE: 3,
  SILVER: 6,
  GOLD: 10,
};

/**
 * Nadji RevenueCat paket za dati tier.
 *
 * Ne oslanjamo se samo na `package.identifier` — kad se u RevenueCat-u koriste
 * standardni tipovi paketa, identifier je "$rc_monthly" za sve tierove i
 * pretraga po imenu tiera ne bi nasla nista (pa bi svaki plan pisao "Trenutno
 * nije dostupno"). Zato se prvo gleda product ID. Na Androidu product
 * identifier ume da dodje kao "product_id:base-plan-id", pa je poredjenje
 * preko `startsWith`/`includes`, ne stroga jednakost.
 */
export function findPackageForTier(
  offerings: PurchasesOffering | null | undefined,
  tier: PaidTier,
): PurchasesPackage | null {
  const packages = offerings?.availablePackages ?? [];
  const productId = TIER_PRODUCT_ID[tier];
  const needle = tier.toLowerCase();

  const byProductId = packages.find((p) =>
    p.product.identifier.toLowerCase().startsWith(productId),
  );
  if (byProductId) return byProductId;

  const byProductName = packages.find((p) =>
    p.product.identifier.toLowerCase().includes(needle),
  );
  if (byProductName) return byProductName;

  return packages.find((p) => p.identifier.toLowerCase().includes(needle)) ?? null;
}

/** Cena za prikaz: uvek iz Play-a kad je dostupna, inace rezervna vrednost. */
export function priceLabelForTier(
  pkg: PurchasesPackage | null,
  tier: PaidTier,
): string {
  return pkg?.product.priceString ?? FALLBACK_PRICE[tier];
}
