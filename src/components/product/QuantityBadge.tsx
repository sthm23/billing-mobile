import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

interface QuantityBadgeProps {
  quantity: number;
}

export function QuantityBadge({ quantity }: QuantityBadgeProps) {
  return (
    <Box className="px-2 py-1 border-2 border-success rounded-md min-w-[40px] items-center justify-center">
      <Text className="text-success text-sm font-semibold">{quantity}</Text>
    </Box>
  );
}
