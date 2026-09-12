import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
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
      <HStack className="items-center gap-3">
        <CustomIcon
          name={IconNames.CART}
          size={28}
          color={colors.text}
        />
        <Heading size="xl" className="font-bold text-foreground">
          {t('product.title')}
        </Heading>
      </HStack>

      {/* Right: Create Button */}
      <Button
        size="default"
        className="bg-foreground"
        onPress={onCreatePress}
        disabled
      >
        <ButtonText className="text-background">+ {t('product.create')}</ButtonText>
      </Button>
    </HStack>
  );
}
