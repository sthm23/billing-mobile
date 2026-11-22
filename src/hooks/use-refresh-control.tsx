import { useTheme } from '@/hooks/use-theme';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

/**
 * Pull-to-refresh for a ScrollView / FlatList (`refreshControl` prop), in the
 * theme colours. The spinner shows only while a pull is in progress — not on
 * background refetches.
 *
 * @example
 * const refreshControl = useRefreshControl(refetch);
 * <FlatList refreshControl={refreshControl} … />
 */
export function useRefreshControl(refresh: () => Promise<unknown>) {
  const colors = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.muted}
      colors={[colors.ink]}
      progressBackgroundColor={colors.card}
    />
  );
}
