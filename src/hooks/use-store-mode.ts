import { useAuth } from '@/provider/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

/** What the bottom menu shows: sales (orders, scan) or rental (bookings) */
export type NavMode = 'sale' | 'rent';

const NAV_MODE_KEY = 'sthm23-nav-mode';

// Menu choice of a store with both modes: a device preference, not store data
let savedNavMode: NavMode = 'sale';
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

async function loadNavMode() {
  if (loaded) return;
  loaded = true;
  try {
    const value = await AsyncStorage.getItem(NAV_MODE_KEY);
    if (value === 'sale' || value === 'rent') {
      savedNavMode = value;
      emit();
    }
  } catch (error) {
    console.error('Failed to load the menu mode:', error);
  }
}

async function saveNavMode(mode: NavMode) {
  savedNavMode = mode;
  emit();
  try {
    await AsyncStorage.setItem(NAV_MODE_KEY, mode);
  } catch (error) {
    console.error('Failed to save the menu mode:', error);
  }
}

export interface StoreMode {
  salesEnabled: boolean;
  rentalEnabled: boolean;
  /** Both sales and rental: the menu mode is switched in the profile */
  isMixed: boolean;
  navMode: NavMode;
  setNavMode: (mode: NavMode) => Promise<void>;
}

/**
 * Store modes from the current user's store (`Store.salesEnabled` /
 * `rentalEnabled`; set by the owner in «Настройки магазина»). A store with one
 * mode always shows it; a store with both uses the saved menu choice.
 * UX only — the backend rejects sales or rentals the store has turned off.
 */
export function useStoreMode(): StoreMode {
  const { user } = useAuth();
  const store = user?.staff?.store;
  const salesEnabled = store?.salesEnabled ?? true;
  const rentalEnabled = store?.rentalEnabled ?? false;

  const preferred = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => savedNavMode,
  );

  useEffect(() => {
    void loadNavMode();
  }, []);

  const navMode: NavMode = !rentalEnabled ? 'sale' : !salesEnabled ? 'rent' : preferred;

  return {
    salesEnabled,
    rentalEnabled,
    isMixed: salesEnabled && rentalEnabled,
    navMode,
    setNavMode: saveNavMode,
  };
}
