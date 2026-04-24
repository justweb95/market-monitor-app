import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const FAVORITES_KEY = "market_monitor_favorites_v1";

export type FavoriteListing = {
  id: string;
  title: string;
  body: string;
  url?: string;
  imageUrl?: string;
  sourceLabel: string;
  createdAt: string;
  priceText?: string;
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (items: FavoriteListing[]) => {
    setFavorites(items);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  }, []);

  const hydrate = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (!stored) {
        setFavorites([]);
        return;
      }
      const parsed = JSON.parse(stored) as FavoriteListing[];
      if (Array.isArray(parsed)) {
        setFavorites(parsed);
      }
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((item) => item.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (item: FavoriteListing) => {
      const exists = favorites.some((entry) => entry.id === item.id);
      if (exists) {
        await persist(favorites.filter((entry) => entry.id !== item.id));
      } else {
        await persist([item, ...favorites]);
      }
    },
    [favorites, persist],
  );

  const removeFavorite = useCallback(
    async (id: string) => {
      await persist(favorites.filter((entry) => entry.id !== id));
    },
    [favorites, persist],
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    refresh: hydrate,
  };
}
