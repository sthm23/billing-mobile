import { Button, Text } from '@/components/base';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { Logo } from '@/components/brand/Logo';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/libs/date';
import { cn } from '@/libs/utils';
import { UserRole } from '@/models/user.model';
import { useAuth } from '@/provider/AuthProvider';
import { CircleCheck, Pause, Send } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, ScrollView, View } from 'react-native';

/** Support channel for store owners (Telegram) */
export const SUPPORT_URL = 'https://t.me/sthm_support';

/**
 * «Работа магазина приостановлена» — shown instead of the app while the
 * user's store is SUSPENDED (backend answers 403 STORE_SUSPENDED). The owner
 * sees the reason and the support link, an employee — «обратитесь к владельцу».
 * Coming back to the app reloads the profile, so a resumed store opens again.
 */
export function ShopSuspendedScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const store = user?.staff?.store;
  const isOwner = user?.role === UserRole.OWNER;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshUser().catch(() => undefined);
    });
    return () => sub.remove();
  }, [refreshUser]);

  const rows = [
    { key: 'store', label: t('shopSuspended.store'), value: store?.name ?? '—' },
    {
      key: 'reason',
      label: t('shopSuspended.reason'),
      value: isOwner && store?.suspendReason ? t(`adminShop.reason.${store.suspendReason}`) : t('shopSuspended.accessSuspended'),
    },
    { key: 'since', label: t('shopSuspended.since'), value: store?.suspendedAt ? formatDate(store.suspendedAt) : '—' },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 32, gap: 16 }}>
        <View className="items-center pb-2">
          <Logo width={140} />
        </View>
        <View className="bg-card rounded-[28px] p-5 gap-4">
          <View className="items-center gap-3">
            <View className="w-[72px] h-[72px] rounded-full bg-err-bg items-center justify-center">
              <Pause size={32} color={colors.errFg} strokeWidth={2} />
            </View>
            <Text className="type-title text-ink text-center" accessibilityRole="header">{t('shopSuspended.title')}</Text>
            <Text className="font-onest text-sm leading-5 text-muted text-center">
              {isOwner ? t('shopSuspended.ownerText') : t('shopSuspended.employeeText')}
            </Text>
          </View>
          <View className="bg-sunken rounded-2xl px-3.5">
            {rows.map((row, i) => (
              <View key={row.key} className={cn('flex-row justify-between gap-3 py-3', i > 0 && 'border-t border-line')}>
                <Text className="font-onest text-[13px] text-soft">{row.label}</Text>
                <Text className="flex-1 font-onest-semibold text-[13px] text-ink text-right">{row.value}</Text>
              </View>
            ))}
          </View>
          {isOwner ? (
            <View className="flex-row items-center gap-2 bg-ok-bg rounded-2xl px-3.5 py-3">
              <CircleCheck size={16} color={colors.okFg} strokeWidth={2} />
              <Text className="flex-1 font-onest-medium text-[13px] text-ok-fg">{t('shopSuspended.dataKept')}</Text>
            </View>
          ) : null}
        </View>
        <View className="flex-1" />
        <View className="gap-2.5">
          {isOwner ? (
            <Button variant="accent" size="lg" full icon={Send} onPress={() => void Linking.openURL(SUPPORT_URL)}>
              {t('shopSuspended.support')}
            </Button>
          ) : null}
          <Button variant="secondary" size="lg" full onPress={() => void logout()}>
            {t('shopSuspended.logout')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
