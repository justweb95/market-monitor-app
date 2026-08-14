import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  onSubmit: (account: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mandatory registration/login screen. Rendered in place of the whole app
 * (no children prop, no skip button) until the device has a linked account -
 * see app/_layout.tsx. The same form doubles as "login": if the email
 * already has an account, the backend verifies the password and links this
 * device to it instead of creating a new user.
 */
export function AuthGate({ onSubmit }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !password) {
      setError("Ime, prezime, email i lozinka su obavezni.");
      return;
    }

    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Email adresa nije validna.");
      return;
    }

    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registracija nije uspela. Pokusaj ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <Image source={require("@/assets/images/icon.png")} style={styles.logo} />
            <Text style={styles.brand}>Lovac na Oglase</Text>
          </View>

          <View style={styles.iconWrap}>
            <Ionicons name="person-add-outline" size={40} color={NeoTheme.colors.lime} />
          </View>

          <Text style={styles.title}>Napravi nalog da nastavis</Text>
          <Text style={styles.subtitle}>
            Nalog je obavezan za koriscenje aplikacije. Ako vec imas nalog, uneti isti email i
            lozinku - povezacemo ovaj uredjaj sa tvojim postojecim nalogom.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Ime</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              placeholder="Ime"
              placeholderTextColor={NeoTheme.colors.textDim}
              autoCapitalize="words"
              autoComplete="given-name"
              editable={!submitting}
            />
            <Text style={styles.label}>Prezime</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              placeholder="Prezime"
              placeholderTextColor={NeoTheme.colors.textDim}
              autoCapitalize="words"
              autoComplete="family-name"
              editable={!submitting}
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={NeoTheme.colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              editable={!submitting}
            />
            <Text style={styles.label}>Lozinka</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Lozinka (min. 6 karaktera)"
              placeholderTextColor={NeoTheme.colors.textDim}
              secureTextEntry
              autoComplete="password"
              editable={!submitting}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />

            {error ? <Text style={styles.inlineError}>{error}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.pressed,
                submitting && styles.disabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={NeoTheme.colors.black} />
              ) : (
                <Text style={styles.submitBtnText}>Napravi nalog / Prijavi se</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.footnote}>
            Kreiranjem naloga prihvatas Uslove koriscenja i Politiku privatnosti.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: NeoTheme.spacing.lg,
    paddingTop: NeoTheme.spacing.lg,
    paddingBottom: NeoTheme.spacing.xl,
    alignItems: "center",
    gap: NeoTheme.spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: NeoTheme.spacing.xs,
    marginBottom: NeoTheme.spacing.md,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brand: {
    fontSize: 16,
    fontFamily: NeoTheme.fonts.bold,
    color: NeoTheme.colors.text,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: NeoTheme.spacing.xs,
  },
  title: {
    fontSize: 22,
    fontFamily: NeoTheme.fonts.bold,
    color: NeoTheme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: NeoTheme.spacing.xs,
  },
  card: {
    width: "100%",
    borderRadius: NeoTheme.radius.md,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: NeoTheme.spacing.md,
    ...neoShadow,
  },
  label: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: 6,
    marginTop: NeoTheme.spacing.xs,
  },
  input: {
    minHeight: 44,
    borderRadius: NeoTheme.radius.sm,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: NeoTheme.colors.text,
    paddingHorizontal: NeoTheme.spacing.sm,
    fontFamily: NeoTheme.fonts.medium,
  },
  submitBtn: {
    marginTop: NeoTheme.spacing.md,
    minHeight: 48,
    borderRadius: NeoTheme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NeoTheme.colors.lime,
  },
  submitBtnText: {
    color: NeoTheme.colors.black,
    fontFamily: NeoTheme.fonts.bold,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.84,
  },
  inlineError: {
    color: NeoTheme.colors.danger,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    marginTop: NeoTheme.spacing.xs,
  },
  footnote: {
    fontSize: 11,
    fontFamily: NeoTheme.fonts.medium,
    color: NeoTheme.colors.textDim,
    textAlign: "center",
    marginTop: NeoTheme.spacing.sm,
    paddingHorizontal: NeoTheme.spacing.sm,
  },
});
