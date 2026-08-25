import { Dimensions, PixelRatio } from "react-native";

/**
 * Responzivno skaliranje fontova i razmaka po širini ekrana.
 *
 * Dizajn je pravljen i savršeno izgleda na 375px i 420px širine, pa je to
 * naša referentna (1.0x) tačka — na tim i širim ekranima se ništa ne
 * uvećava. Na užim ekranima (do 320px, npr. mali Android telefoni ili
 * emulator na 320px) se font i razmak proporcionalno smanjuju, tako da
 * dizajn ostaje vizuelno identičan na svim veličinama.
 *
 * Aplikacija je zaključana na portrait (app.json), pa je statična širina
 * uzeta jednom pri pokretanju dovoljna — nema potrebe za useWindowDimensions
 * hookom u svakom fajlu.
 */
const BASE_WIDTH = 375;
const MIN_WIDTH = 320;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CLAMPED_WIDTH = Math.min(Math.max(SCREEN_WIDTH, MIN_WIDTH), BASE_WIDTH);

/** 1.0 na 375px+, linearno pada do ~0.853 na 320px. */
export const WIDTH_RATIO = CLAMPED_WIDTH / BASE_WIDTH;

/**
 * Puno linearno skaliranje - za padding, margin, gap, border-radius i
 * fiksne dimenzije gde razmak treba da isprati širinu ekrana 1:1.
 */
export function scale(size: number): number {
  return PixelRatio.roundToNearestPixel(size * WIDTH_RATIO);
}

/**
 * Umereno skaliranje (faktor 0.5 po default) - za fontSize/lineHeight.
 * Tekst se smanjuje upola blaže od paddinga da bi ostao čitljiv i na
 * najmanjim (320px) ekranima.
 */
export function moderateScale(size: number, factor = 0.5): number {
  return PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);
}

/** Skraćenica: responsive spacing (padding/margin/gap/radius/dimenzije). */
export const rs = scale;

/** Skraćenica: responsive font (fontSize/lineHeight). */
export const rf = (size: number): number => moderateScale(size, 0.5);
