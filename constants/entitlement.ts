import type { AccountProfile } from "@/hooks/useAccountProfile";

// Koliko se ceka izmedju provera profila dok kupovina ne stigne do naseg backenda.
// Put je Google -> RevenueCat webhook -> nas server, pa zna da potraje vise od par
// sekundi (~11.5s ukupno uz ovaj backoff).
export const ENTITLEMENT_POLL_DELAYS_MS = [700, 1000, 1400, 2000, 2800, 3600];

// Otisak stanja pretplate. Menja se tek kad webhook upise novi plan, pa sluzi kao
// pouzdan signal da je kupovina stvarno propagirala - za razliku od `isLocked`,
// koji je kod nadogradnje (aktivan probni period ili prelazak na nizi plan) vec
// bio `false` PRE kupovine.
export function entitlementSignature(snapshot: AccountProfile | null): string {
  if (!snapshot) return "";
  return [
    snapshot.planTier,
    snapshot.subscription?.tier ?? "",
    snapshot.subscription?.status ?? "",
    snapshot.subscription?.productId ?? "",
    snapshot.subscription?.renewsAt ?? "",
  ].join("|");
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });

/**
 * Ceka da stanje pretplate na nasem backendu stvarno odrazi upravo zavrsenu kupovinu.
 *
 * `previousSignature` je otisak snimljen PRE kupovine - petlja se zavrsava tek kad
 * novi profil ima drugaciji otisak. Ako se otisak ne prosledi, pada na stari uslov
 * (`!isLocked`), koji je pouzdan samo kad se kupuje sa zakljucanog paywall-a.
 *
 * Vraca poslednji ucitani profil (moze biti i nepromenjen ako webhook kasni preko
 * ~11.5s - pozivalac tada treba da prikaze poruku "jos se sinhronizuje").
 */
export async function refreshEntitlementState(
  refreshProfile: () => Promise<AccountProfile | null>,
  previousSignature?: string,
): Promise<AccountProfile | null> {
  let latest = await refreshProfile();

  for (const delay of ENTITLEMENT_POLL_DELAYS_MS) {
    const settled =
      previousSignature === undefined
        ? !!latest && !latest.isLocked
        : !!latest && entitlementSignature(latest) !== previousSignature;

    if (settled) {
      return latest;
    }

    await wait(delay);
    latest = await refreshProfile();
  }

  return latest;
}
