import { StatusBadge, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import {
  RentalCleaningState,
  RentalStatus,
  useRentalCleanings,
  useRentals,
  type RentalCleaning,
} from '@/services/rental';
import { router } from 'expo-router';
import { WashingMachine } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { CancelCleaningSheet } from '../CancelCleaningSheet';
import { formatDay, formatLocalDays, initials, rentalBadges } from '../rental-format';

const UPCOMING_STATUSES = [RentalStatus.BOOKED, RentalStatus.ISSUED, RentalStatus.PARTIALLY_RETURNED];

interface RentalVariantActivityProps {
  warehouseId: string;
  variantId: string;
  /** Short label of the variant («46 · Белый») */
  variantLabel: string;
  /** OWNER / MANAGER: may cancel a planned dry cleaning */
  canManage: boolean;
}

/**
 * Nearest bookings of the variant (open the booking card) and its planned dry
 * cleanings (R13; a manager cancels one before it starts).
 */
export function RentalVariantActivity({ warehouseId, variantId, variantLabel, canManage }: RentalVariantActivityProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const [cancelling, setCancelling] = useState<RentalCleaning | null>(null);

  const upcoming = useRentals({
    variantId,
    status: UPCOMING_STATUSES,
    sortBy: 'startDate',
    sort: 'asc',
    pageSize: 5,
  });
  const cleanings = useRentalCleanings({ warehouseId, variantId });
  const cleaningList = cleanings.data ?? [];

  return (
    <>
      <View className="bg-card rounded-xl p-3.5 gap-2">
        <View className="flex-row items-baseline justify-between px-0.5 pb-1">
          <Text className="font-onest-bold text-[15px] text-ink">{t('rental.item.upcoming')}</Text>
          <Text className="font-onest text-xs text-muted" numberOfLines={1}>{variantLabel}</Text>
        </View>
        {upcoming.isLoading ? (
          <ActivityIndicator color={colors.muted} className="py-3" />
        ) : (upcoming.data?.data ?? []).length === 0 ? (
          <Text className="font-onest text-[13px] text-muted px-0.5 pb-1">{t('rental.product.noBookings')}</Text>
        ) : (
          (upcoming.data?.data ?? []).map((rental) => {
            const badges = rentalBadges(rental, t);
            const badge = badges[badges.length - 1];
            const name = rental.customer?.fullName ?? t('rental.noCustomer');
            return (
              <Pressable
                key={rental.id}
                onPress={() => router.push({ pathname: '/(tabs)/(rentals)/[id]', params: { id: rental.id } })}
                accessibilityRole="button"
                className="flex-row items-center gap-2.5 py-2.5 pl-2.5 pr-3 rounded-lg bg-sunken active:opacity-80"
              >
                <View className="w-9 h-9 rounded-full bg-card items-center justify-center">
                  <Text className="font-onest-bold text-xs text-ink">{initials(rental.customer?.fullName) || '—'}</Text>
                </View>
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="font-onest-bold text-sm text-ink">
                    {formatDay(rental.startDate, lang)} → {formatDay(rental.endDate, lang)}
                  </Text>
                  <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                    {name} · №{rental.code}
                  </Text>
                </View>
                {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
              </Pressable>
            );
          })
        )}
      </View>

      {cleaningList.length > 0 ? (
        <View className="bg-card rounded-xl p-3.5 gap-2">
          <Text className="font-onest-bold text-[15px] text-ink px-0.5 pb-0.5">{t('rental.cleaningCard.title')}</Text>
          {cleaningList.map((c) => {
            const cancellable = canManage && c.canCancel;
            const meta = [
              t('rental.cleaningCard.expense', { amount: formatMoney(Number(c.amount)) }),
              t(`sale.pay.method.${c.paymentType}`),
              c.comment,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <Pressable
                key={c.id}
                disabled={!cancellable}
                onPress={() => setCancelling(c)}
                accessibilityRole={cancellable ? 'button' : undefined}
                accessibilityHint={cancellable ? t('rental.cleaningCard.cancelA11y') : undefined}
                className="flex-row items-center gap-3 p-3 rounded-lg bg-sunken active:opacity-80"
              >
                <View className="w-10 h-10 rounded-md bg-info-bg items-center justify-center">
                  <WashingMachine size={20} color={colors.infoFg} strokeWidth={2} />
                </View>
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="type-body-strong text-ink">{formatLocalDays(c.firstDay, c.lastDay, lang)}</Text>
                  <Text className="font-onest text-xs text-muted" numberOfLines={2}>{meta}</Text>
                </View>
                <StatusBadge
                  label={t(`rental.cleaningCard.state.${c.state}`)}
                  tone={c.state === RentalCleaningState.IN_PROGRESS ? 'info' : 'neutral'}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <CancelCleaningSheet cleaning={cancelling} onClose={() => setCancelling(null)} />
    </>
  );
}
