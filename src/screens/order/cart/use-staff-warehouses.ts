import { useAuth } from '@/provider/AuthProvider';
import { useMemo } from 'react';

/** Active warehouses the current employee may sell from (`/auth/me`). */
export function useStaffWarehouses() {
  const { user } = useAuth();

  return useMemo(
    () =>
      (user?.staff?.warehouse ?? [])
        .map((w) => w.warehouse)
        .filter((w) => w && w.isActive !== false),
    [user]
  );
}
