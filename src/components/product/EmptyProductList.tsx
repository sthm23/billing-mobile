import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';

interface EmptyProductListProps {
  onCreatePress: () => void;
}

export function EmptyProductList({ onCreatePress }: EmptyProductListProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <Center className="flex-1 py-16">
      <VStack className="items-center gap-4">
        {/* Icon */}
        <CustomIcon
          name={IconNames.BOX}
          size={64}
          color={colors.text}
        />

        {/* Empty Message */}
        <Text className="text-lg text-typography-500 text-center">
          {t('product.empty')}
        </Text>

        {/* Create Button */}
        <Button
          size="default"
          className="mt-4"
          onPress={onCreatePress}
          disabled
        >
          <ButtonText>{t('product.create')}</ButtonText>
        </Button>
      </VStack>
    </Center>
  );
}
