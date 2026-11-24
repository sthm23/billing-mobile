import { IconButton, Pressable, Text } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import type { Warehouse } from '@/models/store.model';
import { Store, Warehouse as WarehouseIcon, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface DashboardWarehouseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  /** null — the whole store */
  value: string | null;
  onPick: (warehouseId: string | null) => void;
}

/**
 * Dashboard scope: the whole store or one warehouse. Independent of the
 * working warehouse in Profile; the backend checks access to it.
 */
export function DashboardWarehouseSheet({ isOpen, onClose, warehouses, value, onPick }: DashboardWarehouseSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const options: { id: string | null; name: string }[] = [
    { id: null, name: t('dashboard.wholeStore') },
    ...warehouses.map((w) => ({ id: w.id, name: w.name })),
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <View className="flex-row items-start gap-2">
          <Text className="flex-1 type-title text-ink" accessibilityRole="header">
            {t('dashboard.warehouseTitle')}
          </Text>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>
        <View className="gap-2" accessibilityRole="radiogroup">
          {options.map((option) => {
            const on = option.id === value;
            const Icon = option.id ? WarehouseIcon : Store;

            return (
              <Pressable
                key={option.id ?? 'store'}
                onPress={() => onPick(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                className={cn('flex-row items-center gap-3 rounded-[20px] p-3.5', on ? 'bg-primary' : 'bg-sunken')}
              >
                <View className={cn('w-11 h-11 rounded-[14px] items-center justify-center', on ? 'bg-accent' : 'bg-card')}>
                  <Icon size={22} color={on ? colors.onAccent : colors.ink} strokeWidth={2} />
                </View>
                <Text
                  className={cn('flex-1 font-onest-bold text-[15px]', on ? 'text-on-primary' : 'text-ink')}
                  numberOfLines={1}
                >
                  {option.name}
                </Text>
                <View
                  className={cn(
                    'w-[22px] h-[22px] rounded-full',
                    on ? 'border-[7px] border-accent' : 'border-[1.5px] border-muted',
                  )}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}
