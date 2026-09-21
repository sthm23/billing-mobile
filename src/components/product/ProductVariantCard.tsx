import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ProductVariant, StockMovementType } from '@/services/product/product.type';
import { Clock, Plus } from 'lucide-react-native';
import { PricePair } from './PricePair';
import { QuantityBadge } from './QuantityBadge';

interface ProductVariantCardProps {
  variant: ProductVariant;
  nameById?: Record<string, string>;
  onHistory?: (variantId: string) => void;
  onMovement?: (variantId: string) => void;
}

function getVariantLabel(variant: ProductVariant, nameById: Record<string, string>): string {
  const attrs = variant.attributes ?? [];
  if (attrs.length === 0) return variant.sku;
  return attrs.map((a) => String(a.value)).join(' - ');
}

function getLatestCostPrice(variant: ProductVariant): number {
  const lastIn = (variant.stockMovements ?? [])
    .filter((m) => m.type === StockMovementType.IN)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return lastIn ? parseFloat(lastIn.unitCost) : 0;
}

function getQuantityVariant(qty: number): 'success' | 'destructive' | 'warn' {
  if (qty === 0) return 'destructive';
  if (qty < 5) return 'warn';
  return 'success';
}

export function ProductVariantCard({
  variant,
  nameById = {},
  onHistory,
  onMovement,
}: ProductVariantCardProps) {
  const label = getVariantLabel(variant, nameById);
  const costPrice = getLatestCostPrice(variant);
  const retailPrice = parseFloat(String(variant.price));

  return (
    <Card className="p-4 gap-3">
      <HStack className="justify-between items-start">
        <VStack className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          <Text className="text-xs text-typography-400">{variant.sku}</Text>
        </VStack>
        <QuantityBadge
          quantity={variant.quantity}
          variant={getQuantityVariant(variant.quantity)}
        />
      </HStack>

      <PricePair costPrice={costPrice} retailPrice={retailPrice} />

      <Divider />

      <HStack className="gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onPress={() => onHistory?.(variant.id)}
        >
          <ButtonIcon as={Clock} />
          <ButtonText>История</ButtonText>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onPress={() => onMovement?.(variant.id)}
        >
          <ButtonIcon as={Plus} />
          <ButtonText>Приход / Списание</ButtonText>
        </Button>
      </HStack>
    </Card>
  );
}
