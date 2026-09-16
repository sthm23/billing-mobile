import { Button, ButtonIcon } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { Funnel, ScanSquare } from 'lucide-react-native';
import { Box } from '../ui/box';

interface ActionButtonsProps {
  onScanPress: () => void;
  onFilterPress: () => void;
}

export function ActionButtons({ onScanPress, onFilterPress }: ActionButtonsProps) {
  const colors = useTheme();
  return (
    <Box className="flex flex-row items-center gap-2 ml-2">
      {/* Scan Button */}
      <Button
        size="icon"
        className="bg-foreground min-w-12 min-h-12"
        onPress={onScanPress}
        disabled
      >
        <ButtonIcon as={ScanSquare} />
      </Button>

      {/* Filter Button */}
      <Button
        size="icon"
        variant="outline"
        className="min-w-12 min-h-12"
        onPress={onFilterPress}
        disabled
      >
        <ButtonIcon as={Funnel} />
      </Button>
    </Box>
  );
}
