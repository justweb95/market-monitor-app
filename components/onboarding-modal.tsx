import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: "search-outline",
    title: "Dobrodošao u Lovac na Oglase",
    body: "Ova aplikacija sama pretražuje više sajtova sa oglasima za tebe, 24 sata dnevno. Čim se pojavi nešto što tražiš, javićemo ti odmah - ne moraš više sam da pretražuješ.",
  },
  {
    icon: "notifications-outline",
    title: "Šta je \"signal\"?",
    body: "Signal je tvoja sačuvana pretraga - na primer \"Golf 5, do 3000 evra, Novi Sad\". Jednom kad ga napraviš, on radi za tebe non-stop i javlja ti čim se pojavi novi oglas koji odgovara.",
  },
  {
    icon: "add-circle-outline",
    title: "Kako da napraviš signal",
    body: "Idi na ekran \"Signali\", pritisni dugme za dodavanje i izaberi kategoriju (automobili, delovi, nekretnine...), unesi ključne reči, maksimalnu cenu i lokaciju. To je sve - mi pretražujemo umesto tebe.",
  },
  {
    icon: "phone-portrait-outline",
    title: "Obaveštenja stižu odmah",
    body: "Kada pronađemo oglas koji odgovara tvom signalu, dobićeš obaveštenje na telefonu istog trenutka. Klikni na njega da odmah otvoriš oglas.",
  },
];

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function OnboardingModal({ visible, onDismiss }: Props) {
  const [stepIndex, setStepIndex] = useState(0);

  const isLastStep = stepIndex === STEPS.length - 1;
  const step = STEPS[stepIndex];

  const handleNext = () => {
    if (isLastStep) {
      onDismiss();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const handleModalHide = () => {
    setStepIndex(0);
  };

  if (!step) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onDismiss}
      onDismiss={handleModalHide}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={onDismiss} hitSlop={12}>
            <Text style={styles.skipText}>Preskoči</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name={step.icon} size={48} color={NeoTheme.colors.lime} />
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {STEPS.map((s, index) => (
              <View
                key={s.title}
                style={[styles.dot, index === stepIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>{isLastStep ? "Nastavi" : "Dalje"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 18,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: NeoTheme.fonts.bold,
    color: NeoTheme.colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NeoTheme.colors.border,
  },
  dotActive: {
    backgroundColor: NeoTheme.colors.lime,
    width: 20,
  },
  nextBtn: {
    minHeight: 50,
    borderRadius: NeoTheme.radius.md,
    backgroundColor: NeoTheme.colors.lime,
    alignItems: "center",
    justifyContent: "center",
    ...neoShadow,
  },
  pressed: {
    opacity: 0.8,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: NeoTheme.fonts.bold,
    color: NeoTheme.colors.black,
  },
  laterBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  laterBtnText: {
    fontSize: 14,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
  },
});
