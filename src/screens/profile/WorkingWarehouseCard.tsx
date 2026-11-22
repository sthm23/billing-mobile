import { Button, IconButton, Pressable, Text, toast } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { cn } from '@/libs/utils';
import { StaffRole, UserRole } from '@/models/user.model';
import { useAuth } from '@/provider/AuthProvider';
import { Info, Warehouse as WarehouseIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * «Рабочий склад» (design «Профиль · выбор склада»): the warehouse products,
 * orders, rentals and cashboxes are shown for; «Сменить» opens a sheet with
 * the warehouses the user may pick. Saved on the device.
 */
export function WorkingWarehouseCard() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { user } = useAuth();
  const isOwner = user?.role === UserRole.OWNER || user?.staff?.role === StaffRole.OWNER;
  const working = useWorkingWarehouse();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | undefined>();

  if (!working.isReady) return null;

  const canChange = working.warehouses.length > 1;
  const pickedId = picked ?? working.warehouseId;
  const pickedWarehouse = working.warehouses.find((w) => w.id === pickedId);

  const openSheet = () => {
    setPicked(working.warehouseId);
    setOpen(true);
  };

  const confirm = () => {
    if (pickedWarehouse && pickedWarehouse.id !== working.warehouseId) {
      void working.setWarehouseId(pickedWarehouse.id);
      toast.show(t('workingWarehouse.changed', { name: pickedWarehouse.name }));
    }
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={canChange ? openSheet : undefined}
        disabled={!canChange}
        accessibilityRole="button"
        accessibilityLabel={t('workingWarehouse.title')}
        className="flex-row items-center gap-3 bg-card rounded-xl p-3.5 border-2 border-accent"
      >
        <View className="w-11 h-11 rounded-[14px] bg-accent items-center justify-center">
          <WarehouseIcon size={22} color={colors.onAccent} strokeWidth={2} />
        </View>
        <View className="flex-1 min-w-0 gap-0.5">
          <Text className="font-onest text-xs text-muted">{t('workingWarehouse.title')}</Text>
          <Text className="font-onest-bold text-[15px] text-ink" numberOfLines={1}>
            {working.warehouse?.name ?? t('workingWarehouse.none')}
          </Text>
          <Text className="font-onest text-xs text-muted">{t('workingWarehouse.hint')}</Text>
        </View>
        {canChange ? (
          <View className="h-[34px] px-3 rounded-full bg-sunken items-center justify-center">
            <Text className="font-onest-semibold text-[13px] text-ink">{t('workingWarehouse.change')}</Text>
          </View>
        ) : null}
      </Pressable>

      <Sheet isOpen={open} onClose={() => setOpen(false)} size="auto">
        <View className="px-4 pt-1 pb-3 gap-3.5">
          <View className="flex-row items-start gap-2">
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="type-title text-ink" accessibilityRole="header">{t('workingWarehouse.title')}</Text>
              <Text className="font-onest text-[13px] text-muted">
                {isOwner
                  ? t('workingWarehouse.sheetOwner', { count: working.warehouses.length })
                  : t('workingWarehouse.sheetStaff', { count: working.warehouses.length })}
              </Text>
            </View>
            <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={() => setOpen(false)} />
          </View>

          <View className="gap-2" accessibilityRole="radiogroup">
            {working.warehouses.map((w) => {
              const on = w.id === pickedId;

              return (
                <Pressable
                  key={w.id}
                  onPress={() => setPicked(w.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  className={cn('flex-row items-center gap-3 rounded-[20px] p-3.5', on ? 'bg-primary' : 'bg-sunken')}
                >
                  <View
                    className={cn(
                      'w-11 h-11 rounded-[14px] items-center justify-center',
                      on ? 'bg-accent' : 'bg-card'
                    )}
                  >
                    <WarehouseIcon size={22} color={on ? colors.onAccent : colors.ink} strokeWidth={2} />
                  </View>
                  <Text
                    className={cn('flex-1 font-onest-bold text-[15px]', on ? 'text-on-primary' : 'text-ink')}
                    numberOfLines={1}
                  >
                    {w.name}
                  </Text>
                  <View
                    className={cn(
                      'w-[22px] h-[22px] rounded-full',
                      on ? 'border-[7px] border-accent' : 'border-[1.5px] border-muted'
                    )}
                  />
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row items-start gap-2.5 rounded-2xl bg-sunken px-3.5 py-3">
            <Info size={16} color={colors.soft} strokeWidth={2} />
            <Text className="flex-1 font-onest text-xs leading-[17px] text-soft">
              {isOwner ? t('workingWarehouse.noteOwner') : t('workingWarehouse.noteStaff')}
            </Text>
          </View>

          <Button variant="accent" size="lg" full disabled={!pickedWarehouse} onPress={confirm}>
            {t('workingWarehouse.pick', { name: pickedWarehouse?.name ?? '' })}
          </Button>
        </View>
      </Sheet>
    </>
  );
}
