import { Button, ButtonIcon } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import { useTheme } from '@/hooks/use-theme';

interface ActionButtonsProps {
  onScanPress: () => void;
  onFilterPress: () => void;
}

export function ActionButtons({ onScanPress, onFilterPress }: ActionButtonsProps) {
  const colors = useTheme();

  return (
    <HStack className="gap-2 ml-2">
      {/* Scan Button */}
      <Button
        size="icon"
        className="bg-foreground min-w-12 min-h-12"
        onPress={onScanPress}
        disabled
      >
        <ButtonIcon>
          <CustomIcon
            name={IconNames.BARCODE_SCANNER}
            size={24}
            color={colors.background}
          />
        </ButtonIcon>
      </Button>

      {/* Filter Button */}
      <Button
        size="icon"
        variant="outline"
        className="min-w-12 min-h-12"
        onPress={onFilterPress}
        disabled
      >
        <ButtonIcon>
          <CustomIcon
            name={IconNames.FILTER}
            size={24}
            color={colors.text}
          />
        </ButtonIcon>
      </Button>
    </HStack>
  );
}
