import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsTrigger,
  TabsTriggerText
} from '@/components/ui/tabs';
import { CashboxStatus } from '@/models/payment.model';
import { Funnel } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export type CashboxStatusFilter = 'all' | CashboxStatus.OPEN | CashboxStatus.CLOSED;

interface CashboxFiltersProps {
  value: CashboxStatusFilter;
  onValueChange: (value: string) => void;
  onFilterPress?: () => void;
}

export function CashboxFilters({ value, onValueChange, onFilterPress }: CashboxFiltersProps) {
  const { t } = useTranslation();

  return (
    <HStack className="items-center justify-between gap-3">
      <Tabs
        value={value}
        onValueChange={onValueChange}
        className="flex-1"
      >
        <TabsList className="flex-row">
          <TabsTrigger value="all" className="flex-1">
            <TabsTriggerText>{t('payment.filter.all')}</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value={CashboxStatus.OPEN} className="flex-1">
            <TabsTriggerText>{t('payment.filter.open')}</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value={CashboxStatus.CLOSED} className="flex-1">
            <TabsTriggerText>{t('payment.filter.closed')}</TabsTriggerText>
          </TabsTrigger>
          <TabsIndicator />
        </TabsList>
      </Tabs>
      <Pressable
        className="p-2 rounded-lg border border-border bg-surface"
        onPress={onFilterPress}
        disabled
      >
        <Icon as={Funnel} size="lg" className="text-typography-400" />
      </Pressable>
    </HStack>
  );
}
