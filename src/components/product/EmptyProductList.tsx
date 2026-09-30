import { Button, Center, Text, VStack } from '@/components/base';
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
      <VStack gap={4} className="items-center">
        {/* Icon */}
        <CustomIcon
          name={IconNames.BOX}
          size={64}
          color={colors.text}
        />

        {/* Empty Message */}
        <Text variant="large" className="text-muted-foreground text-center">
          {t('product.empty')}
        </Text>

        {/* Create Button */}
        <Button
          size="md"
          className="mt-4"
          onPress={onCreatePress}
          disabled
        >
          {t('product.create')}
        </Button>
      </VStack>
    </Center>
  );
}
