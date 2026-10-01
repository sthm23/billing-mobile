import { Button, HStack, Text } from '@/components/base';
import { Receipt } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';

interface CashboxHeaderProps {
  onOpenCashbox?: () => void;
}

export function CashboxHeader({ onOpenCashbox }: CashboxHeaderProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <HStack className="items-center justify-between mb-3">
      <HStack className="items-center gap-2">
        <Receipt size={28} color={colors.foreground} />
        <Text className="text-2xl font-bold">
          {t('payment.cashboxList')}
        </Text>
      </HStack>
      <Button
        size="sm"
        onPress={onOpenCashbox}
        disabled
      >
        {`+ ${t('payment.openCashbox')}`}
      </Button>
    </HStack>
  );
}
