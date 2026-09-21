import { Button, ButtonIcon } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Minus, Plus } from 'lucide-react-native';

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function QuantityStepper({ value, max, onChange }: QuantityStepperProps) {
  return (
    <HStack className="items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onPress={() => onChange(value - 1)}
        disabled={value <= 1}
      >
        <ButtonIcon as={Minus} />
      </Button>

      <Text className="text-base font-semibold text-foreground text-center min-w-16">
        {value} / {max}
      </Text>

      <Button
        variant="outline"
        size="icon"
        onPress={() => onChange(value + 1)}
        disabled={value >= max}
      >
        <ButtonIcon as={Plus} />
      </Button>
    </HStack>
  );
}
