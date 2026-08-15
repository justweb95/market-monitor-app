import { AppHeader } from "@/components/app-header";
import { API_URL } from "@/constants/api";
import { parseApiErrorMessage } from "@/constants/apiError";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { NeoTheme, neoGlow, neoShadow } from "@/constants/neo-theme";
import { DRUGARSKI_PROMO_CODE } from "@/constants/promo";
import { useDevice } from "@/contexts/DeviceContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const LOCATION_OPTIONS = [
  "Svi regioni",
  "Beograd",
  "Novi Sad",
  "Nis",
  "Kragujevac",
  "Subotica",
  "Novi Pazar",
  "Cacak",
  "Kraljevo",
  "Zrenjanin",
  "Pancevo",
  "Smederevo",
];

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
  return value
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();
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
  const [locationText, setLocationText] = useState(LOCATION_OPTIONS[0] ?? "Svi regioni");
  const [yearFromText, setYearFromText] = useState("");
  const [yearToText, setYearToText] = useState("");
  const [kmFromText, setKmFromText] = useState("");
  const [kmToText, setKmToText] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);

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
  const totalCount = displayItems.length;
  const isDrugarskiActive = profile?.user?.promoCodeUsed === DRUGARSKI_PROMO_CODE;
  const alertLimit =
    profile?.alertLimit && profile.alertLimit > 0
      ? profile.alertLimit
      : isDrugarskiActive
        ? 5
        : 0;
  const isPlanLocked = alertLimit === 0;
  const maxReached = !isPlanLocked && items.length >= alertLimit;

  const resetForm = useCallback(() => {
    setStep(0);
    setCategory(null);
    setProductName("");
    setPriceText("");
    setLocationText(LOCATION_OPTIONS[0] ?? "Svi regioni");
    setShowAdvanced(false);
    setYearFromText("");
    setYearToText("");
    setKmFromText("");
    setKmToText("");
    setPropertyType(null);
    setFormError(null);
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

  const yearFromNum = yearFromText.trim() ? Number(yearFromText) : null;
  const yearToNum = yearToText.trim() ? Number(yearToText) : null;
  const kmFromNum = kmFromText.trim() ? Number(kmFromText) : null;
  const kmToNum = kmToText.trim() ? Number(kmToText) : null;

  const isYearRangeOk =
    !showYearFilter ||
    ((yearFromNum === null || Number.isFinite(yearFromNum)) &&
    (yearToNum === null || Number.isFinite(yearToNum)) &&
    (yearFromNum === null || yearToNum === null || yearFromNum <= yearToNum));

  const isKmRangeOk =
    !showKmFilter ||
    ((kmFromNum === null || Number.isFinite(kmFromNum)) &&
    (kmToNum === null || Number.isFinite(kmToNum)) &&
    (kmFromNum === null || kmToNum === null || kmFromNum <= kmToNum));

  const primaryLabel =
    savingAlert
      ? "Cuvam..."
      : step === 2 || (step === 1 && isAllCategory)
        ? "Sacuvaj"
        : "Sledece";

  const primaryDisabled =
    savingAlert ||
    (step === 0 && !category) ||
    (step === 1 && !isNameOk) ||
    (step === 2 && (!isPriceOk || !isPropertyOk || !isYearRangeOk || !isKmRangeOk));

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
        locationText: locationText === "Svi regioni" ? "" : locationText,
        propertyType: category === "NEKRETNINE" ? propertyType : null,
        yearFrom: showYearFilter ? yearFromNum : null,
        yearTo: showYearFilter ? yearToNum : null,
        kmFrom: showKmFilter ? kmFromNum : null,
        kmTo: showKmFilter ? kmToNum : null,
      };

      const res = await fetch(`${API_URL}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await parseApiErrorMessage(res, "Čuvanje nije uspelo. Pokušaj ponovo."));
      }

      const newAlert = await res.json();
      if (!newAlert?.id) {
        throw new Error("Backend je vratio nevalidan odgovor za signal.");
      }

      setItems((prev) => [newAlert, ...prev]);
      resetForm();
      void refreshProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    } finally {
      setSavingAlert(false);
    }
  }, [
    category,
    ensureDeviceRegistered,
    isAllCategory,
    isKmRangeOk,
    isPropertyOk,
    isYearRangeOk,
    kmFromNum,
    kmToNum,
    locationText,
    propertyType,
    priceNum,
    primaryDisabled,
    productName,
    refreshProfile,
    resetForm,
    showKmFilter,
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
          <ActivityIndicator style={{ marginTop: 32 }} color={NeoTheme.colors.lime} />
        ) : (
          <FlatList
            data={displayItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <>
                <AppHeader
                  rightLabel="Signali"
                  rightIcon="pulse"
                  rightCount={`${profile?.signalCount ?? totalCount}/${alertLimit}`}
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
                ) : maxReached ? (
                  <View style={styles.maxCard}>
                    <Text style={styles.maxCardTitle}>Dosegnut limit od {alertLimit} signala</Text>
                    <Text style={styles.maxCardText}>
                      Obrisi ili pauziraj postojeci signal pre dodavanja novog.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.formCard}>
                    <View style={styles.formTopRow}>
                      <Text style={styles.formTitle}>Novi signal</Text>
                    </View>

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

                    {step === 0 && (
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
                            <Text style={styles.label}>Lokacija (opciono)</Text>
                            <View style={styles.inlinePickerRow}>
                              {LOCATION_OPTIONS.map((loc) => (
                                <Pressable
                                  key={loc}
                                  onPress={() => setLocationText(loc)}
                                  style={({ pressed }) => [
                                    styles.inlinePickerChip,
                                    locationText === loc && styles.inlinePickerChipActive,
                                    pressed && styles.pressed,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.inlinePickerChipText,
                                      locationText === loc && styles.inlinePickerChipTextActive,
                                    ]}
                                  >
                                    {loc}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>

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
                          <Text style={styles.ghostBtnText}>Ponisti</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Aktivni signali</Text>
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
                    {(item.locationText || item.propertyType || item.yearFrom || item.yearTo || item.kmFrom || item.kmTo) && (
                      <Text style={styles.alertFiltersText}>
                        {[
                          item.locationText ? `Lokacija: ${item.locationText}` : null,
                          item.propertyType ? `Tip: ${item.propertyType}` : null,
                          item.yearFrom || item.yearTo
                            ? `Godiste: ${item.yearFrom ?? "-"}-${item.yearTo ?? "-"}`
                            : null,
                          item.kmFrom || item.kmTo
                            ? `KM: ${item.kmFrom ?? "-"}-${item.kmTo ?? "-"}`
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
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  centerText: {
    color: NeoTheme.colors.text,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  headerRow: {
    marginBottom: 2,
  },
  counterBox: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  counterValue: {
    color: NeoTheme.colors.text,
    fontSize: 22,
    fontFamily: NeoTheme.fonts.bold,
  },
  counterMax: {
    color: NeoTheme.colors.textMuted,
    fontSize: 14,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  counterDangerText: {
    color: NeoTheme.colors.danger,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    ...neoShadow,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 18,
  },
  heroEyebrow: {
    color: NeoTheme.colors.lime,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 8,
  },
  heroTitle: {
    color: NeoTheme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: NeoTheme.fonts.bold,
    marginBottom: 8,
  },
  heroBody: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: NeoTheme.fonts.medium,
  },
  heroMeta: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMetaLabel: {
    color: NeoTheme.colors.textMuted,
    fontSize: 11,
    fontFamily: NeoTheme.fonts.medium,
  },
  heroMetaValue: {
    color: NeoTheme.colors.lime,
    fontSize: 20,
    fontFamily: NeoTheme.fonts.bold,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: NeoTheme.fonts.medium,
  },
  maxCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: NeoTheme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255,103,103,0.34)",
    marginBottom: 18,
  },
  maxCardTitle: {
    color: NeoTheme.colors.text,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 6,
  },
  maxCardText: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: NeoTheme.fonts.medium,
  },
  formCard: {
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...neoShadow,
  },
  formTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  formTitle: {
    color: NeoTheme.colors.text,
    fontSize: 24,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  stepTrack: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  stepSegment: {
    flex: 1,
    height: 3,
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
    gap: 10,
  },
  categoryPill: {
    minWidth: "48%",
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryPillActive: {
    backgroundColor: NeoTheme.colors.lime,
    borderColor: NeoTheme.colors.lime,
  },
  categoryPillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  categoryPillText: {
    color: NeoTheme.colors.text,
    fontSize: 13,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  categoryPillTextActive: {
    color: NeoTheme.colors.black,
  },
  betaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: NeoTheme.colors.lime,
    backgroundColor: "rgba(215,242,13,0.16)",
  },
  betaBadgeText: {
    color: NeoTheme.colors.lime,
    fontSize: 10,
    fontFamily: NeoTheme.fonts.bold,
  },
  inputBlock: {
    marginTop: 2,
    marginBottom: 12,
  },
  infoBoxInline: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  infoTextInline: {
    flex: 1,
    color: NeoTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: NeoTheme.fonts.medium,
  },
  inlinePickerWrap: {
    marginTop: 10,
    marginBottom: 10,
  },
  inlinePickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inlinePickerChip: {
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlinePickerChipActive: {
    backgroundColor: NeoTheme.colors.lime,
    borderColor: NeoTheme.colors.lime,
  },
  inlinePickerChipText: {
    color: NeoTheme.colors.text,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
  },
  inlinePickerChipTextActive: {
    color: NeoTheme.colors.black,
  },
  advancedToggle: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: NeoTheme.colors.surfaceStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  advancedToggleText: {
    color: NeoTheme.colors.text,
    fontSize: 13,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  advancedWrap: {
    marginTop: 12,
    gap: 8,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
  },
  rangeInput: {
    flex: 1,
  },
  label: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: NeoTheme.colors.text,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.medium,
    paddingHorizontal: 14,
  },
  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  suggestionItem: {
    backgroundColor: "rgba(215,242,13,0.12)",
    borderWidth: 1,
    borderColor: "rgba(215,242,13,0.18)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suggestionText: {
    color: NeoTheme.colors.limeSoft,
    fontSize: 11,
    fontFamily: NeoTheme.fonts.medium,
  },
  formError: {
    color: NeoTheme.colors.danger,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 12,
  },
  primaryBtnWrapper: {
    flex: 1,
    flexShrink: 0,
    flexBasis: "60%",
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: NeoTheme.colors.text,
    fontSize: 18,
    fontFamily: NeoTheme.fonts.bold,
  },
  primaryBtnTextActive: {
    color: NeoTheme.colors.black,
  },
  ghostBtn: {
    minHeight: 52,
    minWidth: 96,
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    color: NeoTheme.colors.text,
    fontSize: 14,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  list: {
    paddingBottom: 120,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: NeoTheme.colors.lime,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  alertCard: {
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    ...neoShadow,
  },
  alertMainRow: {
    flexDirection: "row",
    gap: 12,
  },
  alertAvatar: {
    width: 42,
    height: 42,
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
    fontSize: 11,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 4,
  },
  alertTitle: {
    color: NeoTheme.colors.text,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 8,
  },
  alertMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertPrice: {
    color: NeoTheme.colors.textMuted,
    fontSize: 13,
    fontFamily: NeoTheme.fonts.medium,
  },
  alertFiltersText: {
    marginTop: 6,
    color: NeoTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: NeoTheme.fonts.medium,
  },
  statusBadge: {
    position: "absolute",
    top: -11,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    fontSize: 10,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  statusBadgeTextPaused: {
    color: "#FFB400",
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  pauseBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 1)",
    backgroundColor: "rgba(255, 149, 0, 0.2)",
  },
  pauseBtnText: {
    color: "rgba(255, 149, 0, 1)",
    fontSize: 13,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  enableBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NeoTheme.colors.lime,
    ...neoGlow,
  },
  enableBtnText: {
    color: NeoTheme.colors.black,
    fontSize: 13,
    fontFamily: NeoTheme.fonts.bold,
  },
  deleteBtn: {
    minWidth: 92,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 49, 49, 1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "rgba(255, 49, 49, 1)",
    fontSize: 13,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  disabledPreviewAction: {
    opacity: 0.5,
  },
  emptyBox: {
    marginTop: 12,
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRadius: 18,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
  },
  emptyTitle: {
    color: NeoTheme.colors.text,
    fontSize: 18,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 6,
  },
  emptyText: {
    color: NeoTheme.colors.textMuted,
    fontSize: 14,
    fontFamily: NeoTheme.fonts.medium,
    lineHeight: 18,
    textAlign: "center",
  },
  errorTitle: {
    color: NeoTheme.colors.danger,
    fontSize: 22,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  errorText: {
    color: NeoTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: NeoTheme.fonts.medium,
    textAlign: "center",
    marginTop: 8,
  },
  pressed: {
    opacity: 0.84,
  },
});
