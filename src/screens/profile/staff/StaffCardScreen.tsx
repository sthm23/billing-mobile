import { Avatar, AvatarFallbackText, Button, IconButton, Text, toast } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatDate } from '@/libs/date';
import { cn } from '@/libs/utils';
import { UserRole } from '@/models/user.model';
import { useAuth } from '@/provider/AuthProvider';
import { useActivateStaff, useStaff, type StaffDetails } from '@/services/store';
import { router } from 'expo-router';
import {
  AtSign,
  Ban,
  ChevronLeft,
  CircleAlert,
  KeyRound,
  Pencil,
  Phone,
  ShieldX,
  UserX,
  Warehouse as WarehouseIcon,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeactivateStaffSheet } from './DeactivateStaffSheet';
import { compactAmount, formatPhone, roleLabel, tenureLabel, warehousesLabel } from './staff-format';

interface StaffCardScreenProps {
  id: string;
}

interface InfoRow {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  action?: React.ReactNode;
}

/**
 * Employee card (design «Сотрудник — карточка», OWNER only): role and status,
 * sales this month, phone / login / warehouses; actions for an active
 * employee (edit, deactivate), «Восстановить доступ» for a deactivated one.
 * The owner's own card is read-only.
 */
export function StaffCardScreen({ id }: StaffCardScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isOwner = user?.role === UserRole.OWNER;
  const query = useStaff(isOwner ? id : undefined);
  const activate = useActivateStaff();
  const refreshControl = useRefreshControl(query.refetch);
  const [sheetOpen, setSheetOpen] = useState(false);
  const staff = query.data;

  const canManage = !!staff && !staff.isOwner && staff.id !== user?.staff?.id;
  const openEdit = () => router.push({ pathname: '/(tabs)/(profile)/staff/edit/[id]', params: { id } });

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <Text className="flex-1 type-heading text-ink" accessibilityRole="header">{t('staff.card.title')}</Text>
      {canManage && staff.isActive ? (
        <IconButton icon={Pencil} accessibilityLabel={t('staff.card.edit')} onPress={openEdit} />
      ) : null}
    </View>
  );

  if (!isOwner) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('staff.noAccess')} />
      </View>
    );
  }

  if (query.isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }

  if (!staff) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('staff.card.loadFailed')} />
      </View>
    );
  }

  const restore = () =>
    activate.mutate(staff.id, {
      onSuccess: () => toast.show(t('staff.card.restored')),
      onError: (error) => toast.show(getApiErrorMessage(error, t('staff.card.restoreFailed')), 'error'),
    });

  const rows: InfoRow[] = [
    {
      key: 'phone',
      icon: Phone,
      label: t('staff.card.phone'),
      value: formatPhone(staff.phone),
      action: (
        <IconButton
          icon={Phone}
          variant="primary"
          size="sm"
          accessibilityLabel={t('staff.card.call')}
          onPress={() => void Linking.openURL(`tel:${staff.phone.replace(/[^\d+]/g, '')}`)}
        />
      ),
    },
    ...(staff.login ? [{ key: 'login', icon: AtSign, label: t('staff.card.login'), value: staff.login }] : []),
    { key: 'warehouses', icon: WarehouseIcon, label: t('staff.card.warehouses'), value: warehousesLabel(staff, t) },
  ];

  return (
    <View className="flex-1 bg-bg">
      {header}
      <ScrollView
        className="flex-1"
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        <StaffHero staff={staff} />

        {!staff.isActive ? (
          <View className="bg-card rounded-2xl px-3.5 py-4 gap-3">
            <View className="flex-row items-start gap-3">
              <View className="w-10 h-10 rounded-full bg-sunken items-center justify-center">
                <Ban size={20} color={colors.soft} strokeWidth={2} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-onest-bold text-[15px] text-ink">
                  {staff.deactivatedAt
                    ? t('staff.card.closedAt', { date: formatDate(staff.deactivatedAt) })
                    : t('staff.card.closed')}
                </Text>
                <Text className="font-onest text-[13px] leading-[18px] text-muted">
                  {[
                    staff.deactivatedBy ? t('staff.card.closedBy', { name: staff.deactivatedBy.fullName }) : null,
                    staff.deactivationReason
                      ? t('staff.card.reasonLabel', { reason: t(`staff.reason.${staff.deactivationReason}`) })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  {staff.deactivatedBy || staff.deactivationReason ? '. ' : ''}
                  {t('staff.card.historyKept')}
                </Text>
              </View>
            </View>
            <Button size="md" full loading={activate.isPending} onPress={restore}>
              {t('staff.card.restore')}
            </Button>
          </View>
        ) : null}

        <View className="bg-card rounded-2xl px-3.5 py-1.5">
          {rows.map((row, index) => (
            <View
              key={row.key}
              className={cn('flex-row items-center gap-3 py-3', index > 0 && 'border-t border-line')}
            >
              <View className="w-9 h-9 rounded-xl bg-sunken items-center justify-center">
                <row.icon size={18} color={colors.soft} strokeWidth={2} />
              </View>
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="font-onest text-xs text-muted">{row.label}</Text>
                <Text className="font-onest-semibold text-[15px] text-ink">{row.value}</Text>
              </View>
              {row.action}
            </View>
          ))}
        </View>

        {staff.isOwner ? (
          <Text className="font-onest text-[13px] text-muted text-center">{t('staff.card.ownerNote')}</Text>
        ) : null}

        {canManage && staff.isActive ? (
          <View className="gap-2">
            <Button size="lg" full icon={Pencil} onPress={openEdit}>
              {t('staff.card.edit')}
            </Button>
            {/* Password reset is not built yet */}
            <Button variant="secondary" size="lg" full icon={KeyRound} disabled>
              {t('staff.card.resetPassword')}
            </Button>
            <Button variant="danger" size="lg" full icon={UserX} onPress={() => setSheetOpen(true)}>
              {t('staff.card.deactivate')}
            </Button>
          </View>
        ) : null}
      </ScrollView>

      {canManage ? <DeactivateStaffSheet staff={staff} isOpen={sheetOpen} onClose={() => setSheetOpen(false)} /> : null}
    </View>
  );
}

/** Dark block: initials, name, role + status, three stats tiles. */
function StaffHero({ staff }: { staff: StaffDetails }) {
  const { t } = useTranslation();
  const stats = [
    { key: 'sales', value: compactAmount(staff.stats.salesTotal, t), label: t('staff.card.salesMonth') },
    { key: 'orders', value: String(staff.stats.ordersCount), label: t('staff.card.orders') },
    { key: 'tenure', value: tenureLabel(staff.createdAt, t), label: t('staff.card.tenure') },
  ];

  return (
    <View className="bg-hero rounded-2xl p-5 gap-4">
      <View className="flex-row items-center gap-3.5">
        <Avatar size="lg" tone="accent" className={cn(!staff.isActive && 'opacity-50')}>
          <AvatarFallbackText>{staff.fullName}</AvatarFallbackText>
        </Avatar>
        <View className="flex-1 min-w-0 gap-1.5">
          <Text className="font-onest-bold text-xl leading-6 text-hero-ink">{staff.fullName}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            <View className="px-2.5 py-1 rounded-full bg-hero-sub">
              <Text className="font-onest-semibold text-xs text-hero-ink">{roleLabel(staff.role, t)}</Text>
            </View>
            <View className={cn('px-2.5 py-1 rounded-full', staff.isActive ? 'bg-ok-bg' : 'bg-hero-sub')}>
              <Text className={cn('font-onest-bold text-xs', staff.isActive ? 'text-ok-fg' : 'text-hero-muted')}>
                {staff.isActive ? t('staff.statusActive') : t('staff.statusInactive')}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className="flex-row gap-2">
        {stats.map((stat) => (
          <View key={stat.key} className="flex-1 rounded-2xl bg-hero-sub px-3 py-2.5 gap-0.5">
            <Text className="font-onest-bold text-[17px] text-hero-ink tabular-nums" numberOfLines={1}>
              {stat.value}
            </Text>
            <Text className="font-onest text-[11px] leading-[14px] text-hero-muted">{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
