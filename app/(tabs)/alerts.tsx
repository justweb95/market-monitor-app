import { API_URL } from "@/constants/api";
import { useDevice } from "@/hooks/useDevice";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Category =
  | "AUTOMOBILI"
  | "AUTO_DELOVI"
  | "MOTORI"
  | "TELEFONI"
  | "RACUNARI"
  | "BICIKLI"
  | "NEKRETNINE";

type Step = 0 | 1 | 2;

type AlertItem = {
  id: string;
  category: Category;
  keywords: string[];
  priceMax: number;
  isActive: boolean;
};

type CategoryOption = {
  value: Category;
  label: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "AUTOMOBILI", label: "Automobili" },
  { value: "AUTO_DELOVI", label: "Auto delovi" },
  { value: "MOTORI", label: "Motori" },
  { value: "TELEFONI", label: "Telefoni" },
  { value: "RACUNARI", label: "Racunari" },
  { value: "BICIKLI", label: "Bicikli" },
  { value: "NEKRETNINE", label: "Nekretnine" },
];

const CATALOG: Record<Category, string[]> = {
  AUTOMOBILI: [
    "Audi A3",
    "Audi A4",
    "Audi A6",
    "BMW 320",
    "BMW X5",
    "Golf 6",
    "Golf 7",
    "Golf 8",
    "Skoda Octavia",
    "Skoda Superb",
    "Passat B8",
    "Mercedes C220",
    "Mercedes E220",
    "Fiat 500L",
    "Peugeot 308",
    "Toyota Corolla",
    "Renault Clio",
    "Opel Astra",
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
  ],
  NEKRETNINE: [
    "Garsonjera Novi Beograd",
    "Stan Zvezdara",
    "Stan Novi Sad",
    "Kuca Surcin",
    "Plac Fruska gora",
    "Lokal centar",
  ],
};

const PALETTE = {
  bg: "#090A0C",
  slate: "#14161B",
  text: "#F3F6EE",
  line: "#080A05",
  accent: "#A2DC47",
  paper: "#D8F29A",
  white: "#F2FFD3",
  ink: "#15190F",
  red: "#E14545",
  orange: "#F6C173",
  green: "#3AAE55",
  redSoft: "#F07B7B",
  redSoftBorder: "#A63F3F",
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/c/g, "c")
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
  if (category === "TELEFONI") return "Npr. iPhone 15 Pro";
  if (category === "RACUNARI") return "Npr. MacBook Air M2";
  if (category === "BICIKLI") return "Npr. Trek Marlin 7";
  if (category === "NEKRETNINE") return "Npr. Stan Zvezdara";
  return "Naziv proizvoda";
}

export default function AlertsScreen() {
  const {
    deviceId,
    loading: deviceLoading,
    error: deviceError,
    notificationMode,
    ensureDeviceRegistered,
  } = useDevice();

  const [items, setItems] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [productName, setProductName] = useState("");
  const [priceText, setPriceText] = useState("");

  const fetchAlerts = useCallback(async () => {
    if (!deviceId) return;
    setLoadingAlerts(true);
    try {
      const res = await fetch(`${API_URL}/alerts/${deviceId}`);
      if (!res.ok) {
        throw new Error(
          `Ucitavanje obavestenja nije uspelo (${res.status}): ${await res.text()}`,
        );
      }
      const data = await res.json();
      setItems(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    } finally {
      setLoadingAlerts(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const totalCount = items.length;
  const maxReached = totalCount >= 3;

  const resetForm = useCallback(() => {
    setStep(0);
    setCategory(null);
    setProductName("");
    setPriceText("");
    setFormError(null);
  }, []);

  const addTestAlerts = useCallback(async () => {
    try {
      setFormError(null);
      const ensuredDeviceId = await ensureDeviceRegistered();
      const requests = [
        {
          deviceId: ensuredDeviceId,
          category: "AUTOMOBILI",
          keywords: ["Audi", "A4"],
          priceMax: 12000,
          locationText: "",
        },
        {
          deviceId: ensuredDeviceId,
          category: "TELEFONI",
          keywords: ["iPhone", "15"],
          priceMax: 800,
          locationText: "",
        },
      ];

      for (const payload of requests) {
        const res = await fetch(`${API_URL}/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(`Test alert nije sacuvan (${res.status}): ${await res.text()}`);
        }
      }

      await fetchAlerts();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    }
  }, [ensureDeviceRegistered, fetchAlerts]);

  const toggleItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/alerts/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) {
        throw new Error(`Promena statusa nije uspela (${res.status}): ${await res.text()}`);
      }
      const updated = await res.json();
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    }
  }, []);

  const deleteItem = useCallback((id: string) => {
    Alert.alert("Brisanje", "Da li sigurno zelis da obrises obavestenje?", [
      { text: "Otkazi", style: "cancel" },
      {
        text: "Obrisi",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/alerts/${id}`, { method: "DELETE" });
            if (!res.ok) {
              throw new Error(`Brisanje nije uspelo (${res.status}): ${await res.text()}`);
            }
            setItems((prev) => prev.filter((item) => item.id !== id));
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setFormError(message);
          }
        },
      },
    ]);
  }, []);

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
  const priceNum = Number(priceText.replace(",", "."));
  const isPriceOk = Number.isFinite(priceNum) && priceNum > 0;

  const primaryLabel = savingAlert ? "Cuvam..." : step === 2 ? "Sacuvaj" : "Sledece";

  const primaryDisabled =
    savingAlert ||
    (step === 0 && !category) ||
    (step === 1 && !isNameOk) ||
    (step === 2 && !isPriceOk);

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
        priceMax: Math.round(priceNum),
        locationText: "",
      };

      const res = await fetch(`${API_URL}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Cuvanje nije uspelo (${res.status}): ${await res.text()}`);
      }

      const newAlert = await res.json();
      if (!newAlert?.id) {
        throw new Error("Backend je vratio nevalidan odgovor za alert.");
      }

      setItems((prev) => [newAlert, ...prev]);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    } finally {
      setSavingAlert(false);
    }
  }, [
    category,
    ensureDeviceRegistered,
    priceNum,
    primaryDisabled,
    productName,
    resetForm,
    step,
  ]);

  if (deviceLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
        <Text style={styles.centerText}>Registrovanje uredjaja...</Text>
      </View>
    );
  }

  if (deviceError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Greska pri registraciji</Text>
        <Text style={styles.errorText}>{deviceError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bgStripeTop} />
      <View style={styles.bgStripeBottom} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>MARKET HUNTER</Text>
          <Text style={styles.h1}>Obavestenja</Text>
        </View>
        <View style={styles.counterBox}>
          <Text style={[styles.counterValue, maxReached && styles.counterDangerText]}>
            {totalCount}
          </Text>
          <Text style={[styles.counterMax, maxReached && styles.counterDangerText]}>/3</Text>
        </View>
      </View>

      {notificationMode === "mock" && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Emulator mode: alertovi rade, ali remote push testiraj na fizickom uredjaju.
          </Text>
        </View>
      )}

      {!maxReached && (
        <View style={styles.formCard}>
          <View style={styles.formTopRow}>
            <Text style={styles.formTitle}>Novi alert</Text>
            {__DEV__ && (
              <Pressable onPress={addTestAlerts} style={styles.testBtn}>
                <Text style={styles.testBtnText}>TEST</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.stepText}>Korak {step + 1}/3</Text>

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
                  <Text
                    style={[
                      styles.categoryPillText,
                      category === option.value && styles.categoryPillTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {step >= 1 && category && (
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Kategorija: {getCategoryLabel(category)}</Text>
              <Text style={styles.label}>Naziv proizvoda / model</Text>
              <TextInput
                value={productName}
                onChangeText={(value) => {
                  setProductName(value);
                  if (formError) setFormError(null);
                }}
                placeholder={getPlaceholder(category)}
                placeholderTextColor="#3A4624"
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
            </View>
          )}

          {step >= 2 && (
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Maksimalna cena (EUR)</Text>
              <TextInput
                value={priceText}
                onChangeText={(value) => {
                  setPriceText(value);
                  if (formError) setFormError(null);
                }}
                placeholder="Npr. 9500"
                placeholderTextColor="#3A4624"
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
              style={({ pressed }) => [
                styles.primaryBtn,
                primaryDisabled && styles.primaryBtnDisabled,
                pressed && !primaryDisabled && styles.pressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </Pressable>

            {(step !== 0 || category) && (
              <Pressable
                onPress={resetForm}
                style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
              >
                <Text style={styles.ghostBtnText}>Reset</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {loadingAlerts ? (
        <ActivityIndicator style={{ marginTop: 28 }} color={PALETTE.accent} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.alertCard}>
              <View style={styles.alertCardTop}>
                <Text style={styles.alertCategory}>{getCategoryLabel(item.category)}</Text>
                <Text style={[styles.alertState, !item.isActive && styles.alertStatePaused]}>
                  {item.isActive ? "AKTIVNO" : "PAUZA"}
                </Text>
              </View>

              <Text style={styles.alertTitle}>{item.keywords.join(" ")}</Text>
              <Text style={styles.alertPrice}>Max: {item.priceMax.toLocaleString("sr-RS")} EUR</Text>

              <View style={styles.alertActions}>
                <Pressable
                  onPress={() => toggleItem(item.id)}
                  style={({ pressed }) => [
                    styles.switchBtn,
                    item.isActive ? styles.switchBtnPause : styles.switchBtnEnable,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.switchBtnText, item.isActive ? styles.switchBtnTextPause : styles.switchBtnTextEnable]}>
                    {item.isActive ? "Iskljuci" : "Ukljuci"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => deleteItem(item.id)}
                  style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.deleteBtnText}>Obrisi</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Nema alerta</Text>
              <Text style={styles.emptyText}>Dodaj prvi alert i kreni sa pracenjem oglasa.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getShadow = (offset = 5) => ({
  shadowColor: "#000",
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 0.25,
  shadowRadius: 0,
  elevation: offset,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bg,
    paddingHorizontal: 14,
    paddingTop: 26,
  },
  bgStripeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: PALETTE.accent,
  },
  bgStripeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: PALETTE.accent,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.bg,
    gap: 10,
    paddingHorizontal: 20,
  },
  centerText: {
    color: PALETTE.text,
    fontSize: 14,
    fontWeight: "800",
  },
  errorTitle: {
    color: PALETTE.text,
    fontSize: 24,
    fontWeight: "900",
  },
  errorText: {
    color: PALETTE.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  kicker: {
    color: PALETTE.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  h1: {
    color: PALETTE.text,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  counterBox: {
    backgroundColor: PALETTE.paper,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    ...getShadow(4),
  },
  counterValue: {
    color: PALETTE.line,
    fontSize: 30,
    lineHeight: 30,
    fontWeight: "900",
  },
  counterMax: {
    color: PALETTE.line,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 2,
    marginBottom: 2,
  },
  counterDangerText: {
    color: PALETTE.red,
  },
  infoBox: {
    marginBottom: 10,
    backgroundColor: PALETTE.slate,
    borderWidth: 1,
    borderColor: PALETTE.accent,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  infoText: {
    color: PALETTE.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: PALETTE.paper,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 9,
    padding: 12,
    marginBottom: 14,
    ...getShadow(2),
  },
  formTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formTitle: {
    color: PALETTE.ink,
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  stepText: {
    marginTop: 4,
    marginBottom: 10,
    color: PALETTE.ink,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  testBtn: {
    backgroundColor: PALETTE.accent,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  testBtnText: {
    color: PALETTE.line,
    fontSize: 12,
    fontWeight: "900",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    backgroundColor: PALETTE.white,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: PALETTE.accent,
  },
  categoryPillText: {
    color: PALETTE.line,
    fontSize: 13,
    fontWeight: "800",
  },
  categoryPillTextActive: {
    fontWeight: "900",
  },
  inputBlock: {
    marginBottom: 10,
  },
  label: {
    color: PALETTE.line,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    backgroundColor: PALETTE.white,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 8,
    color: PALETTE.ink,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "700",
  },
  suggestionsWrap: {
    marginTop: 6,
    gap: 6,
  },
  suggestionItem: {
    backgroundColor: "rgba(162,220,71,0.22)",
    borderWidth: 1,
    borderColor: "rgba(8,10,5,0.6)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    opacity: 0.86,
  },
  suggestionText: {
    color: PALETTE.line,
    fontSize: 13,
    fontWeight: "700",
  },
  formError: {
    color: PALETTE.red,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.line,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: PALETTE.line,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryBtnDisabled: {
    opacity: 0.35,
  },
  primaryBtnText: {
    color: PALETTE.white,
    fontSize: 15,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  ghostBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.slate,
    borderWidth: 1,
    borderColor: PALETTE.accent,
    borderRadius: 8,
  },
  ghostBtnText: {
    color: PALETTE.text,
    fontSize: 14,
    fontWeight: "900",
  },
  list: {
    paddingBottom: 24,
    gap: 10,
  },
  alertCard: {
    backgroundColor: PALETTE.paper,
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 9,
    padding: 12,
    ...getShadow(2),
  },
  alertCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  alertCategory: {
    color: PALETTE.line,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  alertState: {
    color: PALETTE.line,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  alertStatePaused: {
    color: PALETTE.red,
  },
  alertTitle: {
    color: PALETTE.line,
    fontSize: 21,
    lineHeight: 23,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  alertPrice: {
    color: PALETTE.line,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
  },
  switchBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  switchBtnPause: {
    borderColor: "#AB7A2F",
    backgroundColor: PALETTE.orange,
  },
  switchBtnEnable: {
    borderColor: "#1B5A2F",
    backgroundColor: PALETTE.green,
  },
  switchBtnText: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  switchBtnTextPause: {
    color: PALETTE.line,
  },
  switchBtnTextEnable: {
    color: "#fff",
  },
  deleteBtn: {
    paddingHorizontal: 12,
    minHeight: 40,
    borderWidth: 1,
    borderColor: PALETTE.redSoftBorder,
    borderRadius: 8,
    backgroundColor: PALETTE.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: PALETTE.ink,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  emptyBox: {
    marginTop: 36,
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyTitle: {
    color: PALETTE.text,
    fontSize: 20,
    fontWeight: "900",
  },
  emptyText: {
    color: PALETTE.text,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.84,
  },
});
