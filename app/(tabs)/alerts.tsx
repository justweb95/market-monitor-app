import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const Colors = {
  background: "#F6F2E8",
  text: "#1A2517",
  sage: "#ACC8A2",
  save: "#4CAF50",
  surface: "#FFFFFF",
  border: "rgba(26,37,23,0.12)",
  mutedText: "rgba(26,37,23,0.65)",
  enabledDot: "#3DAA5C",
  disabledDot: "#D46A6A",
  toggleOnText: "#8C3F3F",
  toggleOffText: "#2E6B3A",
};

type Category = "AUTOMOBILI" | "MOTORI" | "TELEFONI";
type Step = 0 | 1 | 2;

type AlertItem = {
  id: string;
  category: Category;
  productName: string;
  price: number;
  enabled: boolean;
};

export default function AlertsScreen() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [step, setStep] = useState<Step>(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [productName, setProductName] = useState("");
  const [priceText, setPriceText] = useState("");

  const categoryLabel = useMemo(() => {
    if (category === "AUTOMOBILI") return "Automobili";
    if (category === "MOTORI") return "Motori";
    if (category === "TELEFONI") return "Telefoni";
    return "";
  }, [category]);

  const totalCount = items.length;
  const maxReached = totalCount >= 3;

  const resetForm = () => {
    setStep(0);
    setCategory(null);
    setProductName("");
    setPriceText("");
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)),
    );
  };

  const deleteItem = (id: string) => {
    Alert.alert("Brisanje", "Da li sigurno želiš da obrišeš obaveštenje?", [
      { text: "Otkaži", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: () => setItems((prev) => prev.filter((x) => x.id !== id)),
      },
    ]);
  };

  const isNameOk = productName.trim().length > 0;
  const priceNum = Number(priceText.replace(",", "."));
  const isPriceOk = Number.isFinite(priceNum) && priceNum > 0;

  const primaryLabel = step === 2 ? "Sačuvaj" : "Sledeće";

  const primaryDisabled =
    (step === 0 && !category) ||
    (step === 1 && !isNameOk) ||
    (step === 2 && !isPriceOk);

  const onPrimary = () => {
    if (primaryDisabled) return;
    if (step === 0) return setStep(1);
    if (step === 1) return setStep(2);
    if (!category) return;

    setItems((prev) => [
      {
        id: String(Date.now()),
        category,
        productName: productName.trim(),
        price: Math.round(priceNum * 100) / 100,
        enabled: true,
      },
      ...prev,
    ]);
    resetForm();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Obaveštenja</Text>

        <View style={styles.headerRight}>
          <Text style={styles.counter}>
            {totalCount}
            <Text style={styles.counterMax}>/3</Text>
          </Text>

          {/* {!maxReached && (
            <Pressable
              onPress={resetForm}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.addBtnText}>+ Dodaj</Text>
            </Pressable>
          )} */}
        </View>
      </View>

      {/* Form card — prikazuje se samo kad nije max i nismo završili formu */}
      {!maxReached && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Novo obaveštenje</Text>

          {step === 0 && (
            <>
              <Text style={styles.label}>Izaberi kategoriju</Text>
              <View style={styles.pillsRow}>
                <Pill
                  text="Automobili"
                  active={category === "AUTOMOBILI"}
                  onPress={() => setCategory("AUTOMOBILI")}
                />
                <Pill
                  text="Motori"
                  active={category === "MOTORI"}
                  onPress={() => setCategory("MOTORI")}
                />
                <Pill
                  text="Telefoni"
                  active={category === "TELEFONI"}
                  onPress={() => setCategory("TELEFONI")}
                />
              </View>
            </>
          )}

          {step >= 1 && category && (
            <>
              <Text style={styles.label}>
                Kategorija:{" "}
                <Text style={styles.labelStrong}>{categoryLabel}</Text>
              </Text>

              <Text style={styles.label}>Naziv proizvoda</Text>
              <TextInput
                value={productName}
                onChangeText={setProductName}
                placeholder={
                  category === "AUTOMOBILI"
                    ? "Npr. Golf 7 2.0 TDI"
                    : category === "MOTORI"
                      ? "Npr. Yamaha MT-07"
                      : "Npr. iPhone 15 Pro 256GB"
                }
                placeholderTextColor={Colors.mutedText}
                style={styles.input}
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (productName.trim()) setStep(2);
                }}
              />
            </>
          )}

          {step >= 2 && (
            <>
              <Text style={styles.label}>Cena (EUR)</Text>
              <TextInput
                value={priceText}
                onChangeText={setPriceText}
                placeholder="Npr. 999.99"
                placeholderTextColor={Colors.mutedText}
                style={styles.input}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={onPrimary}
              />
            </>
          )}

          <View style={styles.formActions}>
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
                style={({ pressed }) => [
                  styles.ghostBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.ghostBtnText}>Otkaži</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: item.enabled
                    ? Colors.enabledDot
                    : Colors.disabledDot,
                },
              ]}
            />

            <View style={styles.cardBody}>
              <Text style={styles.cardCategory}>{item.category}</Text>
              <Text style={styles.cardTitle}>{item.productName}</Text>
              <Text style={styles.cardMeta}>
                {item.price.toLocaleString("sr-RS", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                EUR
              </Text>
            </View>

            <View style={styles.cardActions}>
              <Pressable
                onPress={() => toggleItem(item.id)}
                style={({ pressed }) => [
                  styles.toggleBtn,
                  {
                    backgroundColor: item.enabled
                      ? "rgba(212,106,106,0.15)"
                      : "rgba(76,175,80,0.15)",
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    {
                      color: item.enabled
                        ? Colors.toggleOnText
                        : Colors.toggleOffText,
                    },
                  ]}
                >
                  {item.enabled ? "Isključi" : "Uključi"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => deleteItem(item.id)}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.deleteBtnText}>Obriši</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Nema obaveštenja</Text>
            <Text style={styles.emptyText}>
              Klikni "+ Dodaj" da kreiraš prvo obaveštenje.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function Pill({
  text,
  active,
  onPress,
}: {
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
    backgroundColor: Colors.background,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  h1: { fontSize: 30, fontWeight: "900", color: Colors.text },

  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  counter: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
    lineHeight: 32,
  },
  counterMax: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.mutedText,
  },

  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtnText: { color: Colors.text, fontWeight: "800", fontSize: 14 },

  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 12,
  },
  formTitle: { fontSize: 15, fontWeight: "900", color: Colors.text },

  label: { fontSize: 13, fontWeight: "700", color: Colors.mutedText },
  labelStrong: { fontWeight: "900", color: Colors.text },

  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  pillActive: {
    backgroundColor: Colors.sage,
    borderColor: "rgba(26,37,23,0.25)",
  },
  pillText: { color: Colors.text, fontWeight: "700" },
  pillTextActive: { color: Colors.text, fontWeight: "900" },

  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    color: Colors.text,
    fontSize: 15,
  },

  formActions: { flexDirection: "row", gap: 10, alignItems: "center" },

  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.save,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },

  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  ghostBtnText: { color: Colors.text, fontWeight: "800" },

  list: { paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    paddingTop: 18,
    overflow: "hidden",
  },

  statusDot: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  cardBody: {
    paddingLeft: 20,
    gap: 3,
    marginBottom: 14,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.mutedText,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: Colors.text,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 14,
    color: Colors.mutedText,
    marginTop: 2,
  },

  cardActions: {
    flexDirection: "row",
    gap: 10,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtnText: { fontWeight: "800", fontSize: 14 },

  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { color: Colors.text, fontWeight: "800", fontSize: 14 },

  emptyBox: {
    marginTop: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.mutedText,
    textAlign: "center",
    lineHeight: 20,
  },

  pressed: { opacity: 0.82 },
});
