import type { Warehouse } from '@/models/store.model';
import { StaffRole, UserRole } from '@/models/user.model';
import { useAuth } from '@/provider/AuthProvider';
import { useStaffWarehouses } from '@/screens/order/cart/use-staff-warehouses';
import { useStoreById } from '@/services/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

const WORKING_WAREHOUSE_KEY = 'sthm23-working-warehouse';

// The chosen warehouse is a device preference, like the menu mode
let savedId: string | null = null;
let loadStarted = false;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function loadWorkingWarehouse() {
  if (loadStarted) return;
  loadStarted = true;
  try {
    savedId = await AsyncStorage.getItem(WORKING_WAREHOUSE_KEY);
  } catch (error) {
    console.error('Failed to load the working warehouse:', error);
  }
  loaded = true;
  emit();
}

async function saveWorkingWarehouse(id: string) {
  savedId = id;
  emit();
  try {
    await AsyncStorage.setItem(WORKING_WAREHOUSE_KEY, id);
  } catch (error) {
    console.error('Failed to save the working warehouse:', error);
  }
}

export interface WorkingWarehouse {
  /** The working warehouse; undefined while loading or when there is none */
  warehouseId: string | undefined;
  warehouse: Warehouse | undefined;
  /** Warehouses the user may pick: the owner — every active one of the store */
  warehouses: Warehouse[];
  /** Saved choice and the warehouse list are loaded: lists may be fetched */
  isReady: boolean;
  setWarehouseId: (id: string) => Promise<void>;
}

/**
 * «Рабочий склад» (Profile): products, orders, cashboxes and rentals show only
 * this warehouse, new orders, bookings and cashboxes use it. One at a time;
 * debts stay store-wide. Saved on the device; a saved warehouse the user can
 * no longer use falls back to the first available one. The backend checks
 * access to the warehouse on every request.
 */
export function useWorkingWarehouse(): WorkingWarehouse {
  const { user } = useAuth();
  const isOwner = user?.role === UserRole.OWNER || user?.staff?.role === StaffRole.OWNER;
  const staffWarehouses = useStaffWarehouses();
  const store = useStoreById(isOwner ? user?.staff?.storeId : undefined);

  const saved = useSyncExternalStore(subscribe, () => savedId);
  const savedLoaded = useSyncExternalStore(subscribe, () => loaded);

  useEffect(() => {
    void loadWorkingWarehouse();
  }, []);

  // The owner's own access rows hold only the first warehouse: use the store's
  const warehouses = useMemo(
    () => (isOwner && store.data ? store.data.warehouse.filter((w) => w.isActive) : staffWarehouses),
    [isOwner, store.data, staffWarehouses]
  );
  const warehouse = warehouses.find((w) => w.id === saved) ?? warehouses[0];

  return {
    warehouseId: warehouse?.id,
    warehouse,
    warehouses,
    isReady: savedLoaded && !(isOwner && store.isLoading),
    setWarehouseId: saveWorkingWarehouse,
  };
}
