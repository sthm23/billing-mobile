import { HStack, Pressable } from '@/components/base';
import { CashboxStatus } from '@/models/payment.model';
import { Funnel } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { Text } from 'react-native';

export type CashboxStatusFilter = 'all' | CashboxStatus.OPEN | CashboxStatus.CLOSED;

interface CashboxFiltersProps {
  value: CashboxStatusFilter;
  onValueChange: (value: string) => void;
  onFilterPress?: () => void;
}

export function CashboxFilters({ value, onValueChange, onFilterPress }: CashboxFiltersProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const tabs = [
    { value: 'all', label: t('payment.filter.all') },
    { value: CashboxStatus.OPEN, label: t('payment.filter.open') },
    { value: CashboxStatus.CLOSED, label: t('payment.filter.closed') },
  ];

  return (
    <HStack className="items-center justify-between gap-3">
      <HStack className="flex-1 rounded-lg border border-border bg-muted overflow-hidden">
        {tabs.map((tab, index) => {
          const isActive = value === tab.value;
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;

          return (
            <Pressable
              key={tab.value}
              onPress={() => onValueChange(tab.value)}
              className="flex-1 py-2 px-3 items-center justify-center"
              style={{
                backgroundColor: isActive ? colors.background : 'transparent',
                borderRightWidth: isLast ? 0 : 1,
                borderRightColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: isActive ? colors.primary : colors.mutedForeground,
                  fontWeight: isActive ? '600' : '400',
                  fontSize: 14,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
      <Pressable
        className="p-2 rounded-lg border border-border bg-muted"
        onPress={onFilterPress}
        disabled
      >
        <Funnel size={20} color={colors.mutedForeground} />
      </Pressable>
    </HStack>
  );
}
