import { Button, IconButton, StatusBadge, Text } from '@/components/base';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useStoreMode } from '@/hooks/use-store-mode';
import { useTheme } from '@/hooks/use-theme';
import { productCategoryLabel } from '@/libs/category';
import { formatMoney } from '@/libs/format';
import {
  buildAttributeMap,
  buildNameById,
  findVariantByAttrs,
  getVariantAttrs,
  getVariantLabel,
} from '@/libs/product-utils';
import { canManageProducts } from '@/libs/roles';
import type { ProductDetail } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import {
  rentalQueryKeys,
  useRentalAvailability,
  useRentalCalendar,
  useSimilarVariants,
  type SimilarVariant,
} from '@/services/rental';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ban, ChevronLeft, ChevronRight, History, WashingMachine } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addLocalDays,
  bookingDays,
  effectiveEnd,
  formatLocalDays,
  monthEnd,
  monthStart,
  pickRangeDay,
  toLocalDate,
} from '../rental-format';
import { RentalAvailabilityResult } from './RentalAvailabilityResult';
import { RentalDatesCalendar, type CalendarDay } from './RentalDatesCalendar';
import { RentalVariantActivity } from './RentalVariantActivity';
import { RentalVariantPicker } from './RentalVariantPicker';
import { isRentable } from './rental-product-utils';

interface RentalProductScreenProps {
  product: ProductDetail;
  /** Reloads the product (pull to refresh) */
  onRefresh: () => Promise<unknown>;
  /** Variant to show first (e.g. from the sale card or a similar item) */
  initialVariantId?: string;
  /** Dates already picked (e.g. a similar item opened from another card) */
  initialRange?: { start: string; end: string };
}

/**
 * Product card in rental mode (design «Аренда · карточка вещи»): the seller
 * picks a variant and the dates and sees at once whether it is free, what it
 * costs and until when to return it; when busy — who holds it, when it frees
 * up and free similar items. Availability, next free date and similar items
 * come from the backend; the price here is a preview — the backend prices the
 * booking. Management (price and rental, dry cleaning, history) — OWNER/MANAGER.
 */
export function RentalProductScreen({ product, onRefresh, initialVariantId, initialRange }: RentalProductScreenProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = canManageProducts(user);
  const { rentalEnabled } = useStoreMode();
  const today = toLocalDate(new Date());
  const warehouseId = product.warehouseId;

  const refreshControl = useRefreshControl(() =>
    Promise.all([onRefresh(), queryClient.invalidateQueries({ queryKey: rentalQueryKeys.all() })]),
  );

  // ------------------------------------------------------------ variant
  const nameById = useMemo(() => buildNameById(product.attributes ?? []), [product.attributes]);
  const attributeMap = useMemo(() => buildAttributeMap(product.variants, nameById), [product.variants, nameById]);
  const attributeNames = (product.attributes ?? []).map((a) => a.name);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() => {
    const first =
      product.variants.find((v) => v.id === initialVariantId) ??
      product.variants.find(isRentable) ??
      product.variants[0];
    return getVariantAttrs(first, nameById);
  });
  const selected = useMemo(
    () => findVariantByAttrs(product.variants, selectedAttrs, nameById),
    [product.variants, selectedAttrs, nameById],
  );
  const selectedRentable = !!selected && isRentable(selected);
  const price = Number(selected?.rentPricePerDay ?? 0);

  // -------------------------------------------------------------- dates
  const [pickStart, setPickStart] = useState<string | null>(initialRange?.start ?? null);
  const [pickEnd, setPickEnd] = useState<string | null>(initialRange?.end ?? null);
  const start = pickStart;
  const end = start ? effectiveEnd(start, pickEnd) : null;
  const [month, setMonth] = useState(() => monthStart(initialRange?.start ?? today));

  const pickDay = (day: string) => {
    const next = pickRangeDay({ start: pickStart, end: pickEnd }, day);
    setPickStart(next.start);
    setPickEnd(next.end);
  };
  const setRange = (range: { start: string; end: string } | null) => {
    setPickStart(range?.start ?? null);
    setPickEnd(range?.end ?? null);
    if (range) setMonth(monthStart(range.start));
  };

  // ------------------------------------------------------- availability
  const rentableIds = useMemo(() => product.variants.filter(isRentable).map((v) => v.id), [product.variants]);
  // No dates picked — what is free today
  const availability = useRentalAvailability({
    warehouseId,
    startDate: start ?? today,
    endDate: end ?? addLocalDays(today, 1),
    variantIds: rentableIds,
    nextFree: !!start,
  });
  const availLoading = availability.isLoading || (availability.isFetching && availability.isPlaceholderData);
  const availById = useMemo(
    () => new Map((availability.data ?? []).map((a) => [a.variantId, a])),
    [availability.data],
  );
  const selAvail = selected && !availLoading ? availById.get(selected.id) : undefined;

  const monthCal = useRentalCalendar({
    warehouseId: selectedRentable ? warehouseId : undefined,
    from: month,
    to: monthEnd(month),
    variantIds: selected ? [selected.id] : [],
  });
  const calRow = monthCal.data?.variants.find((v) => v.variantId === selected?.id);
  const calDays = useMemo(
    () => new Map<string, CalendarDay>((calRow?.days ?? []).map((d) => [d.date, d])),
    [calRow],
  );
  const owned = calRow?.owned ?? selected?.quantity ?? 0;

  // Who holds the units on the picked period — only when some are busy
  const someBusy = !!start && !!end && !!selAvail && selAvail.available < selAvail.owned;
  const periodCal = useRentalCalendar({
    warehouseId: someBusy ? warehouseId : undefined,
    from: start ?? today,
    to: end ? addLocalDays(end, -1) : today,
    variantIds: selected ? [selected.id] : [],
  });
  const similar = useSimilarVariants(
    start && end && selected && selAvail?.available === 0
      ? { warehouseId, variantId: selected.id, startDate: start, endDate: end }
      : null,
  );

  const pickSimilar = (item: SimilarVariant, sameProduct: boolean) => {
    const own = sameProduct ? product.variants.find((v) => v.id === item.variantId) : undefined;
    if (own) {
      setSelectedAttrs(getVariantAttrs(own, nameById));
      return;
    }
    router.push({
      pathname: '/(tabs)/(products)/rental/[variantId]',
      params: {
        variantId: item.variantId,
        productId: item.productId,
        ...(start && end ? { startDate: start, endDate: end } : {}),
      },
    });
  };

  // -------------------------------------------------------------- header
  const rentPrices = product.variants.filter(isRentable).map((v) => Number(v.rentPricePerDay));
  const minPrice = rentPrices.length ? Math.min(...rentPrices) : 0;
  const ownedTotal = product.variants.reduce((sum, v) => sum + v.quantity, 0);
  const category = productCategoryLabel(product, i18n.language);
  const subtitle = [category, t('rental.product.ownedTotal', { count: ownedTotal })].filter(Boolean).join(' · ');
  const variantLabel = selected ? getVariantLabel(selected) : '';
  const dates = start && end ? formatLocalDays(start, end, lang) : '';

  // ----------------------------------------------------------------- CTA
  const cta = !selected
    ? { label: t('rental.product.chooseVariant'), enabled: false }
    : !selectedRentable
      ? { label: t('rental.product.cta.notRented'), enabled: false }
      : !start || !end
        ? { label: t('rental.product.cta.pickDates'), enabled: false }
        : availLoading
          ? { label: t('rental.product.cta.checking'), enabled: false }
          : !selAvail
            ? { label: t('rental.item.book'), enabled: false }
            : selAvail.available === 0
              ? { label: t('rental.product.cta.noneFree', { dates }), enabled: false }
              : {
                  label: t('rental.product.cta.book', {
                    dates,
                    sum: formatMoney(price * bookingDays(start, end)),
                  }),
                  enabled: rentalEnabled,
                };

  const book = () => {
    if (!selected || !start || !end) return;
    router.push({
      pathname: '/(tabs)/(rentals)/create',
      params: { productId: product.id, variantId: selected.id, startDate: start, endDate: end },
    });
  };
  const openForm = () =>
    selected &&
    router.push({
      pathname: '/(tabs)/(products)/rental-form/[variantId]',
      params: { variantId: selected.id, productId: product.id },
    });

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        contentContainerClassName="px-4 pt-2 pb-4 gap-3"
      >
        <ImageCarousel
          images={product.images ?? []}
          productName={product.name}
          overlay={
            <>
              <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
              <View className="self-center">
                <StatusBadge label={t('rental.product.badge')} tone="accent" />
              </View>
            </>
          }
        />

        <View className="bg-hero rounded-2xl px-5 py-[18px] gap-2.5">
          <View className="gap-1">
            <Text className="type-heading text-hero-ink" accessibilityRole="header">{product.name}</Text>
            <Text className="font-onest text-[13px] text-hero-muted">{subtitle}</Text>
          </View>
          {rentPrices.length > 0 ? (
            <Text className="font-onest-bold text-[30px] tracking-[-0.6px] text-hero-ink tabular-nums">
              {new Set(rentPrices).size > 1 ? (
                <Text className="font-onest text-[15px] text-hero-muted">{t('product.from')} </Text>
              ) : null}
              {formatMoney(minPrice)}{' '}
              <Text className="font-onest text-[15px] text-hero-muted">{t('rental.item.perDay')}</Text>
            </Text>
          ) : (
            <Text className="font-onest-bold text-xl text-hero-muted">{t('rental.item.notRented')}</Text>
          )}
        </View>

        {product.variants.length > 0 ? (
          <RentalVariantPicker
            variants={product.variants}
            attributeNames={attributeNames}
            attributeMap={attributeMap}
            nameById={nameById}
            selectedAttrs={selectedAttrs}
            selected={selected}
            availability={availById}
            loading={availLoading}
            when={start && end ? t('rental.product.whenDates', { dates }) : t('rental.product.whenToday')}
            onSelect={setSelectedAttrs}
          />
        ) : null}

        {selectedRentable ? (
          <RentalDatesCalendar
            month={month}
            onMonthChange={setMonth}
            days={calDays}
            owned={owned}
            loading={monthCal.isLoading}
            start={start}
            end={end}
            onPick={pickDay}
            onClear={() => setRange(null)}
          />
        ) : null}

        {selectedRentable && start && end ? (
          <RentalAvailabilityResult
            start={start}
            end={end}
            price={price}
            availability={selAvail}
            loading={availLoading}
            error={availability.isError}
            onRetry={() => availability.refetch()}
            occupancy={someBusy ? periodCal.data : undefined}
            similar={similar.data}
            onShift={setRange}
            onPickSimilar={pickSimilar}
          />
        ) : null}

        {selected && !selectedRentable ? (
          <View className="bg-card rounded-xl px-3.5 py-4 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-full bg-sunken items-center justify-center">
                <Ban size={20} color={colors.soft} strokeWidth={2} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-onest-bold text-lg text-ink">{t('rental.item.notRented')}</Text>
                <Text className="font-onest text-[13px] text-muted">
                  {canManage ? t('rental.product.notRentedManager') : t('rental.product.notRentedSeller')}
                </Text>
              </View>
            </View>
            {canManage ? (
              <Button variant="primary" size="lg" full onPress={openForm}>
                {t('rental.product.enableRent')}
              </Button>
            ) : null}
          </View>
        ) : null}

        {selected ? (
          <RentalVariantActivity
            warehouseId={warehouseId}
            variantId={selected.id}
            variantLabel={variantLabel}
            canManage={canManage}
          />
        ) : null}

        {canManage && selected ? (
          <View className="bg-card rounded-xl px-3.5 py-4 gap-1">
            <View className="flex-row items-center justify-between px-0.5 pb-2">
              <Text className="font-onest-bold text-[15px] text-ink">{t('rental.product.manage')}</Text>
              <StatusBadge label={t('rental.product.manageRoles')} tone="neutral" />
            </View>
            <Pressable
              onPress={openForm}
              accessibilityRole="button"
              className="flex-row items-center gap-3 py-3 px-0.5 active:opacity-70"
            >
              <View className="flex-1 gap-0.5">
                <Text className="font-onest-semibold text-[15px] text-ink">{t('rental.item.edit')}</Text>
                <Text className="font-onest text-xs text-muted">
                  {selectedRentable
                    ? t('rental.product.priceRow', {
                        price: formatMoney(price),
                        days: t('rental.days', { count: selected.defaultCleaningDays ?? 1 }),
                      })
                    : t('rental.item.notRented')}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/(products)/history/[variantId]',
                  params: {
                    variantId: selected.id,
                    title: product.name,
                    subtitle: variantLabel,
                    stock: String(selected.quantity),
                  },
                })
              }
              accessibilityRole="button"
              className="flex-row items-center gap-3 py-3 px-0.5 border-t border-line active:opacity-70"
            >
              <History size={18} color={colors.soft} strokeWidth={2} />
              <Text className="flex-1 font-onest-semibold text-[15px] text-ink">{t('rental.product.history')}</Text>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2} />
            </Pressable>
            {rentalEnabled && selected.quantity > 0 ? (
              <Button
                variant="secondary"
                size="lg"
                full
                icon={WashingMachine}
                className="mt-1.5"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/(products)/cleaning/[variantId]',
                    params: { variantId: selected.id, productId: product.id },
                  })
                }
              >
                {t('rental.cleaningCard.toCleaning')}
              </Button>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pt-3 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button variant="accent" size="lg" full disabled={!cta.enabled} onPress={book}>
          {cta.label}
        </Button>
      </View>
    </View>
  );
}
