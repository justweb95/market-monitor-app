import { AppHeader } from "@/components/app-header";
import { NeoTheme, neoShadow } from "@/constants/neo-theme";
import { useDevice } from "@/hooks/useDevice";
import { useFavorites } from "@/hooks/useFavorites";
import { useNotifications } from "@/hooks/useNotifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatPriceLabel(priceText?: string): string | null {
  if (!priceText) return null;
  if (/cena nije navedena/i.test(priceText)) return priceText;
  return priceText.replace(/\s*EUR/i, " €");
}

export default function FavoritesScreen() {
  const { deviceId } = useDevice();
  const { dismissNotification } = useNotifications(deviceId);
  const { favorites, removeFavorite } = useFavorites();
  const { width } = useWindowDimensions();
  const columnCount = width > 380 ? 2 : 1;

  const paddedData = useMemo(() => {
    if (columnCount === 1 || favorites.length % 2 === 0) return favorites;
    return [...favorites, { id: "spacer", title: "", body: "", sourceLabel: "", createdAt: "" }];
  }, [columnCount, favorites]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <AppHeader rightLabel="Favoriti" rightIcon="heart" rightCount={String(favorites.length)} />

        <FlatList
          data={paddedData}
          key={columnCount}
          numColumns={columnCount}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={columnCount === 2 ? styles.columnWrap : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Nema sacuvanih oglasa</Text>
              <Text style={styles.emptyText}>Klikni srce na pocetnom feed-u da sacuvas oglas.</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.id === "spacer") {
              return <View style={[styles.gridCol, styles.spacer]} />;
            }

            return (
              <View style={styles.gridCol}>
                <View style={styles.card}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                  ) : (
                    <LinearGradient
                      colors={["#050505", "#181818", "#05242A"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.imageFallback}
                    >
                      <Ionicons name="heart" color={NeoTheme.colors.lime} size={28} />
                    </LinearGradient>
                  )}

                  <View style={styles.overlay}>
                    {item.priceText ? (
                      <View style={styles.pricePill}>
                        <Text style={styles.priceText}>{formatPriceLabel(item.priceText)}</Text>
                      </View>
                    ) : null}

                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.meta}>{item.sourceLabel}</Text>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => {
                          void removeFavorite(item.id);
                          void dismissNotification(item.id);
                        }}
                        style={({ pressed }) => [styles.cutButton, styles.cutButtonDanger, pressed && styles.pressed]}
                      >
                        <View style={[styles.cutout, styles.cutoutTopRight, styles.cutoutSolid]} />
                        <View style={[styles.cutout, styles.cutoutBottomLeft, styles.cutoutSolid]} />
                        <Text style={styles.deleteBtnText}>Obrisi</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          if (item.url) {
                            void Linking.openURL(item.url);
                          }
                        }}
                        style={({ pressed }) => [styles.cutButton, styles.cutButtonPrimary, pressed && styles.pressed]}
                      >
                        <View style={[styles.cutout, styles.cutoutTopLeft, styles.cutoutSolid]} />
                        <View style={[styles.cutout, styles.cutoutBottomRight, styles.cutoutSolid]} />
                        <Text style={styles.viewBtnText}>Vidi oglas</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
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
  list: {
    paddingBottom: 120,
    gap: 12,
  },
  columnWrap: {
    gap: 12,
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
  spacer: {
    opacity: 0,
  },
  card: {
    height: 268,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: NeoTheme.colors.surface,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    ...neoShadow,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 4,
    height: "40%",
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#2a2a2a",
    justifyContent: "flex-end",
  },
  pricePill: {
    position: "absolute",
    top: -12,
    left: 4,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  priceText: {
    color: NeoTheme.colors.lime,
    fontSize: 10,
    fontFamily: NeoTheme.fonts.bold,
  },
  title: {
    color: NeoTheme.colors.text,
    fontSize: 12,
    lineHeight: 15,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 8,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    color: NeoTheme.colors.text,
    fontSize: 11,
    fontFamily: NeoTheme.fonts.medium,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  cutButton: {
    flex: 1,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
  },
  cutButtonDanger: {
    backgroundColor: "rgba(255, 49, 49, 1)",
  },
  deleteBtnText: {
    color: NeoTheme.colors.text,
    fontSize: 11,
    fontFamily: NeoTheme.fonts.bold,
  },
  cutButtonPrimary: {
    backgroundColor: NeoTheme.colors.lime,
  },
  viewBtnText: {
    color: NeoTheme.colors.black,
    fontSize: 11,
    fontFamily: NeoTheme.fonts.bold,
  },
  cutout: {
    position: "absolute",
    width: 20,
    height: 20,
    transform: [{ rotate: "45deg" }],
  },
  cutoutTopLeft: {
    top: -10,
    left: -10,
  },
  cutoutTopRight: {
    top: -10,
    right: -10,
  },
  cutoutBottomLeft: {
    bottom: -10,
    left: -10,
  },
  cutoutBottomRight: {
    bottom: -10,
    right: -10,
  },
  cutoutSolid: {
    backgroundColor: "#2a2a2a",
  },
  emptyBox: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    backgroundColor: NeoTheme.colors.surface,
    padding: 18,
    alignItems: "center",
  },
  emptyTitle: {
    color: NeoTheme.colors.text,
    fontSize: 16,
    fontFamily: NeoTheme.fonts.semiBold,
    marginBottom: 8,
  },
  emptyText: {
    color: NeoTheme.colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    fontFamily: NeoTheme.fonts.medium,
  },
  pressed: {
    opacity: 0.84,
  },
});
