import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserInfoScreen() {
  const router = useRouter();
  const { deviceId, linkAccountToDevice, loading: deviceLoading } = useDevice();
  const { profile, loading, updateProfile } = useAccountProfile(deviceId);

  const [firstName, setFirstName] = useState(profile?.user?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.user?.lastName ?? "");
  const [email, setEmail] = useState(profile?.user?.email ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.user) return;
    setFirstName(profile.user.firstName);
    setLastName(profile.user.lastName);
    setEmail(profile.user.email);
  }, [profile?.user]);

  const onSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    if (!deviceId) {
      setSaveError("Uredjaj jos nije registrovan.");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setSaveError("Ime, prezime i email su obavezni.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSaveError("Email adresa nije validna.");
      return;
    }

    if (!profile?.user && !password.trim()) {
      setSaveError("Za prvo povezivanje naloga potreban je password.");
      return;
    }

    setSaving(true);
    try {
      if (!profile?.user) {
        await linkAccountToDevice({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
      }

      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        ...(password.trim() ? { password } : {}),
      });

      setSaveSuccess("Profil je uspesno azuriran.");
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  if (deviceLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={NeoTheme.colors.lime} size="large" />
          <Text style={styles.loaderText}>Ucitavanje profila...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Korisnički podaci" leftIcon="chevron-back" onLeftPress={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Ime</Text>
            <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholder="Ime" placeholderTextColor={NeoTheme.colors.textDim} />
            <Text style={styles.label}>Prezime</Text>
            <TextInput value={lastName} onChangeText={setLastName} style={styles.input} placeholder="Prezime" placeholderTextColor={NeoTheme.colors.textDim} />
            <Text style={styles.label}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} placeholder="Email" placeholderTextColor={NeoTheme.colors.textDim} />
            <Text style={styles.label}>Password</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholder="Password" placeholderTextColor={NeoTheme.colors.textDim} />
            <Pressable onPress={onSave} disabled={saving} style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, saving && styles.disabled]}>
              <Text style={styles.saveBtnText}>{saving ? "Cuvam..." : "Sacuvaj profil"}</Text>
            </Pressable>
            {saveError ? <Text style={styles.inlineError}>{saveError}</Text> : null}
            {saveSuccess ? <Text style={styles.inlineSuccess}>{saveSuccess}</Text> : null}
          </View>
        </ScrollView>
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
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderText: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.semiBold,
  },
  content: {
    paddingBottom: 36,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: 14,
    ...neoShadow,
  },
  label: {
    color: NeoTheme.colors.textMuted,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: NeoTheme.colors.text,
    paddingHorizontal: 12,
    fontFamily: NeoTheme.fonts.medium,
    marginBottom: 8,
  },
  saveBtn: {
    marginTop: 6,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NeoTheme.colors.lime,
  },
  saveBtnText: {
    color: NeoTheme.colors.black,
    fontFamily: NeoTheme.fonts.bold,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.84,
  },
  inlineError: {
    color: NeoTheme.colors.danger,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.regular,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  inlineSuccess: {
    color: NeoTheme.colors.lime,
    fontSize: 12,
    fontFamily: NeoTheme.fonts.semiBold,
    marginTop: 6,
    paddingHorizontal: 2,
  },
});
