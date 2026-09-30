import { Button, HStack, Text } from '@/components/base';
import { Minus, Plus } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function QuantityStepper({ value, max, onChange }: QuantityStepperProps) {
  const colors = useTheme();

  return (
    <HStack className="items-center" gap={3}>
      <Button
        variant="outline"
        size="sm"
        onPress={() => onChange(value - 1)}
        disabled={value <= 1}
        className="w-10 h-10"
      >
        <Minus size={16} color={colors.text} />
      </Button>

      <Text className="text-base font-semibold text-foreground text-center min-w-16">
        {value} / {max}
      </Text>

      <Button
        variant="outline"
        size="sm"
        onPress={() => onChange(value + 1)}
        disabled={value >= max}
        className="w-10 h-10"
      >
        <Plus size={16} color={colors.text} />
      </Button>
    </HStack>
  );
}
