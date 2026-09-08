/**
 * Drugarski plan: kod se od 2026-09-08 izdaje POJEDINACNO po korisniku (admin ga
 * rucno generise iz dashboard-a i posalje korisniku), pa u aplikaciji vise nema
 * jednog fiksnog koda sa kojim bi se poredilo. Aplikacija samo prosledi ono sto je
 * korisnik ukucao, a backend proverava da li se poklapa sa kodom izdatim BAS tom
 * nalogu (`User.promoCodeIssued`).
 *
 * Zato je jedini pouzdan pokazatelj "drugarski je aktivan" to da je kod uopste
 * iskoriscen - `promoCodeUsed` se popunjava samo kroz uspesan unos ili admin akciju.
 * Nalozi koji su ranije iskoristili stari globalni kod ostaju prepoznati istim
 * uslovom, pa im pristup nije prekinut.
 */
export function hasDrugarskiPlan(promoCodeUsed: string | null | undefined): boolean {
  return !!promoCodeUsed;
}
