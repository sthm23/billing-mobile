import { Button, Chip, IconButton, Money, PhotoPlaceholder, Pressable, StatusBadge, Stepper, Text, toast } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { CustomerPickerSheet, digitsOf } from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { canLowerPrice } from '@/libs/roles';
import { distributeSetDiscount } from '@/libs/set-discount';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import { getVariantLabel } from '@/libs/product-utils';
import { useStaffWarehouses } from '@/screens/order/cart/use-staff-warehouses';
import { useProductById } from '@/services/product/product.queries';
import type { OrderCustomer } from '@/services/customer';
import {
  RentalErrorCode,
  RentalStatus,
  useCreateRental,
  useRental,
  useRentalAvailability,
  useUpdateRental,
  type RentableVariant,
  type RentalBookingPayload,
  type RentalDetail,
  type RentalMutationError,
  type SimilarVariant,
} from '@/services/rental';
import { router } from 'expo-router';
import { CalendarDays, ChevronLeft, CircleAlert, Lock, Plus, Sparkles, UserRound, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingDays, formatDay, formatLocalDate, initials, salonDate, toLocalDate } from '../rental-format';
import { DateRangeSheet, type DateRange } from './DateRangeSheet';
import { ReplaceItemSheet, type ReplaceTarget } from './ReplaceItemSheet';
import { ServiceSheet, type ServiceDraft } from './ServiceSheet';
import { VariantSearchSheet } from './VariantSearchSheet';

interface BookingLine {
  variantId: string;
  name: string;
  /** Attributes / SKU */
  meta: string;
  rentPricePerDay: number;
  quantity: number;
  /** Discount per unit saved on the booking (or 0) */
  sale: number;
}

interface ServiceLine extends ServiceDraft {
  sale: number;
}

function attrsLabel(values: (string | null | undefined)[], sku: string): string {
  return values.filter(Boolean).join(' · ') || sku;
}

interface RentalFormScreenProps {
  /** Edit this booking; omitted — a new one */
  rentalId?: string;
  /** New booking started from an item card: this variant (of this product) is added */
  preset?: { productId: string; variantId: string };
}

/** First line and warehouse of a booking started from an item card */
interface BookingPreset {
  warehouseId: string;
  line: BookingLine;
}

/**
 * New booking / edit (design «Аренда · бронь», R3, R11): customer, dates,
 * items with free units from the backend, services and a set discount spread
 * over the lines (`libs/set-discount.ts`). Totals here are a preview — the
 * backend prices the booking and checks availability and the discount role.
 */
export function RentalFormScreen({ rentalId, preset }: RentalFormScreenProps) {
  const { t } = useTranslation();
  const existing = useRental(rentalId);
  const product = useProductById(preset?.productId ?? '', { enabled: !!preset });

  if ((rentalId && existing.isLoading) || (preset && product.isLoading)) {
    return <LoadingState />;
  }
  if (rentalId && (existing.isError || !existing.data)) {
    return (
      <EmptyState icon={CircleAlert} message={t('rental.card.loadFailed')}>
        <Button variant="secondary" onPress={() => router.back()}>{t('common.back')}</Button>
      </EmptyState>
    );
  }
  if (existing.data && existing.data.status !== RentalStatus.BOOKED) {
    return (
      <EmptyState icon={Lock} message={t('rental.form.onlyBooked')}>
        <Button variant="secondary" onPress={() => router.back()}>{t('common.back')}</Button>
      </EmptyState>
    );
  }
  const variant = preset ? product.data?.variants.find((v) => v.id === preset.variantId) : undefined;
  const start: BookingPreset | undefined =
    product.data && variant
      ? {
          warehouseId: product.data.warehouseId,
          line: {
            variantId: variant.id,
            name: product.data.name,
            meta: getVariantLabel(variant),
            rentPricePerDay: Number(variant.rentPricePerDay ?? 0),
            quantity: 1,
            sale: 0,
          },
        }
      : undefined;
  return <RentalForm rental={existing.data} preset={start} />;
}

function RentalForm({ rental, preset }: { rental?: RentalDetail; preset?: BookingPreset }) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const warehouses = useStaffWarehouses();
  const canDiscount = canLowerPrice(user);
  const isEdit = !!rental;

  const [warehouseId, setWarehouseId] = useState<string | undefined>(
    rental?.warehouseId ??
      (preset && warehouses.some((w) => w.id === preset.warehouseId)
        ? preset.warehouseId
        : warehouses.length === 1
          ? warehouses[0].id
          : undefined),
  );
  const [customer, setCustomer] = useState<OrderCustomer | null>(() => {
    const c = rental?.order.customer;
    return c ? { id: c.id, fullName: c.user.fullName, phone: c.user.phone } : null;
  });
  const [range, setRange] = useState<DateRange | null>(() =>
    rental ? { start: salonDate(rental.startDate), end: salonDate(rental.endDate) } : null,
  );
  const [lines, setLines] = useState<BookingLine[]>(() =>
    preset && !rental ? [preset.line] : (rental?.order.items ?? []).map((item) => ({
      variantId: item.variantId,
      name: item.variant.product.name,
      meta: attrsLabel(
        item.variant.attributes.map((a) => a.value.valueString ?? (a.value.valueNumber != null ? String(a.value.valueNumber) : null)),
        item.variant.sku,
      ),
      rentPricePerDay: Number(item.variant.rentPricePerDay ?? 0),
      quantity: item.quantity,
      sale: Number(item.sale),
    })),
  );
  const [services, setServices] = useState<ServiceLine[]>(() =>
    (rental?.order.services ?? []).map((s) => ({
      name: s.name,
      price: Number(s.price),
      sale: Number(s.sale),
      description: s.description ?? '',
    })),
  );
  /** Total the manager agreed on (formatted digits); '' — the line discounts as they are */
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [customerOpen, setCustomerOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [replace, setReplace] = useState<ReplaceTarget | null>(null);
  const [serviceEdit, setServiceEdit] = useState<{ index: number | null } | null>(null);

  const createRental = useCreateRental();
  const updateRental = useUpdateRental();
  const saving = createRental.isPending || updateRental.isPending;

  const availability = useRentalAvailability({
    warehouseId,
    startDate: range?.start,
    endDate: range?.end,
    variantIds: lines.map((l) => l.variantId),
    excludeRentalId: rental?.id,
  });
  const availableById = useMemo(
    () => new Map((availability.data ?? []).map((a) => [a.variantId, a])),
    [availability.data],
  );

  // ---------------------------------------------------------- preview totals

  const days = range ? bookingDays(range.start, range.end) : 0;
  const unitPrice = (line: BookingLine) => line.rentPricePerDay * days;
  const targetValue = target ? digitsOf(target) : null;

  const pricing = useMemo(() => {
    const base =
      lines.reduce((s, l) => s + l.rentPricePerDay * days * l.quantity, 0) + services.reduce((s, x) => s + x.price, 0);
    let itemSales = lines.map((l) => l.sale);
    let serviceSales = services.map((s) => s.sale);
    let invalid = false;
    if (targetValue !== null && days > 0) {
      try {
        const sales = distributeSetDiscount(
          [
            ...lines.map((l) => ({ unitPrice: l.rentPricePerDay * days, quantity: l.quantity })),
            ...services.map((s) => ({ unitPrice: s.price, quantity: 1 })),
          ],
          targetValue,
        );
        itemSales = sales.slice(0, lines.length);
        serviceSales = sales.slice(lines.length);
      } catch {
        invalid = true;
      }
    }
    const discount =
      lines.reduce((s, l, i) => s + Math.min(itemSales[i], l.rentPricePerDay * days) * l.quantity, 0) +
      services.reduce((s, x, i) => s + Math.min(serviceSales[i], x.price), 0);
    return { base, itemSales, serviceSales, discount, total: base - discount, invalid };
  }, [lines, services, days, targetValue]);

  // A changed variant set or dates may leave saved discounts above the new price
  useEffect(() => setError(null), [lines, services, range, customer, target]);

  const lineState = (line: BookingLine) => {
    if (!range || !warehouseId) return null;
    const a = availableById.get(line.variantId);
    if (!a) return availability.isFetching ? 'checking' : null;
    return a.available >= line.quantity ? 'free' : 'busy';
  };
  const busyCount = lines.filter((l) => lineState(l) === 'busy').length;

  // -------------------------------------------------------------- actions

  const addVariant = (variant: RentableVariant) => {
    setSearchOpen(false);
    if (lines.some((l) => l.variantId === variant.id)) return;
    setLines((current) => [
      ...current,
      {
        variantId: variant.id,
        name: variant.productName,
        meta: attrsLabel(variant.attributes.map((a) => a.value), variant.sku),
        rentPricePerDay: Number(variant.rentPricePerDay ?? 0),
        quantity: 1,
        sale: 0,
      },
    ]);
  };

  const replaceVariant = (variant: SimilarVariant) => {
    if (!replace) return;
    setLines((current) =>
      current.map((l) =>
        l.variantId === replace.variantId
          ? {
              variantId: variant.variantId,
              name: variant.productName,
              meta: attrsLabel(variant.attributes.map((a) => a.value), variant.sku),
              rentPricePerDay: Number(variant.rentPricePerDay ?? 0),
              quantity: l.quantity,
              sale: 0,
            }
          : l,
      ),
    );
    setReplace(null);
    toast.show(t('rental.replace.done', { name: variant.productName }), 'success');
  };

  const updateLine = (variantId: string, patch: Partial<BookingLine>) =>
    setLines((current) => current.map((l) => (l.variantId === variantId ? { ...l, ...patch } : l)));

  const saveService = (draft: ServiceDraft) => {
    const index = serviceEdit?.index ?? null;
    setServices((current) =>
      index === null
        ? [...current, { ...draft, sale: 0 }]
        : current.map((s, i) => (i === index ? { ...s, ...draft, sale: Math.min(s.sale, draft.price) } : s)),
    );
    setServiceEdit(null);
  };

  const removeDiscount = () => {
    setTarget('');
    setLines((current) => current.map((l) => ({ ...l, sale: 0 })));
    setServices((current) => current.map((s) => ({ ...s, sale: 0 })));
  };

  let hint: string | null = null;
  if (!warehouseId) hint = t('rental.form.hintWarehouse');
  else if (!customer || !range || lines.length === 0) hint = t('rental.form.hintRequired');
  else if (busyCount > 0) hint = t('rental.form.hintBusy');
  else if (pricing.invalid) hint = t('rental.form.hintTotal');
  const canSave = !hint && !saving;

  const save = () => {
    if (!canSave || !warehouseId || !customer || !range) return;
    const payload: RentalBookingPayload = {
      warehouseId,
      customerId: customer.id,
      startDate: range.start,
      endDate: range.end,
      items: lines.map((l, i) => ({
        variantId: l.variantId,
        quantity: l.quantity,
        sale: Math.min(pricing.itemSales[i], unitPrice(l)),
      })),
      services: services.map((s, i) => ({
        name: s.name,
        price: s.price,
        sale: Math.min(pricing.serviceSales[i], s.price),
        description: s.description || undefined,
      })),
      notes: rental?.notes ?? undefined,
    };
    const onError = (err: RentalMutationError) => {
      if (err.response?.data?.code === RentalErrorCode.NOT_AVAILABLE) void availability.refetch();
      setError(getApiErrorMessage(err, t('rental.form.saveFailed')));
    };
    if (rental) {
      updateRental.mutate(
        { id: rental.id, body: payload },
        {
          onSuccess: () => {
            toast.show(t('rental.form.updated'), 'success');
            router.back();
          },
          onError,
        },
      );
    } else {
      createRental.mutate(payload, {
        onSuccess: (created) => {
          // A new booking goes straight to prepayment and collateral
          router.replace({ pathname: '/(tabs)/(rentals)/pay/[id]', params: { id: created.id, created: '1' } });
        },
        onError,
      });
    }
  };

  const warehouseName = warehouses.find((w) => w.id === warehouseId)?.name ?? rental?.order.warehouse.name;
  const paid = Number(rental?.order.paidAmount ?? 0);

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header" numberOfLines={1}>
            {rental ? t('rental.card.title', { code: rental.code }) : t('rental.newBooking')}
          </Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {rental ? t('rental.form.editSubtitle') : warehouseName ?? t('rental.form.hintWarehouse')}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
      >
        {isEdit && paid > 0 ? (
          <View className="flex-row items-center justify-between px-3.5 py-3 rounded-lg bg-ok-bg">
            <Text className="font-onest-semibold text-sm text-ok-fg">
              {t('rental.form.paidSoFar', { amount: formatMoney(paid) })}
            </Text>
          </View>
        ) : null}

        {!isEdit && warehouses.length > 1 ? (
          <View className="flex-row flex-wrap gap-2">
            {warehouses.map((w) => (
              <Chip
                key={w.id}
                label={w.name}
                selected={w.id === warehouseId}
                onPress={() => {
                  if (w.id === warehouseId) return;
                  setWarehouseId(w.id);
                  // Items belong to a warehouse
                  setLines([]);
                }}
              />
            ))}
          </View>
        ) : null}

        {/* Customer */}
        <Card title={t('rental.form.customer')} note={t('rental.form.required')}>
          {customer ? (
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-full bg-sunken items-center justify-center">
                <Text className="font-onest-bold text-sm text-ink">{initials(customer.fullName)}</Text>
              </View>
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="type-body-strong text-ink" numberOfLines={1}>{customer.fullName}</Text>
                <Text className="font-onest text-xs text-muted">{customer.phone}</Text>
              </View>
              <Button variant="secondary" size="sm" onPress={() => setCustomerOpen(true)}>
                {t('rental.form.change')}
              </Button>
            </View>
          ) : (
            <Button variant="secondary" icon={UserRound} full onPress={() => setCustomerOpen(true)}>
              {t('rental.form.pickCustomer')}
            </Button>
          )}
        </Card>

        {/* Dates */}
        <Card
          title={t('rental.form.dates')}
          note={
            rental
              ? t('rental.form.wasDates', {
                  from: formatDay(rental.startDate, i18n.language),
                  to: formatDay(rental.endDate, i18n.language),
                })
              : undefined
          }
        >
          <View className="flex-row gap-2">
            {(['start', 'end'] as const).map((edge) => (
              <Pressable
                key={edge}
                onPress={() => setDatesOpen(true)}
                accessibilityRole="button"
                className="flex-1 rounded-md bg-sunken px-3.5 py-2.5 gap-0.5"
              >
                <Text className="font-onest text-xs text-muted">
                  {edge === 'start' ? t('rental.form.issueDay') : t('rental.form.returnDay')}
                </Text>
                <Text className={cn('text-[15px]', range ? 'font-onest-bold text-ink' : 'font-onest-medium text-muted')}>
                  {range ? formatLocalDate(range[edge], i18n.language) : t('rental.form.pickDate')}
                </Text>
              </Pressable>
            ))}
          </View>
          {range ? (
            <View className="flex-row items-center gap-2 px-0.5">
              <CalendarDays size={16} color={colors.soft} strokeWidth={2} />
              <Text className="font-onest-bold text-sm text-ink">{t('rental.days', { count: days })}</Text>
              <Text className="flex-1 font-onest text-xs text-muted">{t('rental.form.returnByHint')}</Text>
            </View>
          ) : null}
        </Card>

        {/* Items */}
        <Card
          title={lines.length ? t('rental.items.title', { count: lines.length }) : t('rental.form.items')}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              disabled={!warehouseId}
              onPress={() => setSearchOpen(true)}
            >
              {t('rental.form.addItem')}
            </Button>
          }
        >
          {lines.length === 0 ? (
            <Text className="font-onest text-[13px] leading-[18px] text-muted text-center py-2">
              {t('rental.form.noItems')}
            </Text>
          ) : (
            lines.map((line, i) => {
              const state = lineState(line);
              const a = availableById.get(line.variantId);
              const full = unitPrice(line) * line.quantity;
              const sum = full - Math.min(pricing.itemSales[i] ?? 0, unitPrice(line)) * line.quantity;
              return (
                <View
                  key={line.variantId}
                  className={cn('rounded-md bg-sunken p-2.5 gap-2.5', state === 'busy' && 'border-2 border-err-fg')}
                >
                  <View className="flex-row gap-3">
                    <PhotoPlaceholder size="sm" className="w-12 h-14 rounded-sm" />
                    <View className="flex-1 min-w-0 gap-0.5">
                      <View className="flex-row items-start gap-2">
                        <Text className="flex-1 font-onest-bold text-[15px] text-ink" numberOfLines={2}>{line.name}</Text>
                        <IconButton
                          icon={X}
                          size="sm"
                          variant="card"
                          accessibilityLabel={t('rental.form.removeItem')}
                          onPress={() => setLines((current) => current.filter((l) => l.variantId !== line.variantId))}
                        />
                      </View>
                      <Text className="font-onest text-xs text-muted" numberOfLines={1}>{line.meta}</Text>
                      <Text className="font-onest text-xs text-soft">
                        {t('rental.form.calc', {
                          price: formatMoney(line.rentPricePerDay),
                          days: t('rental.days', { count: days || 1 }),
                        })}
                      </Text>
                      {days > 0 ? (
                        <View className="flex-row items-baseline gap-1.5">
                          {sum < full ? (
                            <Money value={full} currency={null} className="font-onest text-xs text-muted line-through" />
                          ) : null}
                          <Money value={sum} currency={t('common.currency')} className="font-onest-bold text-[15px] text-ink" currencyClassName="text-[11px] text-muted" />
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {state === 'busy' ? (
                      <StatusBadge label={t('rental.form.busy')} tone="err" />
                    ) : state === 'free' && a ? (
                      <StatusBadge label={t('rental.form.freeOf', { available: a.available, owned: a.owned })} tone="ok" />
                    ) : state === 'checking' ? (
                      <StatusBadge label={t('rental.form.checking')} tone="neutral" />
                    ) : (
                      <StatusBadge label={t('rental.form.pickDatesFirst')} tone="neutral" />
                    )}
                    <View className="flex-1" />
                    {state === 'busy' && range && warehouseId ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => setReplace({ variantId: line.variantId, name: line.name, quantity: line.quantity })}
                      >
                        {t('rental.form.replace')}
                      </Button>
                    ) : null}
                    <Stepper
                      size="sm"
                      value={line.quantity}
                      min={1}
                      max={a ? Math.max(a.owned, 1) : undefined}
                      onChange={(quantity) => updateLine(line.variantId, { quantity })}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Card>

        {/* Services */}
        <Card
          title={t('rental.form.services')}
          action={
            <Button variant="secondary" size="sm" icon={Plus} onPress={() => setServiceEdit({ index: null })}>
              {t('rental.form.addService')}
            </Button>
          }
        >
          {services.length === 0 ? (
            <Text className="font-onest text-[13px] text-muted text-center py-1">{t('rental.form.noServices')}</Text>
          ) : (
            services.map((service, i) => {
              const sum = service.price - Math.min(pricing.serviceSales[i] ?? 0, service.price);
              return (
                <Pressable
                  key={`${service.name}-${i}`}
                  onPress={() => setServiceEdit({ index: i })}
                  accessibilityRole="button"
                  className="flex-row items-center gap-3 p-2.5 rounded-md bg-sunken"
                >
                  <View className="w-10 h-10 rounded-sm bg-card items-center justify-center">
                    <Sparkles size={18} color={colors.soft} strokeWidth={2} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="font-onest-bold text-[15px] text-ink" numberOfLines={1}>{service.name}</Text>
                    {service.description ? (
                      <Text className="font-onest text-xs text-muted" numberOfLines={1}>{service.description}</Text>
                    ) : null}
                  </View>
                  <View className="items-end">
                    <Money value={sum} currency={null} className="font-onest-bold text-[15px] text-ink" />
                    {sum < service.price ? (
                      <Money value={service.price} currency={null} className="font-onest text-xs text-muted line-through" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>

        {/* Total and the set discount */}
        <View className="bg-hero rounded-2xl p-[18px] gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-onest text-sm text-hero-muted">{t('rental.card.total')}</Text>
            {pricing.discount > 0 ? (
              <Text className="font-onest text-[13px] text-hero-muted">
                {t('rental.form.byLines', { amount: formatMoney(pricing.base) })}
              </Text>
            ) : null}
          </View>
          <Money
            value={pricing.invalid ? pricing.base : pricing.total}
            currency={t('common.currency')}
            className="text-[32px] tracking-[-0.6px] text-hero-ink"
            currencyClassName="text-[15px] text-hero-muted"
          />
          <View className={cn('rounded-md bg-hero-sub px-3.5 py-2.5 gap-1', !canDiscount && 'opacity-60')}>
            <Text className="font-onest text-xs text-hero-muted">{t('rental.form.targetLabel')}</Text>
            <View className="flex-row items-center gap-2">
              {!canDiscount ? <Lock size={16} color={colors.heroMuted} strokeWidth={2} /> : null}
              <TextInput
                value={target}
                editable={canDiscount && days > 0}
                onChangeText={(text) => {
                  const n = digitsOf(text);
                  setTarget(text.trim() === '' ? '' : formatMoney(n));
                }}
                keyboardType="number-pad"
                placeholder={canDiscount ? t('rental.form.noDiscount') : formatMoney(pricing.total)}
                placeholderTextColor={colors.heroMuted}
                accessibilityLabel={t('rental.form.targetLabel')}
                // Android adds vertical padding to TextInput — with a fixed height it clipped the digits
                textAlignVertical="center"
                className="flex-1 min-w-0 h-11 py-0 font-onest-bold text-lg text-hero-ink tabular-nums"
              />
              <Text className="font-onest text-sm text-hero-muted">{t('common.currency')}</Text>
            </View>
            <Text className={cn('font-onest text-xs', pricing.invalid ? 'text-hero-err' : pricing.discount > 0 ? 'text-accent' : 'text-hero-muted')}>
              {!canDiscount
                ? t('rental.form.discountByManager')
                : pricing.invalid
                  ? t('rental.form.targetInvalid', { amount: formatMoney(pricing.base) })
                  : pricing.discount > 0
                    ? t('rental.form.discountSpread', { amount: formatMoney(pricing.discount) })
                    : t('rental.form.discountHint')}
            </Text>
          </View>
          {canDiscount && pricing.discount > 0 ? (
            <Button variant="hero" size="sm" onPress={removeDiscount} className="self-start">
              {t('rental.form.removeDiscount')}
            </Button>
          ) : null}
        </View>

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pt-2 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        {hint ? <Text className="font-onest text-[13px] text-muted text-center">{hint}</Text> : null}
        <Button variant="accent" size="lg" full disabled={!canSave} loading={saving} onPress={save}>
          {rental
            ? t('rental.form.saveChanges')
            : t('rental.form.book', { amount: formatMoney(pricing.invalid ? pricing.base : pricing.total) })}
        </Button>
      </View>

      <CustomerPickerSheet
        isOpen={customerOpen}
        selectedId={customer?.id}
        onClose={() => setCustomerOpen(false)}
        onSelect={(picked) => {
          setCustomer(picked);
          setCustomerOpen(false);
        }}
      />
      <DateRangeSheet
        isOpen={datesOpen}
        value={range}
        minDate={rental ? undefined : toLocalDate(new Date())}
        onClose={() => setDatesOpen(false)}
        onChange={setRange}
      />
      <VariantSearchSheet
        isOpen={searchOpen}
        warehouseId={warehouseId}
        addedIds={lines.map((l) => l.variantId)}
        onClose={() => setSearchOpen(false)}
        onPick={addVariant}
      />
      {range && warehouseId ? (
        <ReplaceItemSheet
          target={replace}
          warehouseId={warehouseId}
          startDate={range.start}
          endDate={range.end}
          excludeRentalId={rental?.id}
          addedIds={lines.map((l) => l.variantId)}
          onClose={() => setReplace(null)}
          onReplace={replaceVariant}
        />
      ) : null}
      <ServiceSheet
        isOpen={serviceEdit !== null}
        value={serviceEdit?.index != null ? services[serviceEdit.index] : null}
        onClose={() => setServiceEdit(null)}
        onSave={saveService}
        onRemove={
          serviceEdit?.index != null
            ? () => {
                const index = serviceEdit.index;
                setServices((current) => current.filter((_, i) => i !== index));
                setServiceEdit(null);
              }
            : undefined
        }
      />
    </KeyboardAvoidingView>
  );
}

function Card({
  title,
  note,
  action,
  children,
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-card rounded-xl p-3.5 gap-2.5">
      <View className="flex-row items-center justify-between gap-2 px-0.5 min-h-8">
        <Text className="font-onest-bold text-[15px] text-ink">{title}</Text>
        {action ?? (note ? <Text className="font-onest text-xs text-muted">{note}</Text> : null)}
      </View>
      {children}
    </View>
  );
}
