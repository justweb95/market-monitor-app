/**
 * Normalizacija teksta za pretragu (isto pravilo kao na backendu -
 * fb-alert-api/src/lib/text.ts).
 *
 * Korisnik dobija iste rezultate bez obzira da li kuca cirilicom ili
 * latinicom, sa ili bez dijakritike: "Чачак", "Cacak" i "Čačak" se svode na
 * isti oblik.
 */

const CHAR_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "dj", е: "e", ж: "z", з: "z",
  и: "i", ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o",
  п: "p", р: "r", с: "s", т: "t", ћ: "c", у: "u", ф: "f", х: "h", ц: "c",
  ч: "c", џ: "dz", ш: "s",
  й: "j", ы: "i", э: "e", ю: "ju", я: "ja", щ: "sc", ъ: "", ь: "", ё: "e",
  ѓ: "dj", ќ: "c", ѕ: "dz", і: "i",
  đ: "dj",
};

/** Mala slova -> transliteracija cirilice -> uklanjanje dijakritike. */
export function normalizeSearchText(value: string): string {
  const lowered = String(value ?? "").toLowerCase();

  let transliterated = "";
  for (const char of lowered) {
    transliterated += CHAR_MAP[char] ?? char;
  }

  return transliterated
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
