import { Button, IconButton, Switch, Text, toast } from '@/components/base';
import type { ButtonIconComponent } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useStoreMode } from '@/hooks/use-store-mode';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { cn } from '@/libs/utils';
import { UserRole } from '@/models/user.model';
import { useAuth } from '@/provider/AuthProvider';
import { useStoreById, useUpdateStoreModes } from '@/services/store';
import { router } from 'expo-router';
import { CalendarDays, Check, ChevronLeft, CircleAlert, ShieldX, ShoppingBag } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

type Mode = 'sale' | 'rent';

const MODE_ICON: Record<Mode, ButtonIconComponent> = {
  sale: ShoppingBag,
  rent: CalendarDays,
};

/**
 * Store modes (OWNER): sales and/or rental. At least one stays on: turning off
 * the only enabled mode switches to the other one (the backend rejects both off
 * anyway). After saving the menu follows the new modes; a newly enabled rental
 * opens in the menu right away.
 */
export function StoreSettingsScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { user, refreshUser } = useAuth();
  const { setNavMode } = useStoreMode();
  const isOwner = user?.role === UserRole.OWNER;
  const storeId = user?.staff?.storeId;
  const { data: store, isLoading, isError } = useStoreById(isOwner ? storeId : undefined);
  const updateModes = useUpdateStoreModes();

  const [modes, setModes] = useState<Record<Mode, boolean>>({ sale: true, rent: false });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setModes({ sale: store.salesEnabled ?? true, rent: store.rentalEnabled ?? false });
    }
  }, [store]);

  const enabledCount = Number(modes.sale) + Number(modes.rent);
  const changed = !!store && (modes.sale !== (store.salesEnabled ?? true) || modes.rent !== (store.rentalEnabled ?? false));

  const toggle = (mode: Mode) => {
    const other: Mode = mode === 'sale' ? 'rent' : 'sale';
    // The only enabled mode: switch to the other instead of turning both off
    if (modes[mode] && enabledCount === 1) {
      setModes({ [mode]: false, [other]: true } as Record<Mode, boolean>);
      return;
    }
    setModes((current) => ({ ...current, [mode]: !current[mode] }));
  };

  const save = () => {
    if (!store) return;
    setSaveError(null);
    const rentalTurnedOn = modes.rent && !(store.rentalEnabled ?? false);
    updateModes.mutate(
      {
        storeId: store.id,
        payload: {
          salesEnabled: modes.sale,
          rentalEnabled: modes.rent,
          attributeIds: store.attributes.map((a) => a.attributeId),
          brandIds: store.brands.map((b) => b.brandId),
        },
      },
      {
        onSuccess: async () => {
          // The owner has just enabled rental: show it in the menu at once
          if (rentalTurnedOn) await setNavMode('rent');
          try {
            // Menu and screens read the modes of the current user's store
            await refreshUser();
          } catch {
            // The modes are saved; the menu updates on the next start
          }
          toast.show(t('storeSettings.saved'), 'success');
          router.back();
        },
        onError: (error) => setSaveError(getApiErrorMessage(error, t('storeSettings.saveFailed'))),
      },
    );
  };

  const effects =
    modes.rent && !modes.sale
      ? [t('storeSettings.effectRentOnly1'), t('storeSettings.effectRentOnly2'), t('storeSettings.effectRentOnly3')]
      : modes.rent
        ? [t('storeSettings.effectBoth1'), t('storeSettings.effectBoth2')]
        : [t('storeSettings.effectSaleOnly1'), t('storeSettings.effectSaleOnly2')];

  const header = (
    <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('storeSettings.title')}</Text>
        {store?.name ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {t('storeSettings.subtitle', { store: store.name })}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!isOwner || !storeId) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('storeSettings.noAccess')} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }

  if (isError || !store) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('storeSettings.loadFailed')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      {header}
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 gap-3">
        <View className="bg-card rounded-2xl px-4 pt-4 pb-2">
          <Text className="type-body-strong text-ink pb-1">{t('storeSettings.modeSection')}</Text>
          {(['sale', 'rent'] as const).map((mode, index) => {
            const on = modes[mode];
            const Icon = MODE_ICON[mode];
            const label = t(mode === 'sale' ? 'storeSettings.sales' : 'storeSettings.rental');

            return (
              <View
                key={mode}
                className={cn('flex-row items-center gap-3 py-3', index > 0 && 'border-t border-line')}
              >
                <View
                  className={cn('w-11 h-11 rounded-[14px] items-center justify-center', on ? 'bg-accent' : 'bg-sunken')}
                >
                  <Icon size={20} color={on ? colors.onAccent : colors.soft} strokeWidth={2} />
                </View>
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="type-body-strong text-ink">{label}</Text>
                  <Text className="font-onest text-xs leading-4 text-muted">
                    {t(mode === 'sale' ? 'storeSettings.salesDesc' : 'storeSettings.rentalDesc')}
                  </Text>
                </View>
                <Switch value={on} onValueChange={() => toggle(mode)} accessibilityLabel={label} />
              </View>
            );
          })}
        </View>

        <Text className="font-onest text-xs leading-4 text-muted px-1 -mt-1">{t('storeSettings.atLeastOne')}</Text>

        <View className="bg-card rounded-2xl p-4 gap-3">
          <Text className="type-body-strong text-ink">{t('storeSettings.effectsSection')}</Text>
          {effects.map((text) => (
            <View key={text} className="flex-row gap-2.5">
              <Check size={16} color={colors.okFg} strokeWidth={2.4} />
              <Text className="flex-1 font-onest text-sm leading-5 text-soft">{text}</Text>
            </View>
          ))}
        </View>

        {saveError ? (
          <View className="bg-err-bg rounded-2xl px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{saveError}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View className="px-4 pt-2 pb-6">
        <Button
          variant="accent"
          size="lg"
          full
          loading={updateModes.isPending}
          disabled={!changed || updateModes.isPending}
          onPress={save}
        >
          {t('storeSettings.save')}
        </Button>
      </View>
    </View>
  );
}
