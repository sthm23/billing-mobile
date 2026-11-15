import { Button, StatusBadge, Text, type StatusTone } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import {
  RentalStatus,
  type RentalCalendar,
  type SimilarVariant,
  type SimilarVariants,
  type VariantAvailability,
} from '@/services/rental';
import { Check, Clock, ImageIcon, WifiOff, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, View } from 'react-native';
import { addLocalDays, bookingDays, formatLocalDay, formatLocalDays, salonDate } from '../rental-format';

const MAX_SIMILAR = 5;

interface Reason {
  key: string;
  badge: { label: string; tone: StatusTone };
  text: string;
}

interface RentalAvailabilityResultProps {
  /** YYYY-MM-DD issue and return days */
  start: string;
  end: string;
  /** Day price of the selected variant */
  price: number;
  availability: VariantAvailability | undefined;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** `GET /rental/calendar` of the selected variant on the picked period: who holds the units */
  occupancy: RentalCalendar | undefined;
  /** Free replacements when the variant is busy */
  similar: SimilarVariants | undefined;
  onShift: (range: { start: string; end: string }) => void;
  onPickSimilar: (item: SimilarVariant, sameProduct: boolean) => void;
}

/**
 * Answer of the item card for the picked dates (design «Аренда · карточка
 * вещи»): free N of M with the price preview and the return time, or busy
 * with who holds the units, when one frees up (`nextFreeStart`, backend) and
 * free similar items. Prices here are a preview — the backend prices the booking.
 */
export function RentalAvailabilityResult({
  start,
  end,
  price,
  availability,
  loading,
  error,
  onRetry,
  occupancy,
  similar,
  onShift,
  onPickSimilar,
}: RentalAvailabilityResultProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const dates = formatLocalDays(start, end, lang);
  const days = bookingDays(start, end);

  if (loading) {
    return (
      <View
        className="bg-card rounded-xl px-3.5 py-4 gap-3"
        accessibilityLabel={t('rental.product.checking', { dates })}
        accessibilityState={{ busy: true }}
      >
        <View className="w-[55%] h-[18px] rounded-full bg-sunken" />
        <View className="w-[80%] h-3.5 rounded-full bg-sunken" />
        <View className="w-[40%] h-3.5 rounded-full bg-sunken" />
        <Text className="font-onest text-xs text-muted">{t('rental.product.checking', { dates })}</Text>
      </View>
    );
  }

  if (error || !availability) {
    return (
      <View className="bg-card rounded-xl px-3.5 py-4 flex-row items-center gap-3" accessibilityRole="alert">
        <View className="w-11 h-11 rounded-full bg-err-bg items-center justify-center">
          <WifiOff size={20} color={colors.errFg} strokeWidth={2} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-onest-bold text-[15px] text-ink">{t('rental.product.errorTitle')}</Text>
          <Text className="font-onest text-xs text-muted">{t('rental.product.errorText')}</Text>
        </View>
        <Button variant="primary" size="sm" onPress={onRetry}>
          {t('rental.product.retry')}
        </Button>
      </View>
    );
  }

  const { available, owned } = availability;
  const busy = available === 0;
  const tone: 'ok' | 'warn' | 'err' = busy ? 'err' : available < owned ? 'warn' : 'ok';
  const title = busy
    ? t('rental.product.busyTitle', { dates })
    : t('rental.product.freeOf', { free: available, total: owned });
  const sub = busy
    ? owned === 0
      ? t('rental.product.noUnits')
      : owned === 1
        ? t('rental.product.busyOnly')
        : t('rental.product.busyAll', { count: owned })
    : t('rental.product.periodSub', { dates, days: t('rental.days', { count: days }) });

  // Who holds the units on the period (warn / err only)
  const rentals = new Map((occupancy?.rentals ?? []).map((r) => [r.id, r]));
  const row = occupancy?.variants[0];
  const reasons: Reason[] = [];
  if (tone !== 'ok' && row) {
    row.bookings.forEach((b, i) => {
      const r = rentals.get(b.rentalId);
      if (!r) return;
      const afterReturn = r.status === RentalStatus.RETURNED || (!r.overdue && Date.parse(b.to) > Date.parse(r.endDate));
      const badge = r.overdue
        ? { label: t('rental.overdue'), tone: 'err' as const }
        : afterReturn
          ? { label: t('rental.product.reason.cleaning'), tone: 'info' as const }
          : r.status === RentalStatus.BOOKED
            ? { label: t('rental.product.reason.booked'), tone: 'info' as const }
            : { label: t('rental.product.reason.issued'), tone: 'warn' as const };
      reasons.push({
        key: `b-${b.rentalId}-${i}`,
        badge,
        text: afterReturn
          ? t('rental.product.reasonCleaningAfter', {
              qty: b.quantity,
              date: formatLocalDay(salonDate(b.to), lang),
              code: r.code,
            })
          : t('rental.product.reasonRental', {
              qty: b.quantity,
              code: r.code,
              name: r.customerName ?? t('rental.noCustomer'),
              dates: formatLocalDays(salonDate(r.startDate), salonDate(r.endDate), lang),
            }),
      });
    });
    row.cleanings.forEach((c) =>
      reasons.push({
        key: `c-${c.cleaningId}`,
        badge: { label: t('rental.product.reason.cleaning'), tone: 'info' },
        text: t('rental.product.reasonCleaningPlanned', { date: formatLocalDay(salonDate(c.to), lang) }),
      }),
    );
  }

  // When it frees up (err only)
  const next = availability.nextFreeStart;
  const overdue = reasons.length > 0 ? (occupancy?.rentals ?? []).find((r) => r.overdue) : undefined;
  const shift = next && next !== start ? { start: next, end: addLocalDays(next, days) } : null;

  const similarItems = [
    ...(similar?.sameProduct ?? []).map((s) => ({ item: s, sameProduct: true })),
    ...(similar?.sameCategory ?? []).map((s) => ({ item: s, sameProduct: false })),
  ]
    .filter((s) => s.item.available > 0)
    .slice(0, MAX_SIMILAR);

  const iconBg = tone === 'ok' ? 'bg-ok-bg' : tone === 'warn' ? 'bg-warn-bg' : 'bg-err-bg';
  const iconColor = tone === 'ok' ? colors.okFg : tone === 'warn' ? colors.warnFg : colors.errFg;
  const titleColor = tone === 'ok' ? 'text-ok-fg' : tone === 'warn' ? 'text-warn-fg' : 'text-err-fg';

  return (
    <>
      <View className="bg-card rounded-xl px-3.5 py-4 gap-3">
        <View className="flex-row items-center gap-3">
          <View className={cn('w-11 h-11 rounded-full items-center justify-center', iconBg)}>
            {busy ? (
              <X size={22} color={iconColor} strokeWidth={2.4} />
            ) : (
              <Check size={22} color={iconColor} strokeWidth={2.4} />
            )}
          </View>
          <View className="flex-1 gap-0.5">
            <Text className={cn('font-onest-bold text-lg', titleColor)}>{title}</Text>
            <Text className="font-onest text-[13px] text-muted">{sub}</Text>
          </View>
        </View>

        {!busy ? (
          <View className="gap-1.5 px-3.5 py-3 rounded-lg bg-sunken">
            <View className="flex-row items-center justify-between">
              <Text className="font-onest text-sm text-soft">
                {t('rental.product.calc', { days: t('rental.days', { count: days }), price: formatMoney(price) })}
              </Text>
              <Text className="font-onest-bold text-[17px] text-ink tabular-nums">
                {formatMoney(price * days)} <Text className="font-onest-medium text-[11px] text-muted">{t('common.currency')}</Text>
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Clock size={15} color={colors.soft} strokeWidth={2} />
              <Text className="font-onest text-[13px] text-soft">
                {t('rental.product.returnBy', { date: formatLocalDay(end, lang) })}
              </Text>
            </View>
          </View>
        ) : null}

        {reasons.map((r) => (
          <View key={r.key} className="flex-row items-center gap-2.5 px-3 py-2.5 rounded-[14px] bg-sunken">
            <StatusBadge label={r.badge.label} tone={r.badge.tone} />
            <Text className="flex-1 min-w-0 font-onest text-[13px] leading-4.5 text-ink">{r.text}</Text>
          </View>
        ))}

        {busy && owned > 0 ? (
          <View className="flex-row items-center gap-2.5 px-3.5 py-3 rounded-lg bg-info-bg">
            <View className="flex-1 gap-0.5">
              <Text className="font-onest-bold text-sm text-info-fg">
                {next
                  ? t('rental.product.freeFrom', { date: formatLocalDay(next, lang) })
                  : t('rental.product.freeUnknown')}
              </Text>
              <Text className="font-onest text-xs text-info-fg">
                {next
                  ? t('rental.product.freeFromSub')
                  : overdue
                    ? t('rental.product.freeUnknownOverdue', { code: overdue.code })
                    : t('rental.product.freeNotSoon')}
              </Text>
            </View>
            {shift ? (
              <Pressable
                onPress={() => onShift(shift)}
                accessibilityRole="button"
                className="h-9 px-3 rounded-full bg-card items-center justify-center active:opacity-80"
              >
                <Text className="font-onest-semibold text-[13px] text-ink">
                  {t('rental.product.shift', { dates: formatLocalDays(shift.start, shift.end, lang) })}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {busy && similarItems.length > 0 ? (
        <View className="bg-card rounded-xl px-3.5 py-4 gap-2.5">
          <View className="flex-row items-baseline justify-between px-0.5">
            <Text className="font-onest-bold text-[15px] text-ink">{t('rental.product.similarTitle', { dates })}</Text>
            <Text className="font-onest text-xs text-muted">{t('rental.product.similarHint')}</Text>
          </View>
          {similarItems.map(({ item, sameProduct }) => {
            const attrs = item.attributes.map((a) => a.value).filter(Boolean).join(' · ');
            return (
              <Pressable
                key={item.variantId}
                onPress={() => onPickSimilar(item, sameProduct)}
                accessibilityRole="button"
                className="flex-row items-center gap-3 py-2.5 pl-2.5 pr-3 rounded-[18px] bg-sunken active:opacity-80"
              >
                <View className="w-11 h-[52px] rounded-md bg-ph-bg items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <ImageIcon size={18} color={colors.phFg} strokeWidth={1.75} />
                  )}
                </View>
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="font-onest-bold text-[15px] text-ink" numberOfLines={1}>
                    {[item.productName, attrs].filter(Boolean).join(' · ')}
                  </Text>
                  <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                    {sameProduct ? t('rental.product.sameProduct') : t('rental.product.sameCategory')} ·{' '}
                    {formatMoney(Number(item.rentPricePerDay ?? 0))} {t('rental.item.perDay')}
                  </Text>
                </View>
                <StatusBadge label={t('rental.product.similarFree', { free: item.available, total: item.owned })} tone="ok" />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </>
  );
}
