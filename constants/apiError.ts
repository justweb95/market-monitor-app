// Backend salje ili { error: "citljiva poruka" } ili, za Zod validacione greske,
// { error: "Nevaljana ulazna polja", details: [{field, message}] } — details[0].message
// je specificna i citljiva (npr. "Email adresa nije validna"), dok je top-level error
// generican. Nikad ne prikazujemo korisniku sirov status kod ili raw response body.
export async function parseApiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.details?.[0]?.message || data?.error || fallback;
  } catch {
    // Telo nije JSON (npr. HTML greska sa proxy-ja) — ostaje generican tekst
    return fallback;
  }
}
