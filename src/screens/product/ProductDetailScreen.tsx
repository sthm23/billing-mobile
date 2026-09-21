import { AdminSectionHeader } from '@/components/product/AdminSectionHeader';
import { AvailabilityBadge } from '@/components/product/AvailabilityBadge';
import { ChipSelector } from '@/components/product/ChipSelector';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { PriceLabel } from '@/components/product/PriceLabel';
import { ProductVariantCard } from '@/components/product/ProductVariantCard';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  Attribute,
  ProductDetail,
  ProductVariant,
  StockMovementType,
} from '@/services/product/product.type';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

interface ProductDetailScreenProps {
  product: ProductDetail;
}

function buildNameById(attributes: Attribute[]): Record<string, string> {
  const map: Record<string, string> = {};
  attributes.forEach((a) => (map[a.id] = a.name));
  return map;
}

function buildAttributeMap(
  variants: ProductVariant[],
  nameById: Record<string, string>
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  variants.forEach((variant) => {
    (variant.attributes ?? []).forEach((attr) => {
      const name = nameById[attr.attributeId] ?? attr.attributeName ?? attr.attributeId;
      if (!map[name]) map[name] = [];
      const val = String(attr.value);
      if (!map[name].includes(val)) map[name].push(val);
    });
  });
  return map;
}

function getDefaultAttrs(
  variants: ProductVariant[],
  nameById: Record<string, string>
): Record<string, string> {
  const defaults: Record<string, string> = {};
  if (variants.length > 0) {
    (variants[0].attributes ?? []).forEach((attr) => {
      const name = nameById[attr.attributeId] ?? attr.attributeName ?? attr.attributeId;
      defaults[name] = String(attr.value);
    });
  }
  return defaults;
}

export function getLatestCostPrice(variant: ProductVariant): number {
  const lastIn = (variant.stockMovements ?? [])
    .filter((m) => m.type === StockMovementType.IN)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return lastIn ? parseFloat(lastIn.unitCost) : 0;
}

export default function ProductDetailScreen({ product }: ProductDetailScreenProps) {
  const nameById = useMemo(() => buildNameById(product.attributes ?? []), [product.attributes]);

  const attributeMap = useMemo(
    () => buildAttributeMap(product.variants, nameById),
    [product.variants, nameById]
  );

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    () => getDefaultAttrs(product.variants, nameById)
  );
  const [buyQty, setBuyQty] = useState(1);

  const selectedVariant = useMemo(() => {
    return (
      product.variants.find((v) =>
        (v.attributes ?? []).every((a) => {
          const name = nameById[a.attributeId] ?? a.attributeName ?? a.attributeId;
          return selectedAttrs[name] === String(a.value);
        })
      ) ?? null
    );
  }, [product.variants, selectedAttrs, nameById]);

  const displayPrice = useMemo(() => {
    if (selectedVariant) return parseFloat(String(selectedVariant.price));
    if (!product.variants.length) return 0;
    return Math.min(...product.variants.map((v) => parseFloat(String(v.price))));
  }, [selectedVariant, product.variants]);

  const totalStock = product.variants.reduce((sum, v) => sum + v.quantity, 0);
  const stockForSelected = selectedVariant?.quantity ?? 0;

  const handleAttrSelect = (attrName: string, value: string) => {
    setSelectedAttrs((prev) => ({ ...prev, [attrName]: value }));
    setBuyQty(1);
  };

  const handleBuy = () => {
    if (!selectedVariant) return;
    console.log('Buy', { variantId: selectedVariant.id, quantity: buyQty });
  };

  const handleDelete = () => {
    console.log('Delete product', product.id);
  };

  const attributeNames = (product.attributes ?? []).map((a) => a.name);

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Image Carousel */}
      <ImageCarousel images={product.images ?? []} productName={product.name} />

      <VStack className="px-4 pt-4 gap-4">

        {/* Product Header */}
        <VStack className="gap-1">
          <HStack className="justify-between items-start gap-2">
            <Text className="text-2xl font-bold text-foreground flex-1">
              {product.name}
            </Text>
            <AvailabilityBadge isAvailable={totalStock > 0} />
          </HStack>

          {(product.category || product.brand) && (
            <Text className="text-sm text-typography-500">
              {['Категория:', product.category, product.brand ? `(${product.brand})` : '']
                .filter(Boolean)
                .join(' ')}
            </Text>
          )}

          <PriceLabel
            price={displayPrice}
            prefix={selectedVariant ? undefined : 'от'}
            unit="/ шт"
            size="lg"
          />
        </VStack>

        <Divider />

        {/* Parameter Selection */}
        {attributeNames.length > 0 && (
          <VStack className="gap-4">
            <Text className="text-xs font-semibold text-typography-500 uppercase tracking-wider">
              Выбор параметров для продажи
            </Text>

            {attributeNames.map((attrName) => {
              const values = attributeMap[attrName];
              if (!values || values.length === 0) return null;
              return (
                <VStack key={attrName} className="gap-1.5">
                  <Text className="text-sm font-medium text-foreground">{attrName}</Text>
                  {values.length === 1 ? (
                    <Text className="text-sm text-typography-500">{values[0]}</Text>
                  ) : (
                    <ChipSelector
                      values={values}
                      selected={selectedAttrs[attrName] ?? null}
                      onSelect={(val) => handleAttrSelect(attrName, val)}
                    />
                  )}
                </VStack>
              );
            })}

            <VStack className="gap-1.5">
              <HStack className="justify-between items-center">
                <Text className="text-sm font-medium text-foreground">Количество</Text>
                <Text className="text-xs text-typography-400">
                  Остаток на складе: {stockForSelected} шт.
                </Text>
              </HStack>
              <QuantityStepper
                value={buyQty}
                max={Math.max(stockForSelected, 1)}
                onChange={setBuyQty}
              />
            </VStack>

            <Button
              variant="default"
              className="w-full"
              onPress={handleBuy}
              disabled={stockForSelected === 0}
            >
              <ButtonIcon as={Plus} />
              <ButtonText>Купить</ButtonText>
            </Button>
          </VStack>
        )}

        <Divider />

        {/* Admin Panel */}
        <VStack className="gap-3">
          <AdminSectionHeader
            title="Панель сотрудника"
            subtitle="Админ-доступ"
            onDelete={handleDelete}
          />

          {product.variants.map((variant) => (
            <ProductVariantCard
              key={variant.id}
              variant={variant}
              nameById={nameById}
              onHistory={(id) => console.log('History', id)}
              onMovement={(id) => console.log('Movement', id)}
            />
          ))}
        </VStack>
      </VStack>
    </ScrollView>
  );
}
