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

// --- Singleton store shared across all useFavorites instances ---
type Listener = (items: FavoriteListing[]) => void;
let _favorites: FavoriteListing[] = [];
let _loaded = false;
const _listeners = new Set<Listener>();

function _notify(items: FavoriteListing[]) {
  _favorites = items;
  _listeners.forEach((fn) => fn(items));
}

async function _persist(items: FavoriteListing[]) {
  _notify(items);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

async function _hydrate() {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    const parsed = stored ? (JSON.parse(stored) as FavoriteListing[]) : [];
    _notify(Array.isArray(parsed) ? parsed : []);
  } catch {
    _notify([]);
  } finally {
    _loaded = true;
  }
}

// Load once on module init
void _hydrate();
// ----------------------------------------------------------------

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>(_favorites);
  const [loading, setLoading] = useState(!_loaded);

  useEffect(() => {
    const listener: Listener = (items) => {
      setFavorites(items);
      setLoading(false);
    };
    _listeners.add(listener);
    // Sync immediately in case store already loaded
    setFavorites(_favorites);
    if (_loaded) setLoading(false);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const isFavorite = useCallback(
    (id: string) => _favorites.some((item) => item.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favorites],
  );

  const toggleFavorite = useCallback(async (item: FavoriteListing) => {
    const exists = _favorites.some((entry) => entry.id === item.id);
    await _persist(
      exists
        ? _favorites.filter((entry) => entry.id !== item.id)
        : [item, ..._favorites],
    );
  }, []);

  const removeFavorite = useCallback(async (id: string) => {
    await _persist(_favorites.filter((entry) => entry.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    await _hydrate();
  }, []);

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    refresh,
  };
}
