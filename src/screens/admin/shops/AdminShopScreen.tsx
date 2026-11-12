import { Avatar, AvatarFallbackText, Button, IconButton, Pressable, Switch, Text } from '@/components/base';
import { StatusBadge } from '@/components/base/StatusBadge';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { EmptyState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatDate, formatDayMonth } from '@/libs/date';
import { isAdmin } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import { useAdminStore, useUpdateAdminStore, type AdminStoreDetails, type StoreMode } from '@/services/admin-store';
import { formatPhone, roleLabel, warehousesLabel } from '@/screens/profile/staff/staff-format';
import { router } from 'expo-router';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Ellipsis,
  Lock,
  Pause,
  Phone,
  ShieldX,
  Warehouse,
  WifiOff,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shopInitials, shopModes, shopStatusBadge } from './shop-format';
import { NewWarehouseSheet, RenameShopSheet, ResumeShopSheet, ShopMenuSheet, SuspendShopSheet } from './ShopSheets';

type SheetKind = 'none' | 'menu' | 'rename' | 'suspend' | 'resume' | 'warehouse';
const MODES: StoreMode[] = ['sale', 'rent'];

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <View className="bg-card rounded-[24px] px-3.5 py-4 gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 font-onest-semibold text-[15px] text-ink" accessibilityRole="header">{title}</Text>
        {aside}
      </View>
      {children}
    </View>
  );
}

function ReadOnlyPill() {
  const { t } = useTranslation();

  return (
    <View className="px-2 py-0.5 rounded-pill bg-sunken">
      <Text className="font-onest-semibold text-[11px] text-muted">{t('adminShop.readOnly')}</Text>
    </View>
  );
}

function SmallChip({ label }: { label: string }) {
  return (
    <View className="px-2.5 py-1 rounded-pill bg-sunken">
      <Text className="font-onest-semibold text-xs text-ink">{label}</Text>
    </View>
  );
}

/** Term line of the hero: «Оплачено до 12.01», «Пробный период до 12.12», «Приостановлен с 05.12 · …» */
function heroTerm(store: AdminStoreDetails, t: ReturnType<typeof useTranslation>['t']): string {
  if (store.status === 'SUSPENDED' && store.suspendedAt) {
    const reason = store.suspendReason ? ` · ${t(`adminShop.reasonShort.${store.suspendReason}`)}` : '';
    return t('adminShop.term.suspended', { date: formatDayMonth(store.suspendedAt) }) + reason;
  }
  if (store.status === 'TRIAL' && store.trialEndsAt) {
    return store.trialExpired
      ? t('adminShop.term.trialEnded', { date: formatDayMonth(store.trialEndsAt) })
      : t('adminShop.term.trial', { date: formatDayMonth(store.trialEndsAt) });
  }
  if (store.paidUntil) return t('adminShop.term.paid', { date: formatDayMonth(store.paidUntil) });

  return t('adminShop.term.since', { date: formatDate(store.createdAt) });
}

function ShopSkeleton() {
  return (
    <View className="gap-3" accessibilityLabel="…">
      <View className="bg-hero rounded-[28px] h-[184px]" />
      {[1, 2, 3].map((i) => (
        <View key={i} className="bg-card rounded-[24px] p-4 gap-3">
          <View className="w-1/3 h-3.5 rounded-pill bg-sunken" />
          <View className="w-4/5 h-2.5 rounded-pill bg-sunken" />
          <View className="w-1/2 h-2.5 rounded-pill bg-sunken" />
        </View>
      ))}
    </View>
  );
}

/**
 * Store card for the platform admin (design «Магазин — детали»): status and
 * term, suspension, owner (read-only), modes, warehouses (+ new), staff
 * (read-only), catalog, application data. «⋯» → rename / suspend / resume.
 */
export function AdminShopScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const admin = isAdmin(user);
  const query = useAdminStore(admin ? id : undefined);
  const updateModes = useUpdateAdminStore();
  const refreshControl = useRefreshControl(query.refetch);
  const [sheet, setSheet] = useState<SheetKind>('none');
  const [modeError, setModeError] = useState<string | null>(null);
  const store = query.data;

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <Text className="flex-1 min-w-0 type-heading text-ink" numberOfLines={1} accessibilityRole="header">
        {store?.name ?? t('adminShop.title')}
      </Text>
      {store ? (
        <IconButton icon={Ellipsis} accessibilityLabel={t('adminShop.more')} onPress={() => setSheet('menu')} />
      ) : null}
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

  if (!store) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
        {header}
        {query.isError ? (
          <EmptyState icon={WifiOff} message={t('adminShop.errorTitle')} description={t('adminShops.errorText')}>
            <Button onPress={() => void query.refetch()}>{t('adminShops.retry')}</Button>
          </EmptyState>
        ) : (
          <View className="px-4"><ShopSkeleton /></View>
        )}
      </SafeAreaView>
    );
  }

  const suspended = store.status === 'SUSPENDED';
  const trial = store.status === 'TRIAL';
  const badge = shopStatusBadge(store, t);
  const enabledCount = shopModes(store).length;
  const isOnlyOwner = store.staffCount <= 1;

  const toggleMode = (mode: StoreMode, on: boolean) => {
    const key = mode === 'sale' ? 'salesEnabled' : 'rentalEnabled';
    if (!on && enabledCount === 1) {
      const other = mode === 'sale' ? 'rent' : 'sale';
      setModeError(t('adminShop.modes.lastError', { mode: t(`adminShops.mode.${other}`) }));
      return;
    }
    setModeError(null);
    updateModes.mutate(
      { id: store.id, [key]: on },
      { onError: (e) => setModeError(getApiErrorMessage(e, t('adminShop.saveFailed'))) },
    );
  };

  const reasonText = store.suspendReason ? t(`adminShop.reason.${store.suspendReason}`) : null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {header}
      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        {/* Hero: name, status, modes, term, tiles */}
        <View className="bg-hero rounded-[28px] p-[18px] gap-3.5">
          <View className="flex-row items-center gap-3.5">
            <View
              className={cn('w-[60px] h-[60px] rounded-[18px] items-center justify-center', suspended ? 'bg-hero-sub' : 'bg-accent')}
            >
              <Text className={cn('font-onest-bold text-xl', suspended ? 'text-hero-muted' : 'text-on-accent')}>
                {shopInitials(store.name)}
              </Text>
            </View>
            <View className="flex-1 min-w-0 gap-1.5">
              <Text className="type-subhead text-hero-ink" numberOfLines={2}>{store.name}</Text>
              <View className="flex-row flex-wrap gap-1.5">
                <StatusBadge label={badge.label} tone={badge.tone} />
                {shopModes(store).map((m) => (
                  <View key={m} className="px-2.5 py-0.5 rounded-pill bg-hero-sub">
                    <Text className="font-onest-semibold text-[11px] text-hero-ink">{t(`adminShops.mode.${m}`)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <CalendarClock size={16} color={suspended ? colors.heroErr : trial ? colors.heroInfo : colors.heroMuted} strokeWidth={2} />
            <Text
              className={cn('flex-1 font-onest-medium text-[13px]', suspended ? 'text-hero-err' : trial ? 'text-hero-info' : 'text-hero-ink')}
            >
              {heroTerm(store, t)}
            </Text>
          </View>
          <View className="flex-row gap-2">
            {[
              { n: store.warehousesCount, label: t('adminShop.tiles.warehouses', { count: store.warehousesCount }) },
              { n: store.staffCount, label: t('adminShop.tiles.staff') },
              { n: store.activeStaffCount, label: t('adminShop.tiles.active') },
            ].map((tile) => (
              <View key={tile.label} className="flex-1 rounded-[14px] bg-hero-sub px-3 py-2.5 gap-0.5">
                <Text className="font-onest-bold text-xl text-hero-ink tabular-nums">{tile.n}</Text>
                <Text className="font-onest text-xs text-hero-muted" numberOfLines={1}>{tile.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Suspended banner */}
        {suspended ? (
          <View className="bg-err-bg rounded-[24px] p-4 gap-3">
            <View className="flex-row gap-3">
              <View className="w-9 h-9 rounded-full bg-card items-center justify-center">
                <Pause size={18} color={colors.errFg} strokeWidth={2.2} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-onest-bold text-[15px] text-err-fg">
                  {t('adminShop.suspendedTitle', { date: store.suspendedAt ? formatDayMonth(store.suspendedAt) : '' })}
                </Text>
                <Text className="font-onest text-[13px] leading-[18px] text-err-fg">
                  {[
                    reasonText ? t('adminShop.suspendedReason', { reason: reasonText }) : null,
                    store.suspendedBy ? t('adminShop.suspendedBy', { name: store.suspendedBy.fullName }) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  {store.suspendComment ? `. «${store.suspendComment}»` : ''}
                  {`. ${t('adminShop.suspendedEffect')}`}
                </Text>
              </View>
            </View>
            <Button variant="primary" full onPress={() => setSheet('resume')}>{t('adminShop.menu.resume')}</Button>
          </View>
        ) : null}

        {/* Owner */}
        <Section title={t('adminShop.owner')} aside={<ReadOnlyPill />}>
          {store.owner ? (
            <>
              <View className="flex-row items-center gap-3">
                <Avatar tone="accent">
                  <AvatarFallbackText>{store.owner.fullName}</AvatarFallbackText>
                </Avatar>
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="font-onest-semibold text-[15px] text-ink" numberOfLines={1}>{store.owner.fullName}</Text>
                  <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                    {[formatPhone(store.owner.phone), store.owner.login].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <IconButton
                  icon={Phone}
                  variant="sunken"
                  accessibilityLabel={t('adminShop.callOwner')}
                  onPress={() => void Linking.openURL(`tel:${store.owner?.phone.replace(/[^\d+]/g, '') ?? ''}`)}
                />
              </View>
              <View className="flex-row items-center justify-between pt-1">
                <Text className="font-onest text-[13px] text-soft">{t('adminShop.ownerStatus')}</Text>
                <StatusBadge
                  label={store.owner.isActive ? t('adminShops.status.ACTIVE') : t('adminShop.inactive')}
                  tone={store.owner.isActive ? 'ok' : 'neutral'}
                />
              </View>
            </>
          ) : (
            <Text className="font-onest text-sm text-muted">{t('adminShop.noOwner')}</Text>
          )}
        </Section>

        {/* Modes */}
        <Section title={t('adminShop.modes.title')}>
          {MODES.map((mode, i) => {
            const on = mode === 'sale' ? store.salesEnabled : store.rentalEnabled;
            const locked = on && enabledCount === 1;
            return (
              <View key={mode} className={cn('flex-row items-center gap-3', i > 0 && 'pt-3 border-t border-line')}>
                <View className="flex-1 gap-0.5">
                  <Text className="font-onest-semibold text-[15px] text-ink">{t(`adminShop.modes.${mode}`)}</Text>
                  <Text className="font-onest text-xs text-muted">{t(`adminShop.modes.${mode}Desc`)}</Text>
                </View>
                {locked ? <Lock size={16} color={colors.muted} strokeWidth={2} /> : null}
                <Switch
                  value={on}
                  onValueChange={(v) => toggleMode(mode, v)}
                  disabled={updateModes.isPending}
                  accessibilityLabel={t(`adminShop.modes.${mode}`)}
                />
              </View>
            );
          })}
          {modeError ? (
            <View className="flex-row items-start gap-2 bg-err-bg rounded-lg px-3 py-2.5" accessibilityRole="alert">
              <CircleAlert size={16} color={colors.errFg} strokeWidth={2} />
              <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-err-fg">{modeError}</Text>
            </View>
          ) : null}
        </Section>

        {/* Warehouses */}
        <Section
          title={t('adminShop.warehouses', { count: store.warehouses.length })}
          aside={
            <Pressable onPress={() => setSheet('warehouse')} accessibilityRole="button" className="py-1">
              <Text className="font-onest-semibold text-[13px] text-ink">{t('adminShop.addWarehouse')}</Text>
            </Pressable>
          }
        >
          {store.warehouses.map((w, i) => (
            <View key={w.id} className={cn('flex-row items-center gap-3', i > 0 && 'pt-3 border-t border-line')}>
              <View className="w-9 h-9 rounded-xl bg-sunken items-center justify-center">
                <Warehouse size={18} color={colors.ink} strokeWidth={2} />
              </View>
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="font-onest-semibold text-sm text-ink" numberOfLines={1}>{w.name}</Text>
                <Text className="font-onest text-xs text-muted">{t('adminShop.warehouseStaff', { count: w.staffCount })}</Text>
              </View>
              {/* Warehouse status management is a later task: always shown active */}
              <StatusBadge label={t('adminShops.status.ACTIVE')} tone="ok" />
            </View>
          ))}
        </Section>

        {/* Staff */}
        <Section title={t('adminShop.staff', { count: store.staffCount })} aside={<ReadOnlyPill />}>
          {store.staff.map((p, i) => (
            <View
              key={p.id}
              className={cn('flex-row items-center gap-3', i > 0 && 'pt-3 border-t border-line', !p.isActive && 'opacity-60')}
            >
              <Avatar tone={p.isOwner ? 'accent' : 'sunken'}>
                <AvatarFallbackText>{p.fullName}</AvatarFallbackText>
              </Avatar>
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="font-onest-semibold text-sm text-ink" numberOfLines={1}>{p.fullName}</Text>
                <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                  {`${roleLabel(p.role, t)} · ${warehousesLabel(p, t)}`}
                </Text>
              </View>
              <StatusBadge
                label={p.isActive ? t('adminShops.status.ACTIVE') : t('adminShop.inactive')}
                tone={p.isActive ? 'ok' : 'neutral'}
              />
            </View>
          ))}
          {isOnlyOwner ? (
            <Text className="font-onest text-[13px] leading-[18px] text-muted">{t('adminShop.onlyOwner')}</Text>
          ) : (
            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)/(profile)/shops/[id]/staff', params: { id: store.id } })}
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-1 h-11 rounded-pill bg-sunken active:opacity-80"
            >
              <Text className="font-onest-semibold text-sm text-ink">{t('adminShop.allStaff', { count: store.staffCount })}</Text>
              <ChevronRight size={16} color={colors.ink} strokeWidth={2} />
            </Pressable>
          )}
        </Section>

        {/* Catalog */}
        <Section title={t('adminShop.catalog.title')}>
          {[
            { key: 'category', label: t('adminShop.catalog.category'), items: store.categories.map((c) => c.name) },
            { key: 'brands', label: t('adminShop.catalog.brands'), items: store.brands.map((b) => b.name) },
            {
              key: 'attributes',
              label: t('adminShop.catalog.attributes'),
              items: store.attributes.map((a) => (a.unit ? `${a.name} (${a.unit})` : a.name)),
            },
          ].map((group) => (
            <View key={group.key} className="gap-2">
              <Text className="font-onest text-[13px] text-soft">{group.label}</Text>
              {group.items.length ? (
                <View className="flex-row flex-wrap gap-1.5">
                  {group.items.map((item) => <SmallChip key={item} label={item} />)}
                </View>
              ) : (
                <Text className="font-onest text-[13px] text-muted">—</Text>
              )}
            </View>
          ))}
        </Section>

        {/* Application data — only the filled fields */}
        {store.address || store.inn || store.note ? (
          <Section title={t('adminShop.application.title')}>
            {[
              { key: 'address', label: t('adminShop.application.address'), value: store.address },
              { key: 'inn', label: t('adminShop.application.inn'), value: store.inn?.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') },
              { key: 'note', label: t('adminShop.application.note'), value: store.note },
            ]
              .filter((row) => row.value)
              .map((row, i) => (
                <View key={row.key} className={cn('flex-row gap-3', i > 0 && 'pt-3 border-t border-line')}>
                  <Text className="w-[110px] font-onest text-[13px] text-soft">{row.label}</Text>
                  <Text className="flex-1 font-onest-medium text-[13px] text-ink">{row.value}</Text>
                </View>
              ))}
          </Section>
        ) : null}

        {/* Metrics — after billing is connected */}
        <Section
          title={t('adminShop.metrics.title')}
          aside={
            <View className="px-2 py-0.5 rounded-pill bg-sunken">
              <Text className="font-onest-bold text-[10px] text-muted">{t('adminShops.soon')}</Text>
            </View>
          }
        >
          <View className="flex-row gap-2">
            {[t('adminShop.metrics.revenue'), t('adminShop.metrics.orders'), t('adminShop.metrics.subscription')].map((label) => (
              <View key={label} className="flex-1 rounded-[14px] bg-sunken px-3 py-2.5 gap-0.5">
                <Text className="font-onest-bold text-lg text-muted">—</Text>
                <Text className="font-onest text-[11px] text-muted" numberOfLines={2}>{label}</Text>
              </View>
            ))}
          </View>
          <Text className="font-onest text-xs text-muted">{t('adminShop.metrics.hint')}</Text>
        </Section>
      </ScrollView>

      <ShopMenuSheet
        store={store}
        isOpen={sheet === 'menu'}
        onClose={() => setSheet('none')}
        onRename={() => setSheet('rename')}
        onToggleSuspend={() => setSheet(suspended ? 'resume' : 'suspend')}
      />
      <RenameShopSheet store={store} isOpen={sheet === 'rename'} onClose={() => setSheet('none')} />
      <SuspendShopSheet store={store} isOpen={sheet === 'suspend'} onClose={() => setSheet('none')} />
      <ResumeShopSheet store={store} isOpen={sheet === 'resume'} onClose={() => setSheet('none')} />
      <NewWarehouseSheet store={store} isOpen={sheet === 'warehouse'} onClose={() => setSheet('none')} />
    </SafeAreaView>
  );
}
