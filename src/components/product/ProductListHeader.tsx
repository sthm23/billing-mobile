import { Button, Heading, HStack } from '@/components/base';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';

interface ProductListHeaderProps {
  onCreatePress: () => void;
}

export function ProductListHeader({ onCreatePress }: ProductListHeaderProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <HStack className="items-center justify-between px-4 py-3">
      {/* Left: Icon + Title */}
      <HStack gap={3} className="items-center">
        <CustomIcon
          name={IconNames.CART}
          size={28}
          color={colors.text}
        />
        <Heading level={3} className="font-bold text-foreground">
          {t('product.title')}
        </Heading>
      </HStack>

      {/* Right: Create Button */}
      <Button
        size="md"
        className="bg-foreground"
        textClassName="text-background"
        onPress={onCreatePress}
        disabled
      >
        {`+ ${t('product.create')}`}
      </Button>
    </HStack>
  );
}
