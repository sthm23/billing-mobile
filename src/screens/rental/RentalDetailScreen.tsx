import { Button, HeroCard, IconButton, Money, PhotoPlaceholder, StatusBadge, Text, toast } from '@/components/base';
import type { HeroCardTile, StatusTone } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { canLowerPrice } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import {
  RentalStatus,
  useRental,
  useReturnCollateral,
  type RentalCollateral,
  type RentalDetail,
  type RentalOrderItem,
} from '@/services/rental';
import { router } from 'expo-router';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  CircleAlert,
  Ellipsis,
  Lock,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react-native';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from '@/components/base/Sheet';
import { CancelRentalSheet } from './CancelRentalSheet';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDay, formatDayTime, initials, itemAttributes, OUT_STATUSES, rentalBadges, returnedUnits } from './rental-format';

/** Next steps of a rental opened as screens; the calendar is a placeholder until 6.6 */
export type RentalActionKind = 'issue' | 'pay' | 'return' | 'edit' | 'calendar';

function openAction(kind: RentalActionKind, id: string) {
  if (kind === 'edit') router.push({ pathname: '/(tabs)/(rentals)/edit/[id]', params: { id } });
  else if (kind === 'pay') router.push({ pathname: '/(tabs)/(rentals)/pay/[id]', params: { id } });
  else if (kind === 'issue') router.push({ pathname: '/(tabs)/(rentals)/issue/[id]', params: { id } });
  else if (kind === 'return') router.push({ pathname: '/(tabs)/(rentals)/return/[id]', params: { id } });
  else router.push({ pathname: '/(tabs)/(rentals)/soon', params: { kind, id } });
}

interface RentalDetailScreenProps {
  rentalId: string;
}

/**
 * Booking card (design «Аренда · карточка»): totals, stages, customer and dates,
 * items, collateral, payments and the next action. Amounts, statuses and the
 * overdue flag come from the backend.
 */
export function RentalDetailScreen({ rentalId }: RentalDetailScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: rental, isLoading, isError, refetch } = useRental(rentalId);
  const refreshControl = useRefreshControl(refetch);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/(rentals)'));

  const header = (title: string, rentalForBadges?: RentalDetail) => (
    <View className="flex-row items-start gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('rental.card.back')} onPress={back} />
      <View className="flex-1 min-w-0 gap-1">
        <Text className="type-heading text-ink leading-[44px]" numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {rentalForBadges ? (
          <View className="flex-row flex-wrap gap-1.5 -mt-1.5">
            {rentalBadges(rentalForBadges, t).map((badge) => (
              <StatusBadge key={badge.label} label={badge.label} tone={badge.tone} />
            ))}
          </View>
        ) : null}
      </View>
      {rentalForBadges?.status === RentalStatus.BOOKED ? (
        <IconButton icon={Ellipsis} accessibilityLabel={t('rental.card.more')} onPress={() => setMenuOpen(true)} />
      ) : null}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header(t('rental.card.titleShort'))}
        <LoadingState />
      </View>
    );
  }

  if (isError || !rental) {
    return (
      <View className="flex-1 bg-bg">
        {header(t('rental.card.titleShort'))}
        <EmptyState icon={CircleAlert} message={t('rental.card.loadFailed')}>
          <Button variant="primary" onPress={() => void refetch()}>
            {t('rental.list.retry')}
          </Button>
        </EmptyState>
      </View>
    );
  }

  const due = Number(rental.order.dueAmount);
  const isOut = OUT_STATUSES.includes(rental.status);
  const canCancel = canLowerPrice(user);

  const actions: { label: string; kind: RentalActionKind; main: boolean }[] = [];
  if (rental.status === RentalStatus.BOOKED) {
    actions.push({ label: t('rental.card.issue'), kind: 'issue', main: true });
  } else if (isOut) {
    actions.push({ label: t('rental.card.acceptReturn'), kind: 'return', main: true });
  }
  if (rental.status !== RentalStatus.CANCELLED && due > 0) {
    actions.push({
      label: actions.length
        ? t('rental.card.acceptPayment')
        : t('rental.card.acceptPaymentAmount', { amount: formatMoney(due) }),
      kind: 'pay',
      main: actions.length === 0,
    });
  }

  return (
    <View className="flex-1 bg-bg">
      {header(t('rental.card.title', { code: rental.code }), rental)}

      <ScrollView
        className="flex-1"
        // NativeWind drops contentContainerClassName when contentContainerStyle is set too
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
        refreshControl={refreshControl}
      >
        <TotalsCard rental={rental} />
        <StagesCard rental={rental} />
        <CustomerCard rental={rental} />
        <ItemsCard rental={rental} />
        <CollateralCard rental={rental} />
        <PaymentsCard rental={rental} />
      </ScrollView>

      {actions.length > 0 ? (
        <View className="px-4 pt-3 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
          {actions.map((action) => (
            <Button
              key={action.kind}
              variant={action.main ? 'accent' : 'secondary'}
              size="lg"
              full
              onPress={() => openAction(action.kind, rental.id)}
            >
              {action.label}
            </Button>
          ))}
        </View>
      ) : null}

      <Sheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} size="auto">
        <View className="px-3 pt-1 pb-3 gap-1" accessibilityRole="menu">
            <MenuItem
              icon={Pencil}
              label={t('rental.card.edit')}
              onPress={() => {
                setMenuOpen(false);
                openAction('edit', rental.id);
              }}
            />
            {canCancel ? (
              <MenuItem
                icon={XCircle}
                label={t('rental.card.cancel')}
                danger
                onPress={() => {
                  setMenuOpen(false);
                  setCancelOpen(true);
                }}
              />
            ) : null}
        </View>
      </Sheet>

      {canCancel && rental.status === RentalStatus.BOOKED ? (
        <CancelRentalSheet rental={rental} isOpen={cancelOpen} onClose={() => setCancelOpen(false)} />
      ) : null}
    </View>
  );
}

function MenuItem({
  icon: Icon,
  label,
  danger = false,
  onPress,
}: {
  icon: typeof Pencil;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className="h-14 px-3 rounded-md flex-row items-center gap-3 active:bg-sunken"
      accessibilityRole="menuitem"
    >
      <Icon size={18} color={danger ? colors.errFg : colors.ink} strokeWidth={2} />
      <Text className={cn('font-onest-semibold text-[15px]', danger ? 'text-err-fg' : 'text-ink')}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, note, children }: { title?: string; note?: string; children: React.ReactNode }) {
  return (
    <View className="bg-card rounded-xl p-3.5 gap-2.5">
      {title ? (
        <View className="flex-row items-baseline justify-between px-0.5">
          <Text className="font-onest-bold text-[15px] text-ink">{title}</Text>
          {note ? <Text className="font-onest text-xs text-muted">{note}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

// ------------------------------------------------------------------ totals

function TotalsCard({ rental }: { rental: RentalDetail }) {
  const { t } = useTranslation();
  const due = Number(rental.order.dueAmount);
  const penalty = rental.returns.reduce((sum, event) => sum + Number(event.penaltyAmount), 0);
  // Display only: the discounts saved on the lines (set discount included)
  const discount =
    rental.order.items.reduce((sum, item) => sum + Number(item.sale) * item.quantity, 0) +
    rental.order.services.reduce((sum, service) => sum + Number(service.sale), 0);
  const note = [
    discount > 0 ? t('rental.card.discount', { amount: formatMoney(discount) }) : null,
    penalty > 0 ? t('rental.card.withPenalty', { amount: formatMoney(penalty) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const leftTile: HeroCardTile =
    rental.status === RentalStatus.RETURNED && due > 0
      ? { label: t('rental.card.debt'), value: rental.order.dueAmount, tone: 'err' }
      : { label: t('rental.card.left'), value: Math.max(due, 0), tone: due > 0 ? 'warn' : 'default' };

  return (
    <HeroCard
      label={t('rental.card.total')}
      chip={note || undefined}
      amount={rental.order.totalAmount}
      currency={t('common.currency')}
      tiles={[{ label: t('rental.card.paid'), value: rental.order.paidAmount, tone: 'accent' }, leftTile]}
    />
  );
}

// ------------------------------------------------------------------ stages

function StagesCard({ rental }: { rental: RentalDetail }) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const lang = i18n.language;
  const { returned, total } = returnedUnits(rental);
  const cancelled = rental.status === RentalStatus.CANCELLED;

  // Stages done so far: booked → 1 (next: issue), out → 2 (next: return), returned → 3
  const reached = rental.status === RentalStatus.RETURNED ? 3 : OUT_STATUSES.includes(rental.status) ? 2 : 1;

  const steps = [
    { title: t('rental.stage.booked'), sub: formatDay(rental.createdAt, lang) },
    cancelled
      ? { title: t('rental.stage.cancelled'), sub: rental.cancelledAt ? formatDay(rental.cancelledAt, lang) : '' }
      : { title: t('rental.stage.issue'), sub: formatDay(rental.issuedAt ?? rental.startDate, lang) },
    {
      title: t('rental.stage.return'),
      sub:
        rental.status === RentalStatus.PARTIALLY_RETURNED
          ? t('rental.stage.returnedOf', { returned, total })
          : rental.overdue
            ? t('rental.stage.wasDue', { date: formatDay(rental.endDate, lang) })
            : formatDay(rental.closedAt ?? rental.endDate, lang),
    },
  ];

  return (
    <View className="bg-card rounded-xl px-3.5 pt-4 pb-3.5 flex-row">
      {steps.map((step, i) => {
        const done = i < reached && !(cancelled && i === 1);
        const current = i === reached && !cancelled;
        const late = rental.overdue && i === 2;
        const failed = cancelled && i === 1;
        const muted = cancelled && i === 2;
        const lineDone = i < reached - 1 && !cancelled;

        return (
          <View key={step.title} className="flex-1 items-center gap-1.5">
            {i < steps.length - 1 ? (
              <View
                className={cn('absolute top-[15px] h-0.5 left-[60%] right-[-40%]', lineDone ? 'bg-primary' : 'bg-track')}
              />
            ) : null}
            <View
              className={cn(
                'w-8 h-8 rounded-full items-center justify-center',
                done
                  ? 'bg-primary'
                  : failed || late
                    ? 'bg-err-bg'
                    : current
                      ? 'bg-accent'
                      : 'bg-card border-[1.5px] border-track',
              )}
            >
              {done ? (
                <Check size={16} color={colors.onPrimary} strokeWidth={2.6} />
              ) : failed ? (
                <XCircle size={16} color={colors.errFg} strokeWidth={2.2} />
              ) : (
                <View
                  className={cn(
                    'w-2 h-2 rounded-full',
                    late ? 'bg-err-fg' : current ? 'bg-on-accent' : 'bg-muted',
                  )}
                />
              )}
            </View>
            <Text
              className={cn(
                'font-onest-bold text-[13px] text-center',
                done || current || late || failed ? 'text-ink' : 'text-muted',
                muted && 'text-muted',
              )}
            >
              {step.title}
            </Text>
            {step.sub ? (
              <Text className={cn('font-onest text-xs text-center', late || failed ? 'text-err-fg' : 'text-muted')}>
                {step.sub}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// -------------------------------------------------------- customer & dates

function CustomerCard({ rental }: { rental: RentalDetail }) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const customer = rental.order.customer?.user;
  const name = customer?.fullName ?? t('rental.noCustomer');

  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-full bg-sunken items-center justify-center">
          <Text className="font-onest-bold text-base text-ink">{initials(name)}</Text>
        </View>
        <View className="flex-1 min-w-0 gap-0.5">
          <Text className="font-onest-bold text-base text-ink" numberOfLines={1}>{name}</Text>
          {customer?.phone ? <Text className="font-onest text-[13px] text-muted">{customer.phone}</Text> : null}
        </View>
        {customer?.phone ? (
          <IconButton
            icon={Phone}
            variant="primary"
            accessibilityLabel={t('rental.card.call')}
            onPress={() => void Linking.openURL(`tel:${customer.phone.replace(/[^\d+]/g, '')}`)}
          />
        ) : null}
      </View>
      <View className="h-px bg-line" />
      <View className="flex-row items-center gap-2.5">
        <View className="w-9 h-9 rounded-sm bg-sunken items-center justify-center">
          <CalendarDays size={18} color={colors.ink} strokeWidth={2} />
        </View>
        <View className="flex-1 gap-px">
          <Text className="font-onest-bold text-[15px] text-ink">
            {formatDay(rental.startDate, i18n.language)} → {formatDay(rental.endDate, i18n.language)} ·{' '}
            {t('rental.days', { count: rental.plannedDays })}
          </Text>
          <Text className="font-onest text-xs text-muted">{t('rental.returnBy')}</Text>
        </View>
      </View>
      {rental.overdue ? (
        <View className="flex-row items-center gap-2.5 px-3 py-2.5 rounded-[14px] bg-err-bg" accessibilityRole="alert">
          <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
          <Text className="flex-1 font-onest-semibold text-sm text-err-fg">
            {t('rental.card.overdueSince', { date: formatDay(rental.endDate, i18n.language) })}
          </Text>
        </View>
      ) : null}
      {rental.notes ? <Text className="font-onest text-[13px] leading-[18px] text-soft">{rental.notes}</Text> : null}
    </Section>
  );
}

// ------------------------------------------------------------------- items

function itemBadge(rental: RentalDetail, item: RentalOrderItem, t: TFunction, lang: string) {
  if (rental.status === RentalStatus.CANCELLED) return null;
  if (rental.status === RentalStatus.BOOKED) return { label: t('rental.item.inSalon'), tone: 'neutral' as StatusTone };
  if (item.returnedQuantity === 0) return { label: t('rental.item.withCustomer'), tone: 'warn' as StatusTone };
  if (item.returnedQuantity < item.quantity) {
    return {
      label: t('rental.item.returnedOf', { returned: item.returnedQuantity, total: item.quantity }),
      tone: 'warn' as StatusTone,
    };
  }
  // Fully returned: the latest return of this line says when and until when it is cleaned
  let last: { returnedAt: string; availableFrom: string } | null = null;
  for (const event of rental.returns) {
    for (const line of event.items) {
      if (line.orderItemId === item.id && (!last || event.returnedAt > last.returnedAt)) {
        last = { returnedAt: event.returnedAt, availableFrom: line.availableFrom };
      }
    }
  }
  if (last && new Date(last.availableFrom) > new Date()) {
    return { label: t('rental.item.cleaningUntil', { date: formatDay(last.availableFrom, lang) }), tone: 'info' as StatusTone };
  }
  return {
    label: last ? t('rental.item.returnedOn', { date: formatDay(last.returnedAt, lang) }) : t('rental.item.returned'),
    tone: 'ok' as StatusTone,
  };
}

function ItemsCard({ rental }: { rental: RentalDetail }) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const lang = i18n.language;
  const { returned, total } = returnedUnits(rental);

  const note =
    rental.status === RentalStatus.BOOKED
      ? t('rental.items.issueOn', { date: formatDay(rental.startDate, lang) })
      : rental.status === RentalStatus.ISSUED
        ? t('rental.items.withCustomer')
        : rental.status === RentalStatus.PARTIALLY_RETURNED
          ? t('rental.items.returnedOf', { returned, total })
          : rental.status === RentalStatus.RETURNED
            ? t('rental.items.allReturned')
            : undefined;

  return (
    <Section title={t('rental.items.title', { count: total })} note={note}>
      {rental.order.items.map((item) => {
        const meta = [itemAttributes(item), `${formatMoney(item.retailPrice)} × ${item.quantity}`].join(' · ');
        const badge = itemBadge(rental, item, t, lang);

        return (
          <View key={item.id} className="flex-row items-center gap-3 p-2.5 rounded-md bg-sunken">
            <PhotoPlaceholder size="sm" className="w-12 h-14 rounded-sm" />
            <View className="flex-1 min-w-0 gap-1">
              <Text className="font-onest-bold text-[15px] text-ink" numberOfLines={2}>{item.variant.product.name}</Text>
              <Text className="font-onest text-xs text-muted" numberOfLines={1}>{meta}</Text>
              {badge ? <StatusBadge label={badge.label} tone={badge.tone} size="sm" className="self-start" /> : null}
            </View>
            <LineAmount price={item.retailPrice} sale={item.sale} quantity={item.quantity} />
          </View>
        );
      })}
      {rental.order.services.map((service) => (
        <View key={service.id} className="flex-row items-center gap-3 p-2.5 rounded-md bg-sunken">
          <View className="w-12 h-12 rounded-sm bg-card items-center justify-center">
            <Sparkles size={20} color={colors.soft} strokeWidth={2} />
          </View>
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="font-onest-bold text-[15px] text-ink" numberOfLines={2}>{service.name}</Text>
            <Text className="font-onest text-xs text-muted" numberOfLines={2}>
              {[t('rental.items.service'), service.description].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <LineAmount price={service.price} sale={service.sale} quantity={1} />
        </View>
      ))}
    </Section>
  );
}

/**
 * Line amount of the saved booking (display only): after the discount, with the
 * list amount struck through when a discount (e.g. the set discount) applies.
 */
function LineAmount({ price, sale, quantity }: { price: string | number; sale: string | number; quantity: number }) {
  const full = Number(price) * quantity;
  const discount = Number(sale) * quantity;

  return (
    <View className="items-end gap-0.5">
      <Money value={full - discount} currency={null} className="font-onest-bold text-[15px] text-ink" />
      {discount > 0 ? (
        <Money value={full} currency={null} className="font-onest text-xs text-muted line-through" />
      ) : null}
    </View>
  );
}

// -------------------------------------------------------------- collateral

function CollateralCard({ rental }: { rental: RentalDetail }) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const lang = i18n.language;
  const held = rental.collaterals.filter((c) => !c.returnedAt);
  const given = rental.collaterals.filter((c) => c.returnedAt);
  // Same rule as the backend (it decides): returned after full payment, or when cancelled
  const canReturn = rental.status === RentalStatus.CANCELLED || Number(rental.order.dueAmount) <= 0;
  const [target, setTarget] = useState<RentalCollateral | null>(null);

  const rows: {
    key: string;
    title: string;
    sub: string;
    tone: 'warn' | 'ok' | 'neutral';
    collateral?: RentalCollateral;
  }[] = [
    ...held.map((c) => ({
      collateral: c,
      key: c.id,
      title: t('rental.collateral.held', { what: [t(`rental.collateralType.${c.type}`), c.description].join(' ') }),
      sub: t('rental.collateral.receivedAt', { date: formatDayTime(c.receivedAt, lang) }),
      tone: 'warn' as const,
    })),
    ...given.map((c) => ({
      key: c.id,
      title: [t(`rental.collateralType.${c.type}`), c.description].join(' '),
      sub: t('rental.collateral.returnedAt', { date: formatDayTime(c.returnedAt as string, lang) }),
      tone: 'ok' as const,
    })),
  ];

  if (rows.length === 0) {
    rows.push(
      rental.issuedWithoutCollateral
        ? { key: 'none', title: t('rental.collateral.issuedWithout'), sub: t('rental.collateral.issuedWithoutHint'), tone: 'warn' }
        : rental.status === RentalStatus.BOOKED
          ? { key: 'none', title: t('rental.collateral.notTaken'), sub: t('rental.collateral.takeOnIssue'), tone: 'neutral' }
          : { key: 'none', title: t('rental.collateral.none'), sub: '', tone: 'neutral' },
    );
  }

  const plate = { warn: 'bg-warn-bg', ok: 'bg-ok-bg', neutral: 'bg-sunken' };
  const iconColor = { warn: colors.warnFg, ok: colors.okFg, neutral: colors.muted };

  return (
    <Section title={t('rental.collateral.title')}>
      {rows.map((row) => (
        <View key={row.key} className="flex-row items-center gap-3">
          <View className={cn('w-11 h-11 rounded-[14px] items-center justify-center', plate[row.tone])}>
            <ShieldCheck size={20} color={iconColor[row.tone]} strokeWidth={2} />
          </View>
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="font-onest-bold text-[15px] text-ink">{row.title}</Text>
            {row.sub ? <Text className="font-onest text-xs text-muted">{row.sub}</Text> : null}
          </View>
          {/* Several held: each is returned on its own */}
          {held.length > 1 && canReturn && row.collateral ? (
            <Button variant="secondary" size="sm" onPress={() => setTarget(row.collateral ?? null)}>
              {t('rental.collateral.returnShort')}
            </Button>
          ) : null}
        </View>
      ))}
      {held.length === 1 || (held.length > 1 && !canReturn) ? (
        <>
          <Button
            variant={canReturn ? 'primary' : 'secondary'}
            icon={canReturn ? undefined : Lock}
            disabled={!canReturn}
            full
            onPress={() => setTarget(held[0])}
          >
            {t('rental.collateral.return')}
          </Button>
          {!canReturn ? (
            <Text className="font-onest text-xs text-muted text-center">{t('rental.collateral.afterPayment')}</Text>
          ) : null}
        </>
      ) : null}
      <ReturnCollateralSheet rental={rental} collateral={target} onClose={() => setTarget(null)} />
    </Section>
  );
}

/** Confirmation «Вернуть залог клиенту?» (design «Аренда · залог»); warns about items still out */
function ReturnCollateralSheet({
  rental,
  collateral,
  onClose,
}: {
  rental: RentalDetail;
  collateral: RentalCollateral | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const returnCollateral = useReturnCollateral();
  const what = collateral ? [t(`rental.collateralType.${collateral.type}`), collateral.description].join(' ') : '';
  const customerName = rental.order.customer?.user.fullName ?? t('rental.noCustomer');
  const notBack = OUT_STATUSES.includes(rental.status)
    ? rental.order.items.filter((item) => item.returnedQuantity < item.quantity).map((item) => item.variant.product.name)
    : [];

  const confirm = () => {
    if (!collateral) return;
    returnCollateral.mutate(
      { id: rental.id, collateralId: collateral.id },
      {
        onSuccess: () => {
          toast.show(t('rental.collateral.returned'), 'success');
          onClose();
        },
        onError: (err) => toast.show(getApiErrorMessage(err, t('rental.collateral.returnFailed')), 'error'),
      },
    );
  };

  return (
    <Sheet isOpen={!!collateral} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3">
        <View className="gap-1">
          <Text className="type-title text-ink" accessibilityRole="header">
            {t('rental.collateral.confirmTitle', { what })}
          </Text>
          <Text className="font-onest text-[13px] leading-[18px] text-muted">
            {t('rental.collateral.confirmText', { name: customerName, code: rental.code })}
          </Text>
        </View>
        {notBack.length > 0 ? (
          <View className="bg-warn-bg rounded-md px-3.5 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-warn-fg">
              {t('rental.collateral.itemsOut', { items: notBack.join(', ') })}
            </Text>
          </View>
        ) : null}
        <View className="flex-row gap-2.5 pt-1">
          <Button variant="secondary" size="lg" className="flex-1" onPress={onClose}>
            {t('rental.collateral.keep')}
          </Button>
          <Button variant="primary" size="lg" className="flex-1" loading={returnCollateral.isPending} onPress={confirm}>
            {t('rental.collateral.confirm')}
          </Button>
        </View>
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------- payments

function PaymentsCard({ rental }: { rental: RentalDetail }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  type Row = { key: string; at: string; title: string; sub: string; amount: number; kind: 'in' | 'out' | 'penalty' };
  const rows: Row[] = rental.order.payments.map((p) => ({
    key: p.id,
    at: p.createdAt,
    title: t('rental.payments.payment'),
    sub: `${formatDay(p.createdAt, lang)} · ${t(`sale.pay.method.${p.type}`, { defaultValue: p.type })}`,
    amount: Number(p.amount),
    kind: 'in',
  }));
  for (const event of rental.returns) {
    if (Number(event.penaltyAmount) > 0) {
      rows.push({
        key: `${event.id}-penalty`,
        at: event.returnedAt,
        title: t('rental.payments.penalty'),
        sub: [formatDay(event.returnedAt, lang), event.penaltyComment ? `«${event.penaltyComment}»` : null]
          .filter(Boolean)
          .join(' · '),
        amount: Number(event.penaltyAmount),
        kind: 'penalty',
      });
    }
    if (Number(event.earlyReturnRefund) > 0) {
      rows.push({
        key: `${event.id}-early`,
        at: event.returnedAt,
        title: t('rental.payments.earlyRefund'),
        sub: formatDay(event.returnedAt, lang),
        amount: -Number(event.earlyReturnRefund),
        kind: 'out',
      });
    }
  }
  if (rental.cancelledAt && Number(rental.refundAmount ?? 0) > 0) {
    rows.push({
      key: 'cancel-refund',
      at: rental.cancelledAt,
      title: t('rental.payments.cancelRefund'),
      sub: [formatDay(rental.cancelledAt, lang), rental.cancelReason].filter(Boolean).join(' · '),
      amount: -Number(rental.refundAmount),
      kind: 'out',
    });
  }
  rows.sort((a, b) => a.at.localeCompare(b.at));

  const tone = {
    in: { plate: 'bg-ok-bg', sign: 'text-ok-fg', amount: 'text-ok-fg', mark: '+' },
    out: { plate: 'bg-sunken', sign: 'text-soft', amount: 'text-ink', mark: '−' },
    penalty: { plate: 'bg-err-bg', sign: 'text-err-fg', amount: 'text-err-fg', mark: '!' },
  };

  return (
    <Section title={t('rental.payments.title')}>
      {rows.length === 0 ? (
        <Text className="font-onest text-[13px] text-muted px-0.5">{t('rental.payments.none')}</Text>
      ) : (
        rows.map((row, i) => (
          <View
            key={row.key}
            className={cn('flex-row items-center gap-3 py-2 px-0.5', i < rows.length - 1 && 'border-b border-line')}
          >
            <View className={cn('w-9 h-9 rounded-sm items-center justify-center', tone[row.kind].plate)}>
              <Text className={cn('font-onest-bold text-[15px]', tone[row.kind].sign)}>{tone[row.kind].mark}</Text>
            </View>
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="font-onest-semibold text-sm text-ink">{row.title}</Text>
              <Text className="font-onest text-xs text-muted" numberOfLines={1}>{row.sub}</Text>
            </View>
            <Money
              value={row.amount}
              signed={row.kind === 'in'}
              currency={null}
              className={cn('font-onest-bold text-[15px]', tone[row.kind].amount)}
            />
          </View>
        ))
      )}
    </Section>
  );
}
