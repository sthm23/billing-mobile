import { Button, Box } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { Funnel, ScanSquare } from 'lucide-react-native';

interface ActionButtonsProps {
  onScanPress: () => void;
  onFilterPress: () => void;
}

export function ActionButtons({ onScanPress, onFilterPress }: ActionButtonsProps) {
  const colors = useTheme();
  return (
    <Box className="flex-row items-center gap-2 ml-2">
      {/* Scan Button */}
      <Button
        size="md"
        className="bg-foreground min-w-12 min-h-12 w-12 h-12"
        onPress={onScanPress}
        disabled
      >
        <ScanSquare size={20} color={colors.background} />
      </Button>

      {/* Filter Button */}
      <Button
        size="md"
        variant="outline"
        className="min-w-12 min-h-12 w-12 h-12"
        onPress={onFilterPress}
        disabled
      >
        <Funnel size={20} color={colors.text} />
      </Button>
    </Box>
  );
}
