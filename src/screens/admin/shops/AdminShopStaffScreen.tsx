import { Avatar, AvatarFallbackText, Button, IconButton, ListCard, Text } from '@/components/base';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { EmptyState, LoadingState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { isAdmin } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import { useAdminStore, useAdminStoreStaff } from '@/services/admin-store';
import { roleLabel, warehousesLabel } from '@/screens/profile/staff/staff-format';
import { router } from 'expo-router';
import { ChevronLeft, Lock, ShieldX, UsersRound, WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** «Все сотрудники» of a store — read-only for the admin (the owner manages staff). */
export function AdminShopStaffScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const admin = isAdmin(user);
  const store = useAdminStore(admin ? id : undefined);
  const query = useAdminStoreStaff(admin ? id : undefined);
  const refreshControl = useRefreshControl(query.refetch);

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">
          {query.data ? t('adminShop.staffTitle', { count: query.data.length }) : t('staff.title')}
        </Text>
        {store.data ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {t('adminShop.staffSubtitle', { name: store.data.name })}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!admin) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('adminShops.noAccess')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {header}
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError && !query.data ? (
        <EmptyState icon={WifiOff} message={t('adminShop.staffFailed')}>
          <Button onPress={() => void query.refetch()}>{t('adminShops.retry')}</Button>
        </EmptyState>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <View className="flex-row items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-card mb-1">
              <Lock size={18} color={colors.soft} strokeWidth={2} />
              <Text className="flex-1 font-onest text-[13px] leading-[18px] text-soft">{t('adminShop.staffHint')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ListCard
              leading={
                <Avatar tone={item.isOwner ? 'accent' : 'sunken'}>
                  <AvatarFallbackText>{item.fullName}</AvatarFallbackText>
                </Avatar>
              }
              title={item.fullName}
              subtitle={`${roleLabel(item.role, t)} · ${warehousesLabel(item, t)}`}
              badge={
                item.isActive
                  ? { label: t('adminShops.status.ACTIVE'), tone: 'ok' }
                  : { label: t('adminShop.inactive'), tone: 'neutral' }
              }
              className={cn(!item.isActive && 'opacity-60')}
            />
          )}
          ListEmptyComponent={<EmptyState icon={UsersRound} message={t('staff.empty')} />}
          refreshControl={refreshControl}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
        />
      )}
    </SafeAreaView>
  );
}
