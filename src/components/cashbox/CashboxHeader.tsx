import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Receipt } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface CashboxHeaderProps {
  onOpenCashbox?: () => void;
}

export function CashboxHeader({ onOpenCashbox }: CashboxHeaderProps) {
  const { t } = useTranslation();

  return (
    <HStack className="items-center justify-between mb-3">
      <HStack className="items-center gap-2">
        <Icon as={Receipt} size="xl" className="text-typography-900" />
        <Text size="2xl" bold>
          {t('payment.cashboxList')}
        </Text>
      </HStack>
      <Button
        size="sm"
        onPress={onOpenCashbox}
        disabled
      >
        <ButtonText>+ {t('payment.openCashbox')}</ButtonText>
      </Button>
    </HStack>
  );
}
