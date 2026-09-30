import { Card, HStack, Text, VStack } from '@/components/base';

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
    <Card className="m-4">
      <Text className="text-base font-semibold text-foreground mb-3">
        {title}
      </Text>

      <VStack className="gap-2">
        {items.map((item, index) => (
          <HStack key={index} className="justify-between">
            <Text className="text-sm text-muted-foreground">{item.label}:</Text>
            <Text className="text-sm font-medium text-foreground text-right flex-1 ml-4">
              {item.value}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Card>
  );
}
