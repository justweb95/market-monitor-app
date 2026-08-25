import { NeoTheme } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import React, { Component, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

// Poslednja linija odbrane — ako neki neocekivan bug pukne u render-u bilo gde
// u stablu, ovo sprecava da ceo ekran ostane prazan/zamrznut bez ikakve poruke
// korisniku. React zahteva class komponentu za error boundary (hooks ne mogu).
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    console.error("[ErrorBoundary] Neuhvacena greska u aplikaciji:", error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <Text style={styles.title}>Nesto je poslo naopako</Text>
            <Text style={styles.body}>
              Doslo je do neocekivane greske u aplikaciji. Pokusaj ponovo — ako se
              problem ponavlja, javi nam se na support@lovacnaoglase.rs.
            </Text>
            <Pressable style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Pokusaj ponovo</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NeoTheme.colors.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: rs(32),
    gap: rs(14),
  },
  title: {
    color: NeoTheme.colors.text,
    fontSize: rf(20),
    fontFamily: NeoTheme.fonts.bold,
    textAlign: "center",
  },
  body: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(14),
    lineHeight: rf(20),
    textAlign: "center",
    fontFamily: NeoTheme.fonts.medium,
  },
  button: {
    marginTop: rs(10),
    height: rs(48),
    paddingHorizontal: rs(28),
    borderRadius: rs(24),
    backgroundColor: NeoTheme.colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: NeoTheme.colors.black,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.semiBold,
  },
});
