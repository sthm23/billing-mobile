import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

interface OrderInfoItem {
  label: string;
  value: string;
}

interface OrderInfoCardProps {
  title: string;
  items: OrderInfoItem[];
}

export function OrderInfoCard({ title, items }: OrderInfoCardProps) {
  return (
    <Box className="bg-card m-4 p-4 rounded-xl border border-outline-200 shadow-sm">
      <Text className="text-base font-semibold text-foreground mb-3">
        {title}
      </Text>

      <VStack className="gap-2">
        {items.map((item, index) => (
          <HStack key={index} className="justify-between">
            <Text className="text-sm text-typography-500">{item.label}:</Text>
            <Text className="text-sm font-medium text-foreground text-right flex-1 ml-4">
              {item.value}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
