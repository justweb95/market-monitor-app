import { AppHeader } from "@/components/app-header";
import { SerbiaRegionMap } from "@/components/serbia-region-map";
import { SERBIA_REGIONS, type RegionCode } from "@/constants/serbia-map";
import { API_URL } from "@/constants/api";
import { parseApiErrorMessage } from "@/constants/apiError";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { NeoTheme, neoGlow, neoShadow } from "@/constants/neo-theme";
import { DRUGARSKI_PROMO_CODE } from "@/constants/promo";
import { rf, rs } from "@/constants/responsive";
import { normalizeSearchText } from "@/constants/text";
import { useDevice } from "@/contexts/DeviceContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Category =
  | "AUTOMOBILI"
  | "AUTO_DELOVI"
  | "MOTORI"
  | "MOTO_DELOVI"
  | "MOTO_OPREMA"
  | "TELEFONI"
  | "RACUNARI"
  | "BICIKLI"
  | "NEKRETNINE"
  | "SVE";

type Step = 0 | 1 | 2;

type AlertItem = {
  id: string;
  category: Category;
  keywords: string[];
  priceMax: number | null;
  locationText?: string;
  propertyType?: "STAN" | "LOKAL" | "PARCELA" | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  kmFrom?: number | null;
  kmTo?: number | null;
  fuelTypes?: string[];
  bodyTypes?: string[];
  motoTypes?: string[];
  regions?: RegionCode[];
  ccmFrom?: number | null;
  ccmTo?: number | null;
  isActive: boolean;
  isPreview?: boolean;
};

type CategoryOption = {
  value: Category;
  label: string;
  beta?: boolean;
};

type PropertyType = "STAN" | "LOKAL" | "PARCELA";

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "AUTOMOBILI", label: "Automobili" },
  { value: "AUTO_DELOVI", label: "Auto delovi" },
  { value: "MOTORI", label: "Motori" },
  { value: "MOTO_DELOVI", label: "Moto delovi", beta: true },
  { value: "MOTO_OPREMA", label: "Moto oprema", beta: true },
  { value: "TELEFONI", label: "Telefoni" },
  { value: "RACUNARI", label: "Racunari" },
  { value: "BICIKLI", label: "Bicikli" },
  { value: "NEKRETNINE", label: "Nekretnine" },
  { value: "SVE", label: "Sve kategorije" },
];

// Vrsta goriva i tip karoserije - vrednosti moraju da odgovaraju backend-u
// (ALLOWED_FUEL_TYPES / ALLOWED_BODY_TYPES u notification.controller.ts).
const FUEL_OPTIONS: { value: string; label: string }[] = [
  { value: "BENZIN", label: "Benzin" },
  { value: "DIZEL", label: "Dizel" },
  { value: "HIBRID", label: "Hibrid" },
  { value: "ELEKTRO", label: "Elektricni" },
  { value: "TNG", label: "TNG (plin)" },
  { value: "CNG", label: "CNG (metan)" },
];

const BODY_OPTIONS: { value: string; label: string }[] = [
  { value: "LIMUZINA", label: "Limuzina" },
  { value: "HECBEK", label: "Hecbek" },
  { value: "KARAVAN", label: "Karavan" },
  { value: "SUV", label: "SUV / Dzip" },
  { value: "KUPE", label: "Kupe" },
  { value: "KABRIOLET", label: "Kabriolet" },
  { value: "MONOVOLUMEN", label: "Monovolumen" },
  { value: "KOMBI", label: "Kombi" },
  { value: "PIKAP", label: "Pikap" },
];

const MOTO_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "NAKED", label: "Naked" },
  { value: "SPORT", label: "Sport" },
  { value: "ENDURO", label: "Enduro / Cross" },
  { value: "CHOPPER", label: "Chopper / Cruiser" },
  { value: "TURING", label: "Turing" },
  { value: "SKUTER", label: "Skuter" },
  { value: "ATV", label: "ATV / Quad" },
  { value: "KLASIK", label: "Klasik" },
];

/** Kategorije za koje ima smisla filtrirati tip motora i kubikazu. */
const MOTO_FILTER_CATEGORIES = new Set<Category>(["MOTORI"]);

/** Kategorije za koje ima smisla filtrirati gorivo i karoseriju. */
const VEHICLE_FILTER_CATEGORIES = new Set<Category>(["AUTOMOBILI"]);

const PROPERTY_OPTIONS: Array<{ value: PropertyType; label: string }> = [
  { value: "STAN", label: "Stan" },
  { value: "LOKAL", label: "Lokal" },
  { value: "PARCELA", label: "Parcela / Zemljiste" },
];

const YEAR_FILTER_CATEGORIES = new Set<Category>([
  "AUTOMOBILI",
  "AUTO_DELOVI",
  "MOTORI",
  "MOTO_DELOVI",
]);

const KM_FILTER_CATEGORIES = new Set<Category>(["AUTOMOBILI", "MOTORI"]);

const CATALOG: Record<Category, string[]> = {
  AUTOMOBILI: [
    "Audi A3",
    "Audi A4",
    "Audi A6",
    "Audi Q5",
    "Audi Q7",
    "BMW 320",
    "BMW 520",
    "BMW X5",
    "Golf 6",
    "Golf 7",
    "Golf 8",
    "Skoda Octavia",
    "Skoda Superb",
    "Passat B8",
    "Passat B7",
    "Mercedes C220",
    "Mercedes E220",
    "Mercedes GLA 200",
    "Fiat 500L",
    "Peugeot 308",
    "Toyota Corolla",
    "Toyota Yaris",
    "Renault Clio",
    "Opel Astra",
    "Opel Insignia",
  ],
  AUTO_DELOVI: [
    "Audi A6 diferencijal",
    "Golf 7 menjac",
    "Passat B8 turbina",
    "BMW 320 amortizer",
    "Audi A4 far",
    "Mercedes E220 kociona klesta",
    "Peugeot 308 alternator",
    "Skoda Octavia trap",
    "BMW 320 retrovizor",
    "Golf 6 kompresor klime",
    "Audi A3 kvacilo",
  ],
  MOTORI: [
    "Yamaha MT-07",
    "Yamaha R6",
    "Honda CBR 600RR",
    "Kawasaki Z650",
    "Suzuki GSX-R 750",
    "BMW GS 1250",
    "Ducati Monster",
    "Piaggio Beverly 300",
    "Honda Forza 350",
    "Kymco Agility",
    "Aprilia SR 50",
    "KTM Duke 390",
  ],
  MOTO_DELOVI: [
    "Yamaha R6 plastike",
    "Honda CBR lanac i lancanici",
    "Kawasaki Z650 auspuh",
    "Skuter variomat",
    "Moto disk plocice",
  ],
  MOTO_OPREMA: [
    "Moto kaciga AGV",
    "Moto jakna Dainese",
    "Moto rukavice",
    "Moto cizme Alpinestars",
    "Kisno odelo za motor",
  ],
  TELEFONI: [
    "iPhone 13",
    "iPhone 14",
    "iPhone 15",
    "iPhone 15 Pro",
    "Samsung Galaxy S23",
    "Samsung Galaxy S24",
    "Xiaomi 13",
    "Xiaomi 14",
    "Google Pixel 8",
    "Google Pixel 9",
    "Honor Magic 6",
    "Huawei P60 Pro",
  ],
  RACUNARI: [
    "MacBook Air M1",
    "MacBook Air M2",
    "MacBook Pro M3",
    "Lenovo ThinkPad T14",
    "Dell XPS 13",
    "HP ProBook",
    "Asus ZenBook",
    "RTX 3060",
    "RTX 4070",
    "Ryzen 7 5800X",
    "Ryzen 5 7600",
    "Intel i7 12700",
  ],
  BICIKLI: [
    "Trek Marlin 7",
    "Cube Aim",
    "Specialized Rockhopper",
    "Capriolo Passion",
    "Cross GRX",
    "BTwin Rockrider",
    "Giant Talon",
    "Scott Aspect",
    "Merida Big Nine",
    "Cannondale Trail 5",
  ],
  NEKRETNINE: [
    "Garsonjera Novi Beograd",
    "Stan Zvezdara",
    "Stan Novi Sad",
    "Kuca Surcin",
    "Plac Fruska gora",
    "Lokal centar",
    "Stan Vracar",
    "Stan Nis centar",
    "Kuca Novi Sad",
  ],
  SVE: ["Audi", "iPhone", "Stan", "MacBook", "Yamaha", "Bicikl"],
};

const WEB_PREVIEW_ALERT: AlertItem = {
  id: "preview-web-alert",
  category: "AUTOMOBILI",
  keywords: ["Audi", "A4", "2.0", "TDI"],
  priceMax: 11900,
  locationText: "Beograd",
  isActive: true,
  isPreview: true,
};

function normalizeText(value: string): string {
  // Cirilica i latinica se svode na isti oblik, pa predlozi rade i kad
  // korisnik kuca "Гoлф" umesto "Golf".
  return normalizeSearchText(value).replace(/[^a-z0-9 -]/g, "").trim();
}

function getCategoryLabel(category: Category): string {
  return CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}

function getPlaceholder(category: Category | null): string {
  if (category === "AUTOMOBILI") return "Npr. Audi A4";
  if (category === "AUTO_DELOVI") return "Npr. Audi A6 diferencijal";
  if (category === "MOTORI") return "Npr. Yamaha MT-07";
  if (category === "MOTO_DELOVI") return "Npr. R6 plastike";
  if (category === "MOTO_OPREMA") return "Npr. Moto kaciga";
  if (category === "TELEFONI") return "Npr. iPhone 15 Pro";
  if (category === "RACUNARI") return "Npr. MacBook Air M2";
  if (category === "BICIKLI") return "Npr. Trek Marlin 7";
  if (category === "NEKRETNINE") return "Npr. Stan Zvezdara";
  if (category === "SVE") return "Npr. Dyson ili Lego";
  return "Naziv proizvoda";
}

function getCategoryIcon(category: Category): React.ComponentProps<typeof Ionicons>["name"] {
  if (category === "AUTOMOBILI") return "car-sport";
  if (category === "AUTO_DELOVI") return "build";
  if (category === "MOTORI") return "speedometer";
  if (category === "MOTO_DELOVI") return "construct";
  if (category === "MOTO_OPREMA") return "shield-checkmark";
  if (category === "TELEFONI") return "phone-portrait";
  if (category === "RACUNARI") return "desktop";
  if (category === "BICIKLI") return "bicycle";
  if (category === "NEKRETNINE") return "business";
  if (category === "SVE") return "apps";
  return "radio";
}

export default function AlertsScreen() {
  const {
    deviceId,
    loading: deviceLoading,
    error: deviceError,
    notificationMode,
    pushReason,
    ensureDeviceRegistered,
    invalidateDeviceRegistration,
  } = useDevice();
  const { profile, refresh: refreshProfile } = useAccountProfile(deviceId);

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );

  const [items, setItems] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [productName, setProductName] = useState("");
  const [priceText, setPriceText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [yearFromText, setYearFromText] = useState("");
  const [yearToText, setYearToText] = useState("");
  const [kmFromText, setKmFromText] = useState("");
  const [kmToText, setKmToText] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [bodyTypes, setBodyTypes] = useState<string[]>([]);
  const [motoTypes, setMotoTypes] = useState<string[]>([]);
  const [regions, setRegions] = useState<RegionCode[]>([]);
  const [ccmFromText, setCcmFromText] = useState("");
  const [ccmToText, setCcmToText] = useState("");
  // Kad je postavljen, forma radi u rezimu izmene postojeceg signala (PATCH),
  // a ne kreiranja novog (POST).
  const [editingId, setEditingId] = useState<string | null>(null);
  const listRef = useRef<FlatList<AlertItem>>(null);

  const fetchAlerts = useCallback(
    async (isRetry = false): Promise<void> => {
      if (!deviceId) return;
      setLoadingAlerts(true);
      try {
        const res = await fetch(`${API_URL}/alerts/${deviceId}`);

        if (res.status === 404 && !isRetry) {
          // Lokalno sacuvan deviceId vise ne postoji na serveru (npr. stara
          // instalacija gadjala je drugi backend). Tiho registrujemo nov
          // uredjaj i probamo jednom ponovo, bez da korisnik ista primeti.
          await invalidateDeviceRegistration();
          await ensureDeviceRegistered();
          return fetchAlerts(true);
        }

        if (!res.ok) {
          setFormError(
            res.status >= 500
              ? "Server trenutno nije dostupan. Pokusaj ponovo za par trenutaka."
              : "Ucitavanje signala nije uspelo. Povuci na dole da osvezis stranicu.",
          );
          return;
        }
        const data = await res.json();
        setItems(data);
        setFormError(null);
      } catch {
        setFormError("Ucitavanje signala nije uspelo. Proveri internet konekciju i pokusaj ponovo.");
      } finally {
        setLoadingAlerts(false);
      }
    },
    [deviceId, ensureDeviceRegistered, invalidateDeviceRegistration],
  );

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  const isWebPreview = Platform.OS === "web" && items.length === 0;
  const displayItems = isWebPreview ? [WEB_PREVIEW_ALERT] : items;
  const isDrugarskiActive = profile?.user?.promoCodeUsed === DRUGARSKI_PROMO_CODE;
  const alertLimit =
    profile?.alertLimit && profile.alertLimit > 0
      ? profile.alertLimit
      : isDrugarskiActive
        ? 5
        : 0;
  const isPlanLocked = alertLimit === 0;
  // Limit plana se odnosi na UKLJUCENE signale. Pauzirani signal ne zauzima
  // aktivno mesto - ostaje sacuvan "u rezervi" (do jos toliko komada), pa
  // korisnik moze da pauzira jedan i odmah napravi/ukljuci drugi.
  const draftLimit = profile?.draftLimit ?? alertLimit;
  const totalAlertLimit = profile?.totalAlertLimit ?? alertLimit + draftLimit;
  const activeCount = displayItems.filter((item) => item.isActive).length;
  const activeLimitReached = !isPlanLocked && activeCount >= alertLimit;
  const totalLimitReached = !isPlanLocked && items.length >= totalAlertLimit;
  // Kad su sva aktivna mesta popunjena, nov signal se cuva kao nacrt (rezerva).
  const savingAsDraft = activeLimitReached && !totalLimitReached && !editingId;

  const resetForm = useCallback(() => {
    setStep(0);
    setCategory(null);
    setProductName("");
    setPriceText("");
    setShowAdvanced(false);
    setYearFromText("");
    setYearToText("");
    setKmFromText("");
    setKmToText("");
    setPropertyType(null);
    setFuelTypes([]);
    setBodyTypes([]);
    setMotoTypes([]);
    setRegions([]);
    setCcmFromText("");
    setCcmToText("");
    setEditingId(null);
    setFormError(null);
  }, []);

  // Otvara istu formu popunjenu podacima signala. Ne dira signal na serveru dok
  // korisnik ne potvrdi izmenu (originalni signal ostaje netaknut ako odustane).
  const startEdit = useCallback((item: AlertItem) => {
    setEditingId(item.id);
    setCategory(item.category);
    setProductName(item.keywords.join(" "));
    setPriceText(
      typeof item.priceMax === "number" && item.priceMax > 0 ? String(item.priceMax) : "",
    );
    setPropertyType(item.propertyType ?? null);
    setFuelTypes(item.fuelTypes ?? []);
    setBodyTypes(item.bodyTypes ?? []);
    setMotoTypes(item.motoTypes ?? []);
    setRegions(item.regions ?? []);
    setCcmFromText(item.ccmFrom != null ? String(item.ccmFrom) : "");
    setCcmToText(item.ccmTo != null ? String(item.ccmTo) : "");
    setYearFromText(item.yearFrom != null ? String(item.yearFrom) : "");
    setYearToText(item.yearTo != null ? String(item.yearTo) : "");
    setKmFromText(item.kmFrom != null ? String(item.kmFrom) : "");
    setKmToText(item.kmTo != null ? String(item.kmTo) : "");
    setShowAdvanced(
      !!item.locationText ||
        item.yearFrom != null ||
        item.yearTo != null ||
        item.kmFrom != null ||
        item.kmTo != null ||
        (item.fuelTypes?.length ?? 0) > 0 ||
        (item.bodyTypes?.length ?? 0) > 0 ||
        (item.motoTypes?.length ?? 0) > 0 ||
        (item.regions?.length ?? 0) > 0 ||
        item.ccmFrom != null ||
        item.ccmTo != null,
    );
    setStep(2);
    setFormError(null);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const toggleItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/alerts/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) {
        throw new Error(
          await parseApiErrorMessage(res, "Promena statusa nije uspela. Pokušaj ponovo."),
        );
      }
      const updated = await res.json();
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      void refreshProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    }
  }, [refreshProfile]);

  const deleteItem = useCallback((id: string) => {
    Alert.alert("Brisanje", "Da li sigurno zelis da obrises signal?", [
      { text: "Otkazi", style: "cancel" },
      {
        text: "Obrisi",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/alerts/${id}`, { method: "DELETE" });
            if (!res.ok) {
              throw new Error(
                await parseApiErrorMessage(res, "Brisanje nije uspelo. Pokušaj ponovo."),
              );
            }
            setItems((prev) => prev.filter((item) => item.id !== id));
            void refreshProfile();
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setFormError(message);
          }
        },
      },
    ]);
  }, [refreshProfile]);

  const suggestions = useMemo(() => {
    if (!category) return [];
    const q = normalizeText(productName);
    const source = CATALOG[category] ?? [];

    if (!q) return source.slice(0, 6);

    const starts = source.filter((item) => normalizeText(item).startsWith(q));
    const contains = source.filter(
      (item) => !starts.includes(item) && normalizeText(item).includes(q),
    );

    return [...starts, ...contains].slice(0, 6);
  }, [category, productName]);

  const isNameOk = productName.trim().length > 0;
  const isAllCategory = category === "SVE";
  const isPropertyRequired = category === "NEKRETNINE";
  const isPropertyOk = !isPropertyRequired || !!propertyType;
  const priceNum = Number(priceText.replace(",", "."));
  const isPriceOk = isAllCategory || (Number.isFinite(priceNum) && priceNum > 0);
  const showYearFilter = !!category && YEAR_FILTER_CATEGORIES.has(category);
  const showKmFilter = !!category && KM_FILTER_CATEGORIES.has(category);
  const showVehicleFilters = !!category && VEHICLE_FILTER_CATEGORIES.has(category);
  const showMotoFilters = !!category && MOTO_FILTER_CATEGORIES.has(category);

  const toggleInList = (value: string, list: string[]): string[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const toggleRegion = useCallback((code: RegionCode) => {
    setRegions((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  }, []);

  const yearFromNum = yearFromText.trim() ? Number(yearFromText) : null;
  const yearToNum = yearToText.trim() ? Number(yearToText) : null;
  const kmFromNum = kmFromText.trim() ? Number(kmFromText) : null;
  const kmToNum = kmToText.trim() ? Number(kmToText) : null;

  const isYearRangeOk =
    !showYearFilter ||
    ((yearFromNum === null || Number.isFinite(yearFromNum)) &&
    (yearToNum === null || Number.isFinite(yearToNum)) &&
    (yearFromNum === null || yearToNum === null || yearFromNum <= yearToNum));

  const ccmFromNum = ccmFromText.trim() ? Number(ccmFromText) : null;
  const ccmToNum = ccmToText.trim() ? Number(ccmToText) : null;

  const isCcmRangeOk =
    !showMotoFilters ||
    ((ccmFromNum === null || Number.isFinite(ccmFromNum)) &&
      (ccmToNum === null || Number.isFinite(ccmToNum)) &&
      (ccmFromNum === null || ccmToNum === null || ccmFromNum <= ccmToNum));

  const isKmRangeOk =
    !showKmFilter ||
    ((kmFromNum === null || Number.isFinite(kmFromNum)) &&
    (kmToNum === null || Number.isFinite(kmToNum)) &&
    (kmFromNum === null || kmToNum === null || kmFromNum <= kmToNum));

  const primaryLabel =
    savingAlert
      ? "Cuvam..."
      : step === 2 || (step === 1 && isAllCategory)
        ? editingId
          ? "Sacuvaj izmene"
          : savingAsDraft
            ? "Sacuvaj u rezervu"
            : "Sacuvaj"
        : "Sledece";

  const primaryDisabled =
    savingAlert ||
    (step === 0 && !category) ||
    (step === 1 && !isNameOk) ||
    (step === 2 && (!isPriceOk || !isPropertyOk || !isYearRangeOk || !isKmRangeOk || !isCcmRangeOk));

  const onPrimary = useCallback(async () => {
    if (primaryDisabled) return;
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }

    if (!isYearRangeOk) {
      setFormError("Raspon godista nije validan.");
      return;
    }

    if (!isKmRangeOk) {
      setFormError("Raspon kilometraze nije validan.");
      return;
    }

    if (!isCcmRangeOk) {
      setFormError("Raspon kubikaze nije validan.");
      return;
    }

    if (!isPropertyOk) {
      setFormError("Za nekretnine je obavezno izabrati tip (stan/lokal/parcela).");
      setStep(2);
      return;
    }

    if (!category) {
      setFormError("Kategorija nije izabrana.");
      return;
    }

    try {
      setSavingAlert(true);
      setFormError(null);

      const ensuredDeviceId = await ensureDeviceRegistered();
      const payload = {
        deviceId: ensuredDeviceId,
        category,
        keywords: productName.trim().split(/\s+/).filter(Boolean),
        priceMax: isAllCategory ? null : Math.round(priceNum),
        locationText: "",
        regions,
        propertyType: category === "NEKRETNINE" ? propertyType : null,
        yearFrom: showYearFilter ? yearFromNum : null,
        yearTo: showYearFilter ? yearToNum : null,
        kmFrom: showKmFilter ? kmFromNum : null,
        kmTo: showKmFilter ? kmToNum : null,
        fuelTypes: showVehicleFilters ? fuelTypes : [],
        bodyTypes: showVehicleFilters ? bodyTypes : [],
        motoTypes: showMotoFilters ? motoTypes : [],
        ccmFrom: showMotoFilters ? ccmFromNum : null,
        ccmTo: showMotoFilters ? ccmToNum : null,
        isActive: !savingAsDraft,
      };

      const res = await fetch(`${API_URL}/alerts${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await parseApiErrorMessage(res, "Čuvanje nije uspelo. Pokušaj ponovo."));
      }

      const savedAlert = await res.json();
      if (!savedAlert?.id) {
        throw new Error("Backend je vratio nevalidan odgovor za signal.");
      }

      setItems((prev) =>
        editingId
          ? prev.map((item) => (item.id === editingId ? savedAlert : item))
          : [savedAlert, ...prev],
      );
      resetForm();
      void refreshProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    } finally {
      setSavingAlert(false);
    }
  }, [
    bodyTypes,
    category,
    ccmFromNum,
    ccmToNum,
    editingId,
    ensureDeviceRegistered,
    fuelTypes,
    isAllCategory,
    isCcmRangeOk,
    isKmRangeOk,
    isPropertyOk,
    isYearRangeOk,
    kmFromNum,
    kmToNum,
    propertyType,
    priceNum,
    primaryDisabled,
    regions,
    productName,
    refreshProfile,
    resetForm,
    savingAsDraft,
    motoTypes,
    showKmFilter,
    showMotoFilters,
    showVehicleFilters,
    showYearFilter,
    step,
    yearFromNum,
    yearToNum,
  ]);

  if (deviceLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={NeoTheme.colors.lime} />
          <Text style={styles.centerText}>Registrovanje uredjaja...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deviceId && deviceError && Platform.OS !== "web") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Greska pri registraciji</Text>
          <Text style={styles.errorText}>{deviceError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {loadingAlerts ? (
          <ActivityIndicator style={{ marginTop: rs(32) }} color={NeoTheme.colors.lime} />
        ) : (
          <FlatList
            ref={listRef}
            data={displayItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <>
                <AppHeader
                  rightLabel="Signali"
                  rightIcon="pulse"
                  rightCount={`${profile?.activeSignalCount ?? activeCount}/${alertLimit}`}
                />

                <LinearGradient
                  colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.06)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroEyebrow}>Lovac na Oglase</Text>
                    <Text style={styles.heroTitle}>Podesi signal za sledeci dobar oglas.</Text>
                    <Text style={styles.heroBody}>
                      Aktivni limit je {alertLimit} signala, sa preciznim kljucnim recima i cenom koju aplikacija prati.
                    </Text>
                  </View>
                  <View style={styles.heroMeta}>
                    <Text style={styles.heroMetaLabel}>Korak</Text>
                    <Text style={styles.heroMetaValue}>{step + 1}/3</Text>
                  </View>
                </LinearGradient>

                {notificationMode === "mock" && (
                  <View style={styles.infoBox}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={NeoTheme.colors.lime}
                    />
                    <Text style={styles.infoText}>
                      {pushReason === "permission"
                        ? "Notifikacije su iskljucene jer nisi dao dozvolu telefonu. Ukljuci ih u podesavanjima telefona da bi primao push obavestenja o novim oglasima."
                        : "Emulator mod: signali rade, ali remote push testiraj na fizickom uredjaju."}
                    </Text>
                  </View>
                )}

                {deviceError && Platform.OS === "web" && (
                  <View style={styles.infoBox}>
                    <Ionicons
                      name="warning-outline"
                      size={18}
                      color={NeoTheme.colors.lime}
                    />
                    <Text style={styles.infoText}>
                      Web preview mod: prikazan je jedan test signal iako registracija uredjaja nije dostupna.
                    </Text>
                  </View>
                )}

                {isPlanLocked ? (
                  <View style={styles.maxCard}>
                    <Text style={styles.maxCardTitle}>FREE plan je zakljucan</Text>
                    <Text style={styles.maxCardText}>
                      Nadogradi plan na Profil ekranu da otkljucas signale.
                    </Text>
                  </View>
                ) : totalLimitReached && !editingId ? (
                  <View style={styles.maxCard}>
                    <Text style={styles.maxCardTitle}>
                      Dosegnut limit od {totalAlertLimit} signala
                    </Text>
                    <Text style={styles.maxCardText}>
                      Plan ti dozvoljava {alertLimit} ukljucenih i jos {draftLimit} sacuvanih
                      u rezervi. Obrisi neki postojeci signal da bi dodao nov.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.formCard}>
                    <View style={styles.formTopRow}>
                      <Text style={styles.formTitle}>{editingId ? "Izmena signala" : "Novi signal"}</Text>
                    </View>

                    {savingAsDraft && (
                      <View style={styles.infoBoxInline}>
                        <Ionicons name="bookmark-outline" size={16} color={NeoTheme.colors.lime} />
                        <Text style={styles.infoTextInline}>
                          Sva aktivna mesta su popunjena ({activeCount}/{alertLimit}). Ovaj signal
                          se cuva u rezervi - ukljuci ga kad pauziras neki drugi.
                        </Text>
                      </View>
                    )}

                    <View style={styles.stepTrack}>
                      {[0, 1, 2].map((stepIndex) => (
                        <View
                          key={stepIndex}
                          style={[
                            styles.stepSegment,
                            stepIndex <= step && styles.stepSegmentActive,
                          ]}
                        />
                      ))}
                    </View>

                    {(step === 0 || !!editingId) && (
                      <View style={styles.categoryGrid}>
                        {CATEGORY_OPTIONS.map((option) => (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setCategory(option.value);
                              if (formError) setFormError(null);
                            }}
                            style={({ pressed }) => [
                              styles.categoryPill,
                              category === option.value && styles.categoryPillActive,
                              pressed && styles.pressed,
                            ]}
                          >
                            <View style={styles.categoryPillRow}>
                              <Text
                                style={[
                                  styles.categoryPillText,
                                  category === option.value && styles.categoryPillTextActive,
                                ]}
                              >
                                {option.label}
                              </Text>
                              {option.beta && (
                                <View style={styles.betaBadge}>
                                  <Text style={styles.betaBadgeText}>BETA</Text>
                                </View>
                              )}
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {step >= 1 && category && (
                      <View style={styles.inputBlock}>
                        <Text style={styles.label}>Kategorija: {getCategoryLabel(category)}</Text>
                        {category === "SVE" && (
                          <View style={styles.infoBoxInline}>
                            <Ionicons name="warning-outline" size={16} color={NeoTheme.colors.lime} />
                            <Text style={styles.infoTextInline}>
                              Kategorija SVE pretrazuje samo po kljucnoj reci i moze vratiti veliki broj oglasa.
                            </Text>
                          </View>
                        )}
                        {(category === "MOTO_DELOVI" || category === "MOTO_OPREMA") && (
                          <View style={styles.infoBoxInline}>
                            <Ionicons name="flask-outline" size={16} color={NeoTheme.colors.lime} />
                            <Text style={styles.infoTextInline}>
                              BETA: moto delovi/oprema se trenutno uzimaju sa pretrage, ne striktno poslednja 24h.
                            </Text>
                          </View>
                        )}
                        <TextInput
                          value={productName}
                          onChangeText={(value) => {
                            setProductName(value);
                            if (formError) setFormError(null);
                          }}
                          placeholder={getPlaceholder(category)}
                          placeholderTextColor={NeoTheme.colors.textDim}
                          style={styles.input}
                          returnKeyType="next"
                          onSubmitEditing={() => {
                            if (productName.trim()) setStep(2);
                          }}
                        />

                        {suggestions.length > 0 && (
                          <View style={styles.suggestionsWrap}>
                            {suggestions.map((suggestion) => (
                              <Pressable
                                key={suggestion}
                                onPress={() => {
                                  setProductName(suggestion);
                                  if (formError) setFormError(null);
                                }}
                                style={({ pressed }) => [
                                  styles.suggestionItem,
                                  pressed && styles.pressed,
                                ]}
                              >
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                              </Pressable>
                            ))}
                          </View>
                        )}

                        {category === "NEKRETNINE" && (
                          <View style={styles.inlinePickerWrap}>
                            <Text style={styles.label}>Tip nekretnine (obavezno)</Text>
                            <View style={styles.inlinePickerRow}>
                              {PROPERTY_OPTIONS.map((option) => (
                                <Pressable
                                  key={option.value}
                                  onPress={() => setPropertyType(option.value)}
                                  style={({ pressed }) => [
                                    styles.inlinePickerChip,
                                    propertyType === option.value && styles.inlinePickerChipActive,
                                    pressed && styles.pressed,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.inlinePickerChipText,
                                      propertyType === option.value && styles.inlinePickerChipTextActive,
                                    ]}
                                  >
                                    {option.label}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        )}

                        <Pressable
                          onPress={() => setShowAdvanced((prev) => !prev)}
                          style={({ pressed }) => [styles.advancedToggle, pressed && styles.pressed]}
                        >
                          <Text style={styles.advancedToggleText}>
                            {showAdvanced ? "Sakrij vise opcija" : "Prikazi vise opcija"}
                          </Text>
                        </Pressable>

                        {showAdvanced && (
                          <View style={styles.advancedWrap}>
                            <Text style={styles.label}>Lokacija - regioni (opciono)</Text>
                            <SerbiaRegionMap selected={regions} onToggle={toggleRegion} />

                            {showMotoFilters && (
                              <>
                                <Text style={styles.label}>Tip motora (opciono)</Text>
                                <View style={styles.inlinePickerRow}>
                                  {MOTO_TYPE_OPTIONS.map((option) => (
                                    <Pressable
                                      key={option.value}
                                      onPress={() =>
                                        setMotoTypes((prev) => toggleInList(option.value, prev))
                                      }
                                      style={({ pressed }) => [
                                        styles.inlinePickerChip,
                                        motoTypes.includes(option.value) &&
                                          styles.inlinePickerChipActive,
                                        pressed && styles.pressed,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.inlinePickerChipText,
                                          motoTypes.includes(option.value) &&
                                            styles.inlinePickerChipTextActive,
                                        ]}
                                      >
                                        {option.label}
                                      </Text>
                                    </Pressable>
                                  ))}
                                </View>

                                <Text style={styles.label}>Kubikaza u ccm (opciono)</Text>
                                <View style={styles.rangeRow}>
                                  <TextInput
                                    value={ccmFromText}
                                    onChangeText={setCcmFromText}
                                    placeholder="Od"
                                    placeholderTextColor={NeoTheme.colors.textDim}
                                    style={[styles.input, styles.rangeInput]}
                                    keyboardType="numeric"
                                  />
                                  <TextInput
                                    value={ccmToText}
                                    onChangeText={setCcmToText}
                                    placeholder="Do"
                                    placeholderTextColor={NeoTheme.colors.textDim}
                                    style={[styles.input, styles.rangeInput]}
                                    keyboardType="numeric"
                                  />
                                </View>
                              </>
                            )}

                            {showVehicleFilters && (
                              <>
                                <Text style={styles.label}>Vrsta goriva (opciono)</Text>
                                <View style={styles.inlinePickerRow}>
                                  {FUEL_OPTIONS.map((option) => (
                                    <Pressable
                                      key={option.value}
                                      onPress={() =>
                                        setFuelTypes((prev) => toggleInList(option.value, prev))
                                      }
                                      style={({ pressed }) => [
                                        styles.inlinePickerChip,
                                        fuelTypes.includes(option.value) &&
                                          styles.inlinePickerChipActive,
                                        pressed && styles.pressed,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.inlinePickerChipText,
                                          fuelTypes.includes(option.value) &&
                                            styles.inlinePickerChipTextActive,
                                        ]}
                                      >
                                        {option.label}
                                      </Text>
                                    </Pressable>
                                  ))}
                                </View>

                                <Text style={styles.label}>Tip karoserije (opciono)</Text>
                                <View style={styles.inlinePickerRow}>
                                  {BODY_OPTIONS.map((option) => (
                                    <Pressable
                                      key={option.value}
                                      onPress={() =>
                                        setBodyTypes((prev) => toggleInList(option.value, prev))
                                      }
                                      style={({ pressed }) => [
                                        styles.inlinePickerChip,
                                        bodyTypes.includes(option.value) &&
                                          styles.inlinePickerChipActive,
                                        pressed && styles.pressed,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.inlinePickerChipText,
                                          bodyTypes.includes(option.value) &&
                                            styles.inlinePickerChipTextActive,
                                        ]}
                                      >
                                        {option.label}
                                      </Text>
                                    </Pressable>
                                  ))}
                                </View>

                                {(fuelTypes.length > 0 || bodyTypes.length > 0) && (
                                  <View style={styles.infoBoxInline}>
                                    <Ionicons
                                      name="information-circle-outline"
                                      size={16}
                                      color={NeoTheme.colors.lime}
                                    />
                                    <Text style={styles.infoTextInline}>
                                      Oglasi kod kojih se gorivo/karoserija ne mogu prepoznati
                                      nece biti poslati dok je ovaj filter ukljucen.
                                    </Text>
                                  </View>
                                )}
                              </>
                            )}

                            {showYearFilter && (
                              <>
                                <Text style={styles.label}>Godiste (opciono)</Text>
                                <View style={styles.rangeRow}>
                                  <TextInput
                                    value={yearFromText}
                                    onChangeText={setYearFromText}
                                    placeholder="Od"
                                    placeholderTextColor={NeoTheme.colors.textDim}
                                    style={[styles.input, styles.rangeInput]}
                                    keyboardType="numeric"
                                  />
                                  <TextInput
                                    value={yearToText}
                                    onChangeText={setYearToText}
                                    placeholder="Do"
                                    placeholderTextColor={NeoTheme.colors.textDim}
                                    style={[styles.input, styles.rangeInput]}
                                    keyboardType="numeric"
                                  />
                                </View>
                              </>
                            )}

                            {showKmFilter && (
                              <>
                                <Text style={styles.label}>Predjena kilometraza (opciono)</Text>
                                <View style={styles.rangeRow}>
                                  <TextInput
                                    value={kmFromText}
                                    onChangeText={setKmFromText}
                                    placeholder="Od km"
                                    placeholderTextColor={NeoTheme.colors.textDim}
                                    style={[styles.input, styles.rangeInput]}
                                    keyboardType="numeric"
                                  />
                                  <TextInput
                                    value={kmToText}
                                    onChangeText={setKmToText}
                                    placeholder="Do km"
                                    placeholderTextColor={NeoTheme.colors.textDim}
                                    style={[styles.input, styles.rangeInput]}
                                    keyboardType="numeric"
                                  />
                                </View>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    )}

                    {step >= 2 && !isAllCategory && (
                      <View style={styles.inputBlock}>
                        <Text style={styles.label}>Maksimalna cena (EUR)</Text>
                        <TextInput
                          value={priceText}
                          onChangeText={(value) => {
                            setPriceText(value);
                            if (formError) setFormError(null);
                          }}
                          placeholder="Npr. 9500"
                          placeholderTextColor={NeoTheme.colors.textDim}
                          style={styles.input}
                          keyboardType="numeric"
                          returnKeyType="done"
                          onSubmitEditing={onPrimary}
                        />
                      </View>
                    )}

                    {formError && <Text style={styles.formError}>{formError}</Text>}

                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={onPrimary}
                        disabled={primaryDisabled}
                        style={({ pressed }) => [styles.primaryBtnWrapper, pressed && !primaryDisabled && styles.pressed]}
                      >
                        <LinearGradient
                          colors={
                            primaryDisabled
                              ? ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.12)"]
                              : [NeoTheme.colors.limeSoft, NeoTheme.colors.lime]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.primaryBtn}
                        >
                          <Text style={[styles.primaryBtnText, !primaryDisabled && styles.primaryBtnTextActive]}>{primaryLabel}</Text>
                        </LinearGradient>
                      </Pressable>

                      {(step !== 0 || category) && (
                        <Pressable
                          onPress={resetForm}
                          style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.ghostBtnText}>
                            {editingId ? "Odustani" : "Ponisti"}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Moji signali</Text>
                </View>
              </>
            }
            renderItem={({ item }) => (
              <View style={styles.alertCard}>
                <View style={[styles.statusBadge, item.isActive ? styles.statusBadgeActive : styles.statusBadgePaused]}>
                  <Text style={[styles.statusBadgeText, !item.isActive && styles.statusBadgeTextPaused]}>
                    {item.isActive ? "AKTIVNO" : "PAUZA"}
                  </Text>
                </View>

                <View style={styles.alertMainRow}>
                  <View style={styles.alertAvatar}>
                    <Ionicons name={getCategoryIcon(item.category)} size={20} color="rgba(215, 242, 13, 1)" />
                  </View>

                  <View style={styles.alertCopy}>
                    <Text style={styles.alertCategory}>{getCategoryLabel(item.category)}</Text>
                    <Text style={styles.alertTitle}>{item.keywords.join(" ")}</Text>
                    <View style={styles.alertMetaRow}>
                      <Text style={styles.alertPrice}>
                        {typeof item.priceMax === "number"
                          ? `${item.priceMax.toLocaleString("sr-RS")} EUR`
                          : "Bez ogranicenja cene"}
                      </Text>
                    </View>
                    {(item.locationText || item.regions?.length || item.propertyType || item.yearFrom || item.yearTo || item.kmFrom || item.kmTo || item.fuelTypes?.length || item.bodyTypes?.length || item.motoTypes?.length || item.ccmFrom || item.ccmTo) && (
                      <Text style={styles.alertFiltersText}>
                        {[
                          item.regions?.length
                            ? `Regioni: ${item.regions
                                .map(
                                  (code) =>
                                    SERBIA_REGIONS.find((region) => region.code === code)?.label ??
                                    code,
                                )
                                .join(", ")}`
                            : null,
                          item.locationText ? `Lokacija: ${item.locationText}` : null,
                          item.propertyType ? `Tip: ${item.propertyType}` : null,
                          item.yearFrom || item.yearTo
                            ? `Godiste: ${item.yearFrom ?? "-"}-${item.yearTo ?? "-"}`
                            : null,
                          item.kmFrom || item.kmTo
                            ? `KM: ${item.kmFrom ?? "-"}-${item.kmTo ?? "-"}`
                            : null,
                          item.fuelTypes?.length
                            ? `Gorivo: ${item.fuelTypes
                                .map(
                                  (value) =>
                                    FUEL_OPTIONS.find((option) => option.value === value)?.label ??
                                    value,
                                )
                                .join(", ")}`
                            : null,
                          item.motoTypes?.length
                            ? `Tip motora: ${item.motoTypes
                                .map(
                                  (value) =>
                                    MOTO_TYPE_OPTIONS.find((option) => option.value === value)
                                      ?.label ?? value,
                                )
                                .join(", ")}`
                            : null,
                          item.ccmFrom || item.ccmTo
                            ? `Kubikaza: ${item.ccmFrom ?? "-"}-${item.ccmTo ?? "-"} ccm`
                            : null,
                          item.bodyTypes?.length
                            ? `Karoserija: ${item.bodyTypes
                                .map(
                                  (value) =>
                                    BODY_OPTIONS.find((option) => option.value === value)?.label ??
                                    value,
                                )
                                .join(", ")}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.alertActions}>
                  <Pressable
                    onPress={() => {
                      if (!item.isPreview) {
                        void toggleItem(item.id);
                      }
                    }}
                    style={({ pressed }) => [
                      item.isActive ? styles.pauseBtn : styles.enableBtn,
                      item.isPreview && styles.disabledPreviewAction,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={item.isActive ? styles.pauseBtnText : styles.enableBtnText}>
                      {item.isPreview ? "Demo" : item.isActive ? "Pauziraj" : "Ukljuci"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (!item.isPreview) {
                        startEdit(item);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.editBtn,
                      item.isPreview && styles.disabledPreviewAction,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.editBtnText}>Izmeni</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (!item.isPreview) {
                        deleteItem(item.id);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      item.isPreview && styles.disabledPreviewAction,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.deleteBtnText}>{item.isPreview ? "Test" : "Obrisi"}</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Nema signala</Text>
                <Text style={styles.emptyText}>Dodaj prvi signal i kreni sa pracenjem oglasa.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
    paddingHorizontal: rs(24),
    paddingTop: rs(10),
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: rs(10),
  },
  centerText: {
    color: NeoTheme.colors.text,
    fontSize: rf(16),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  headerRow: {
    marginBottom: rs(2),
  },
  counterBox: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: rs(12),
    paddingHorizontal: rs(12),
    paddingVertical: rs(7),
  },
  counterValue: {
    color: NeoTheme.colors.text,
    fontSize: rf(22),
    fontFamily: NeoTheme.fonts.bold,
  },
  counterMax: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  counterDangerText: {
    color: NeoTheme.colors.danger,
  },
  heroCard: {
    borderRadius: rs(20),
    padding: rs(18),
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: rs(14),
    ...neoShadow,
  },
  heroCopy: {
    flex: 1,
    paddingRight: rs(18),
  },
  heroEyebrow: {
    color: NeoTheme.colors.lime,
    fontSize: rf(12),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(8),
  },
  heroTitle: {
    color: NeoTheme.colors.text,
    fontSize: rf(24),
    lineHeight: rf(28),
    fontFamily: NeoTheme.fonts.bold,
    marginBottom: rs(8),
  },
  heroBody: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(12),
    lineHeight: rf(17),
    fontFamily: NeoTheme.fonts.medium,
  },
  heroMeta: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(16),
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMetaLabel: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(11),
    fontFamily: NeoTheme.fonts.medium,
  },
  heroMetaValue: {
    color: NeoTheme.colors.lime,
    fontSize: rf(20),
    fontFamily: NeoTheme.fonts.bold,
    marginTop: rs(4),
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: rs(16),
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
    marginBottom: rs(12),
  },
  infoText: {
    flex: 1,
    color: NeoTheme.colors.textMuted,
    fontSize: rf(12),
    lineHeight: rf(17),
    fontFamily: NeoTheme.fonts.medium,
  },
  maxCard: {
    borderRadius: rs(18),
    padding: rs(16),
    backgroundColor: NeoTheme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255,103,103,0.34)",
    marginBottom: rs(18),
  },
  maxCardTitle: {
    color: NeoTheme.colors.text,
    fontSize: rf(16),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(6),
  },
  maxCardText: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(12),
    lineHeight: rf(17),
    fontFamily: NeoTheme.fonts.medium,
  },
  formCard: {
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    borderRadius: rs(20),
    padding: rs(16),
    marginBottom: rs(16),
    ...neoShadow,
  },
  formTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rs(14),
  },
  formTitle: {
    color: NeoTheme.colors.text,
    fontSize: rf(24),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  stepTrack: {
    flexDirection: "row",
    gap: rs(8),
    marginBottom: rs(16),
  },
  stepSegment: {
    flex: 1,
    height: rs(3),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  stepSegmentActive: {
    backgroundColor: NeoTheme.colors.lime,
    ...neoGlow,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(10),
  },
  categoryPill: {
    minWidth: "48%",
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
  },
  categoryPillActive: {
    backgroundColor: NeoTheme.colors.lime,
    borderColor: NeoTheme.colors.lime,
  },
  categoryPillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: rs(8),
  },
  categoryPillText: {
    color: NeoTheme.colors.text,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  categoryPillTextActive: {
    color: NeoTheme.colors.black,
  },
  betaBadge: {
    paddingHorizontal: rs(7),
    paddingVertical: rs(2),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: NeoTheme.colors.lime,
    backgroundColor: "rgba(215,242,13,0.16)",
  },
  betaBadgeText: {
    color: NeoTheme.colors.lime,
    fontSize: rf(10),
    fontFamily: NeoTheme.fonts.bold,
  },
  inputBlock: {
    marginTop: rs(2),
    marginBottom: rs(12),
  },
  infoBoxInline: {
    flexDirection: "row",
    gap: rs(8),
    alignItems: "center",
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: rs(12),
    paddingHorizontal: rs(10),
    paddingVertical: rs(8),
    marginBottom: rs(10),
  },
  infoTextInline: {
    flex: 1,
    color: NeoTheme.colors.textMuted,
    fontSize: rf(11),
    lineHeight: rf(15),
    fontFamily: NeoTheme.fonts.medium,
  },
  inlinePickerWrap: {
    marginTop: rs(10),
    marginBottom: rs(10),
  },
  inlinePickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(8),
  },
  inlinePickerChip: {
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
  },
  inlinePickerChipActive: {
    backgroundColor: NeoTheme.colors.lime,
    borderColor: NeoTheme.colors.lime,
  },
  inlinePickerChipText: {
    color: NeoTheme.colors.text,
    fontSize: rf(12),
    fontFamily: NeoTheme.fonts.medium,
  },
  inlinePickerChipTextActive: {
    color: NeoTheme.colors.black,
  },
  advancedToggle: {
    minHeight: rs(42),
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: NeoTheme.colors.surfaceStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: rs(10),
  },
  advancedToggleText: {
    color: NeoTheme.colors.text,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  advancedWrap: {
    marginTop: rs(12),
    gap: rs(8),
  },
  rangeRow: {
    flexDirection: "row",
    gap: rs(8),
  },
  rangeInput: {
    flex: 1,
  },
  label: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(12),
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: rs(8),
  },
  input: {
    minHeight: rs(52),
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: rs(14),
    backgroundColor: "rgba(255,255,255,0.06)",
    color: NeoTheme.colors.text,
    fontSize: rf(16),
    fontFamily: NeoTheme.fonts.medium,
    paddingHorizontal: rs(14),
  },
  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(8),
    marginTop: rs(10),
  },
  suggestionItem: {
    backgroundColor: "rgba(215,242,13,0.12)",
    borderWidth: 1,
    borderColor: "rgba(215,242,13,0.18)",
    borderRadius: rs(12),
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
  },
  suggestionText: {
    color: NeoTheme.colors.limeSoft,
    fontSize: rf(11),
    fontFamily: NeoTheme.fonts.medium,
  },
  formError: {
    color: NeoTheme.colors.danger,
    fontSize: rf(12),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(10),
  },
  actionsRow: {
    flexDirection: "row",
    gap: rs(10),
    alignItems: "center",
    marginTop: rs(12),
  },
  primaryBtnWrapper: {
    flex: 1,
    flexShrink: 0,
    flexBasis: "60%",
  },
  primaryBtn: {
    height: rs(52),
    borderRadius: rs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: NeoTheme.colors.text,
    fontSize: rf(18),
    fontFamily: NeoTheme.fonts.bold,
  },
  primaryBtnTextActive: {
    color: NeoTheme.colors.black,
  },
  ghostBtn: {
    minHeight: rs(52),
    minWidth: rs(96),
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: rs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    color: NeoTheme.colors.text,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  list: {
    paddingBottom: rs(120),
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: rs(12),
  },
  sectionTitle: {
    color: NeoTheme.colors.lime,
    fontSize: rf(16),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  alertCard: {
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    borderRadius: rs(18),
    padding: rs(14),
    marginBottom: rs(12),
    ...neoShadow,
  },
  alertMainRow: {
    flexDirection: "row",
    gap: rs(12),
  },
  alertAvatar: {
    width: rs(42),
    height: rs(42),
    borderRadius: NeoTheme.radius.xs,
    backgroundColor: "rgba(215, 242, 13, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(215, 242, 13, 0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertCopy: {
    flex: 1,
  },
  alertCategory: {
    color: NeoTheme.colors.lime,
    fontSize: rf(11),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(4),
  },
  alertTitle: {
    color: NeoTheme.colors.text,
    fontSize: rf(18),
    lineHeight: rf(20),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(8),
  },
  alertMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertPrice: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.medium,
  },
  alertFiltersText: {
    marginTop: rs(6),
    color: NeoTheme.colors.textMuted,
    fontSize: rf(11),
    lineHeight: rf(15),
    fontFamily: NeoTheme.fonts.medium,
  },
  statusBadge: {
    position: "absolute",
    top: rs(-11),
    right: rs(10),
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(6),
    borderWidth: 1,
    zIndex: 10,
  },
  statusBadgeActive: {
    backgroundColor: "rgba(0,0,0,0.86)",
    borderColor: "rgba(57, 255, 20, 1)",
  },
  statusBadgePaused: {
    backgroundColor: "rgba(0,0,0,0.86)",
    borderColor: "#FFB400",
  },
  statusBadgeText: {
    color: "rgba(57, 255, 20, 1)",
    fontSize: rf(10),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  statusBadgeTextPaused: {
    color: "#FFB400",
  },
  alertActions: {
    flexDirection: "row",
    gap: rs(8),
    marginTop: rs(14),
  },
  pauseBtn: {
    flex: 1,
    minHeight: rs(38),
    borderRadius: rs(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 1)",
    backgroundColor: "rgba(255, 149, 0, 0.2)",
  },
  pauseBtnText: {
    color: "rgba(255, 149, 0, 1)",
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  enableBtn: {
    flex: 1,
    minHeight: rs(38),
    borderRadius: rs(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NeoTheme.colors.lime,
    ...neoGlow,
  },
  enableBtnText: {
    color: NeoTheme.colors.black,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.bold,
  },
  editBtn: {
    flex: 1,
    minHeight: rs(38),
    borderRadius: rs(12),
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: {
    color: NeoTheme.colors.text,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  deleteBtn: {
    flex: 1,
    minHeight: rs(38),
    borderRadius: rs(12),
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 49, 49, 1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "rgba(255, 49, 49, 1)",
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  disabledPreviewAction: {
    opacity: 0.5,
  },
  emptyBox: {
    marginTop: rs(12),
    alignItems: "center",
    paddingHorizontal: rs(18),
    paddingVertical: rs(22),
    borderRadius: rs(18),
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
  },
  emptyTitle: {
    color: NeoTheme.colors.text,
    fontSize: rf(18),
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: rs(6),
  },
  emptyText: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.medium,
    lineHeight: rf(18),
    textAlign: "center",
  },
  errorTitle: {
    color: NeoTheme.colors.danger,
    fontSize: rf(22),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  errorText: {
    color: NeoTheme.colors.text,
    fontSize: rf(14),
    lineHeight: rf(20),
    fontFamily: NeoTheme.fonts.medium,
    textAlign: "center",
    marginTop: rs(8),
  },
  pressed: {
    opacity: 0.84,
  },
});
