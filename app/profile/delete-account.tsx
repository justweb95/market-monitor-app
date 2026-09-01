import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import { useDevice } from "@/contexts/DeviceContext";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";
const DELETION_INFO_URL = "https://lovacnaoglase.rs/brisanje-naloga";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { deviceId, invalidateDeviceRegistration } = useDevice();
  const { profile, deleteAccount } = useAccountProfile(deviceId);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountEmail = profile?.user?.email ?? "";
  // Pretplata koja se jos naplacuje preko Google Play-a. Brisanje naloga kod nas je NE
  // otkazuje - to moze samo korisnik u Play-u - pa se u tom slucaju trazi dodatna potvrda.
  const hasBillingToCancel =
    profile?.subscription?.status === "ACTIVE" || profile?.subscription?.status === "PAUSED";
  const emailMatches =
    confirmEmail.trim().toLowerCase() === accountEmail.trim().toLowerCase() && !!accountEmail;

  async function runDeletion() {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount(confirmEmail.trim());
      // Uredjaj se odjavljuje lokalno da app odmah padne na ekran za prijavu i da se
      // ne pokusa osvezavanje profila koji vise ne postoji.
      await invalidateDeviceRegistration();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brisanje naloga nije uspelo. Pokušaj ponovo.");
      setDeleting(false);
    }
  }

  function confirmDeletion() {
    if (!emailMatches || deleting) return;

    Alert.alert(
      "Trajno obrisati nalog?",
      hasBillingToCancel
        ? "Nalog, svi signali i favoriti se brišu i ne mogu se vratiti.\n\nPretplata na Google Play-u se OVIM NE otkazuje — naplata se nastavlja dok je sam ne otkažeš."
        : "Nalog, svi signali i favoriti se brišu i ne mogu se vratiti.",
      [
        { text: "Odustani", style: "cancel" },
        { text: "Obriši nalog", style: "destructive", onPress: () => void runDeletion() },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <AppHeader
            rightLabel="Brisanje naloga"
            leftIcon="chevron-back"
            onLeftPress={() => router.back()}
          />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.warningCard}>
              <View style={styles.row}>
                <Ionicons name="warning-outline" size={20} color={NeoTheme.colors.danger} />
                <Text style={styles.warningTitle}>Ovo se ne može poništiti</Text>
              </View>
              <Text style={styles.body}>
                Brišu se tvoj nalog, svi signali sa podešavanjima, favoriti, uređaji i istorija
                obaveštenja. Nema načina da ih vratimo.
              </Text>
            </View>

            {hasBillingToCancel ? (
              <View style={styles.billingCard}>
                <View style={styles.row}>
                  <Ionicons name="card-outline" size={20} color={NeoTheme.colors.lime} />
                  <Text style={styles.billingTitle}>Prvo otkaži pretplatu</Text>
                </View>
                <Text style={styles.body}>
                  Pretplatom upravlja Google Play, ne mi. Brisanje naloga je ne otkazuje — ako je
                  ne otkažeš, naplata se nastavlja iako više nemaš nalog.
                </Text>
                <Pressable
                  onPress={() => void Linking.openURL(PLAY_SUBSCRIPTIONS_URL)}
                  style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
                >
                  <Text style={styles.linkButtonText}>Otvori pretplate na Google Play-u</Text>
                  <Ionicons name="open-outline" size={16} color={NeoTheme.colors.black} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.label}>
                Za potvrdu ukucaj email adresu svog naloga
              </Text>
              <Text style={styles.hint}>{accountEmail || "—"}</Text>
              <TextInput
                value={confirmEmail}
                onChangeText={(value) => {
                  setConfirmEmail(value);
                  if (error) setError(null);
                }}
                placeholder="tvoj@email.com"
                placeholderTextColor={NeoTheme.colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!deleting}
                style={styles.input}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={confirmDeletion}
              disabled={!emailMatches || deleting}
              style={({ pressed }) => [
                styles.deleteButton,
                (!emailMatches || deleting) && styles.deleteButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {deleting ? (
                <ActivityIndicator color={NeoTheme.colors.text} />
              ) : (
                <Text style={styles.deleteButtonText}>Trajno obriši nalog</Text>
              )}
            </Pressable>

            <Pressable onPress={() => void Linking.openURL(DELETION_INFO_URL)}>
              <Text style={styles.infoLink}>Šta se tačno briše, a šta zadržavamo</Text>
            </Pressable>
          </ScrollView>
        </View>
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
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
    paddingHorizontal: rs(24),
    paddingTop: rs(10),
  },
  content: {
    paddingBottom: rs(36),
    gap: rs(14),
  },
  card: {
    borderRadius: rs(16),
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: rs(16),
    gap: rs(8),
    ...neoShadow,
  },
  warningCard: {
    borderRadius: rs(16),
    backgroundColor: NeoTheme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: NeoTheme.colors.danger,
    padding: rs(16),
    gap: rs(10),
  },
  billingCard: {
    borderRadius: rs(16),
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.limeBorder,
    padding: rs(16),
    gap: rs(10),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
  },
  warningTitle: {
    flex: 1,
    color: NeoTheme.colors.danger,
    fontSize: rf(16),
    fontFamily: NeoTheme.fonts.bold,
  },
  billingTitle: {
    flex: 1,
    color: NeoTheme.colors.lime,
    fontSize: rf(16),
    fontFamily: NeoTheme.fonts.bold,
  },
  body: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.regular,
    lineHeight: rf(19),
  },
  label: {
    color: NeoTheme.colors.text,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  hint: {
    color: NeoTheme.colors.textDim,
    fontSize: rf(12),
    fontFamily: NeoTheme.fonts.regular,
  },
  input: {
    marginTop: rs(4),
    borderRadius: rs(12),
    backgroundColor: NeoTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
    color: NeoTheme.colors.text,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.regular,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    borderRadius: rs(12),
    backgroundColor: NeoTheme.colors.lime,
    paddingVertical: rs(12),
  },
  linkButtonText: {
    color: NeoTheme.colors.black,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.bold,
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: NeoTheme.colors.danger,
    backgroundColor: NeoTheme.colors.dangerSoft,
    paddingVertical: rs(15),
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
  deleteButtonText: {
    color: NeoTheme.colors.danger,
    fontSize: rf(15),
    fontFamily: NeoTheme.fonts.bold,
  },
  error: {
    color: NeoTheme.colors.danger,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.regular,
  },
  infoLink: {
    marginTop: rs(4),
    textAlign: "center",
    color: NeoTheme.colors.textMuted,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.regular,
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.84,
  },
});
