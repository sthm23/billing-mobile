import { Button, IconButton, StatusBadge, Text } from '@/components/base';
import { useStoreMode } from '@/hooks/use-store-mode';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { getVariantLabel } from '@/libs/product-utils';
import { canManageProducts } from '@/libs/roles';
import { cn } from '@/libs/utils';
import type { ProductDetail, ProductVariant } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import {
  RentalCleaningState,
  RentalStatus,
  useRentalCalendar,
  useRentalCleanings,
  useRentals,
  type RentalCleaning,
} from '@/services/rental';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Pencil, WashingMachine } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CancelCleaningSheet } from './CancelCleaningSheet';
import {
  formatDay,
  formatLocalDate,
  formatLocalDays,
  formatMonth,
  monthEnd,
  monthGrid,
  monthStart,
  rentalBadges,
  toLocalDate,
  weekDayLabels,
} from './rental-format';

const UPCOMING_STATUSES = [RentalStatus.BOOKED, RentalStatus.ISSUED, RentalStatus.PARTIALLY_RETURNED];

interface RentalItemScreenProps {
  product: ProductDetail;
  variant: ProductVariant;
}

/**
 * Rented item card (design «Аренда · вещь»): day price, units free today, the
 * month's occupancy (`GET /rental/calendar` for this variant) and the nearest
 * bookings. «Цена и аренда» for OWNER/MANAGER, «Забронировать» starts a
 * booking with this item.
 */
export function RentalItemScreen({ product, variant }: RentalItemScreenProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { rentalEnabled } = useStoreMode();
  const canManage = canManageProducts(user);
  const today = toLocalDate(new Date());
  const [month, setMonth] = useState(monthStart(today));
  const [cancelling, setCancelling] = useState<RentalCleaning | null>(null);

  const params = { warehouseId: product.warehouseId, variantIds: [variant.id] };
  const todayCalendar = useRentalCalendar({ ...params, from: today, to: today });
  const monthCalendar = useRentalCalendar({ ...params, from: month, to: monthEnd(month) });
  const upcoming = useRentals({
    variantId: variant.id,
    status: UPCOMING_STATUSES,
    sortBy: 'startDate',
    sort: 'asc',
    pageSize: 5,
  });
  const cleanings = useRentalCleanings({ warehouseId: product.warehouseId, variantId: variant.id });

  const todayRow = todayCalendar.data?.variants[0];
  const owned = todayRow?.owned ?? variant.quantity;
  const freeToday = todayRow?.days[0]?.available;
  const days = new Map((monthCalendar.data?.variants[0]?.days ?? []).map((d) => [d.date, d]));
  const monthOwned = monthCalendar.data?.variants[0]?.owned ?? owned;

  const price = Number(variant.rentPricePerDay ?? 0);
  const rentable = !!variant.canRent && price > 0;
  const category = product.category ? t(`category.${product.category}`, { defaultValue: product.category }) : '';
  const subtitle = [category, getVariantLabel(variant)].filter(Boolean).join(' · ');

  const openCleaning = () =>
    router.push({
      pathname: '/(tabs)/(products)/cleaning/[variantId]',
      params: { variantId: variant.id, productId: product.id },
    });

  const shiftMonth = (step: number) => {
    const [y, m] = month.split('-').map(Number);
    setMonth(toLocalDate(new Date(y, m - 1 + step, 1)));
  };

  const stock = [
    { label: t('rental.item.total'), value: owned, tone: 'bg-sunken', fg: 'text-ink' },
    { label: t('rental.item.freeToday'), value: freeToday, tone: 'bg-ok-bg', fg: 'text-ok-fg' },
    {
      label: t('rental.item.busyToday'),
      value: freeToday === undefined ? undefined : Math.max(owned - freeToday, 0),
      tone: 'bg-info-bg',
      fg: 'text-info-fg',
    },
  ];

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        {canManage ? (
          <IconButton
            icon={Pencil}
            accessibilityLabel={t('rental.item.edit')}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/(products)/rental-form/[variantId]',
                params: { variantId: variant.id, productId: product.id },
              })
            }
          />
        ) : null}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
        <View className="bg-hero rounded-2xl p-[18px] gap-3">
          <View className="flex-row items-start gap-3">
            <View className="flex-1 min-w-0 gap-1">
              <Text className="type-heading text-hero-ink" accessibilityRole="header">{product.name}</Text>
              {subtitle ? <Text className="font-onest text-[13px] text-hero-muted">{subtitle}</Text> : null}
            </View>
            <StatusBadge
              label={rentable ? t('rental.item.rented') : t('rental.item.notRented')}
              tone={rentable ? 'accent' : 'neutral'}
            />
          </View>
          <Text className="font-onest-bold text-[30px] tracking-[-0.6px] text-hero-ink tabular-nums">
            {price > 0 ? formatMoney(price) : '—'}{' '}
            <Text className="font-onest text-[15px] text-hero-muted">{t('rental.item.perDay')}</Text>
          </Text>
        </View>

        <View className="bg-card rounded-xl p-3.5 gap-3">
          <Text className="font-onest-bold text-[15px] text-ink">{t('rental.item.today')}</Text>
          <View className="flex-row gap-2">
            {stock.map((s) => (
              <View key={s.label} className={cn('flex-1 rounded-md px-3 py-2.5 gap-0.5', s.tone)}>
                <Text className={cn('font-onest-bold text-xl tabular-nums', s.fg)}>{s.value ?? '…'}</Text>
                <Text className={cn('font-onest text-xs', s.fg)} numberOfLines={2}>{s.label}</Text>
              </View>
            ))}
          </View>
          <Text className="font-onest text-xs text-muted">{t('rental.item.busyHint')}</Text>
        </View>

        <View className="bg-card rounded-xl p-3.5 gap-3">
          <View className="flex-row items-center gap-2">
            <IconButton icon={ChevronLeft} variant="sunken" size="sm" accessibilityLabel={t('rental.agenda.prev')} onPress={() => shiftMonth(-1)} />
            <View className="flex-1 items-center">
              <Text className="font-onest-bold text-[15px] text-ink">{t('rental.item.occupancy', { month: formatMonth(month, lang) })}</Text>
              <Text className="font-onest text-xs text-muted">{t('rental.item.ofUnits', { count: monthOwned })}</Text>
            </View>
            <IconButton icon={ChevronRight} variant="sunken" size="sm" accessibilityLabel={t('rental.agenda.next')} onPress={() => shiftMonth(1)} />
          </View>
          <View className="flex-row">
            {weekDayLabels(lang).map((label, i) => (
              <Text key={label} className={cn('flex-1 text-center font-onest-semibold text-[11px] uppercase', i > 4 ? 'text-err-fg' : 'text-muted')}>
                {label}
              </Text>
            ))}
          </View>
          {monthCalendar.isLoading ? (
            <ActivityIndicator color={colors.muted} className="py-6" />
          ) : (
            <View className="flex-row flex-wrap">
              {monthGrid(month).map((day, i) => {
                if (!day) return <View key={`pad-${i}`} className="w-[14.28%] h-12" />;
                const d = days.get(day);
                const busy = d ? d.busy > 0 : false;
                const full = d ? d.available === 0 && monthOwned > 0 : false;
                const cleaning = d ? d.cleaning > 0 : false;
                // Busy only because of dry cleaning: its own colour, not the booking red/yellow
                const cleaningOnly = cleaning && !!d && d.busy === d.cleaning;
                const tone = cleaningOnly ? 'info' : full ? 'err' : busy ? 'warn' : null;
                return (
                  <View key={day} className="w-[14.28%] p-0.5">
                    <View
                      accessibilityLabel={t('rental.item.dayA11y', {
                        date: formatLocalDate(day, lang),
                        free: d?.available ?? monthOwned,
                        total: monthOwned,
                      })}
                      className={cn(
                        'h-12 rounded-md items-center justify-center',
                        tone === 'info' ? 'bg-info-bg' : tone === 'err' ? 'bg-err-bg' : tone === 'warn' ? 'bg-warn-bg' : '',
                        // Bookings and dry cleaning on the same day: booking colour + blue ring
                        day === today ? 'border-2 border-accent' : cleaning && !cleaningOnly && 'border-2 border-info-fg',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm tabular-nums',
                          day === today ? 'font-onest-bold' : 'font-onest-medium',
                          tone === 'info' ? 'text-info-fg' : tone === 'err' ? 'text-err-fg' : tone === 'warn' ? 'text-warn-fg' : 'text-ink',
                        )}
                      >
                        {Number(day.slice(8))}
                      </Text>
                      {busy && d ? (
                        <Text
                          className={cn(
                            'font-onest-semibold text-[10px]',
                            tone === 'info' ? 'text-info-fg' : full ? 'text-err-fg' : 'text-warn-fg',
                          )}
                        >
                          {d.available}/{monthOwned}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View className="flex-row flex-wrap gap-x-4 gap-y-1 px-0.5">
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-sm bg-warn-bg" />
              <Text className="font-onest text-xs text-muted">{t('rental.item.partlyBusy')}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-sm bg-err-bg" />
              <Text className="font-onest text-xs text-muted">{t('rental.item.allBusy')}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-sm bg-info-bg" />
              <Text className="font-onest text-xs text-muted">{t('rental.cleaningCard.legend')}</Text>
            </View>
          </View>
        </View>

        <View className="bg-card rounded-xl p-3.5 gap-2">
          <View className="flex-row items-center justify-between px-0.5 pb-0.5">
            <Text className="font-onest-bold text-[15px] text-ink">{t('rental.cleaningCard.title')}</Text>
            {canManage && rentalEnabled ? (
              <Pressable onPress={openCleaning} accessibilityRole="button" hitSlop={8} className="active:opacity-70">
                <Text className="font-onest-semibold text-[13px] text-ink">{t('rental.cleaningCard.plan')}</Text>
              </Pressable>
            ) : null}
          </View>
          {cleanings.isLoading ? (
            <ActivityIndicator color={colors.muted} className="py-3" />
          ) : (cleanings.data ?? []).length === 0 ? (
            <Text className="font-onest text-[13px] text-muted px-0.5 pb-1">{t('rental.cleaningCard.empty')}</Text>
          ) : (
            (cleanings.data ?? []).map((c) => {
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
            })
          )}
        </View>

        <View className="bg-card rounded-xl p-3.5 gap-2">
          <Text className="font-onest-bold text-[15px] text-ink px-0.5 pb-0.5">{t('rental.item.upcoming')}</Text>
          {upcoming.isLoading ? (
            <ActivityIndicator color={colors.muted} className="py-3" />
          ) : (upcoming.data?.data ?? []).length === 0 ? (
            <Text className="font-onest text-[13px] text-muted px-0.5 pb-1">{t('rental.item.noUpcoming')}</Text>
          ) : (
            (upcoming.data?.data ?? []).map((rental) => {
              const badges = rentalBadges(rental, t);
              const badge = badges[badges.length - 1];
              return (
                <Pressable
                  key={rental.id}
                  onPress={() => router.push({ pathname: '/(tabs)/(rentals)/[id]', params: { id: rental.id } })}
                  accessibilityRole="button"
                  className="flex-row items-center gap-3 p-3 rounded-lg bg-sunken active:opacity-80"
                >
                  <View className="flex-1 min-w-0 gap-0.5">
                    <Text className="type-body-strong text-ink">
                      {formatDay(rental.startDate, lang)} → {formatDay(rental.endDate, lang)}
                    </Text>
                    <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                      {rental.customer?.fullName ?? t('rental.noCustomer')} · №{rental.code}
                    </Text>
                  </View>
                  {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {rentalEnabled ? (
        <View className="px-4 pt-2 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
          {!rentable ? (
            <Text className="font-onest text-[13px] text-center text-muted">{t('rental.item.cantBook')}</Text>
          ) : null}
          <View className="flex-row gap-2">
            {canManage && owned > 0 ? (
              <View className="flex-1">
                <Button variant="secondary" size="lg" full icon={WashingMachine} onPress={openCleaning}>
                  {t('rental.cleaningCard.toCleaning')}
                </Button>
              </View>
            ) : null}
            <View className="flex-1">
              <Button
                variant="accent"
                size="lg"
                full
                disabled={!rentable}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/(rentals)/create',
                    params: { productId: product.id, variantId: variant.id },
                  })
                }
              >
                {t('rental.item.book')}
              </Button>
            </View>
          </View>
        </View>
      ) : null}

      <CancelCleaningSheet cleaning={cancelling} onClose={() => setCancelling(null)} />
    </View>
  );
}
