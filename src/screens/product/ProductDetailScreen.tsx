import { Button, Chip, IconButton, Money, StatusBadge, Stepper, Text } from '@/components/base';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { ProductVariantCard } from '@/components/product/ProductVariantCard';
import {
  Attribute,
  ProductDetail,
  ProductVariant,
  StockMovementType,
} from '@/models/product.model';
import { router } from 'expo-router';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

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
  const { t } = useTranslation();
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
  const category = product.category
    ? t(`category.${product.category}`, { defaultValue: product.category })
    : '';
  const subtitle = [category, product.brand].filter(Boolean).join(' · ');

  return (
    <ScrollView
      className="flex-1 bg-bg"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4 pt-2 pb-10 gap-3"
    >
      <ImageCarousel
        images={product.images ?? []}
        productName={product.name}
        overlay={
          <>
            <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
            <IconButton icon={Pencil} accessibilityLabel={t('common.edit')} onPress={() => console.log('Edit')} />
          </>
        }
      />

      {/* Name, availability, price */}
      <View className="bg-hero rounded-2xl p-5 gap-3.5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="type-heading text-hero-ink">{product.name}</Text>
            {subtitle ? <Text className="font-onest text-[13px] text-hero-muted">{subtitle}</Text> : null}
          </View>
          <StatusBadge
            label={totalStock > 0 ? t('product.available') : t('product.notAvailable')}
            tone={totalStock > 0 ? 'accent' : 'neutral'}
          />
        </View>
        <Money
          value={displayPrice}
          prefix={selectedVariant ? undefined : t('product.from')}
          currency={`${t('common.currency')} ${t('product.priceUnit')}`}
          className="text-[30px] tracking-[-0.6px] text-hero-ink"
          currencyClassName="text-[15px] text-hero-muted"
          adjustsFontSizeToFit
        />
      </View>

      {/* Parameters and quantity for the sale */}
      {attributeNames.length > 0 && (
        <View className="bg-card rounded-xl p-4.5 gap-4">
          {attributeNames.map((attrName) => {
            const values = attributeMap[attrName];
            if (!values || values.length === 0) return null;
            return (
              <View key={attrName} className="gap-2.5">
                <Text className="type-label text-muted">{attrName}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {values.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      tone="sunken"
                      size="lg"
                      selected={selectedAttrs[attrName] === value}
                      onPress={() => handleAttrSelect(attrName, value)}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          <View className="flex-row items-center justify-between pt-1">
            <View className="gap-0.5">
              <Text className="type-body-strong text-ink">{t('product.quantity')}</Text>
              <Text className="font-onest text-[13px] text-muted">
                {t('product.stockRemaining')} {stockForSelected} {t('product.unit')}
              </Text>
            </View>
            <Stepper value={buyQty} onChange={setBuyQty} max={Math.max(stockForSelected, 1)} />
          </View>

          <Button variant="accent" size="lg" full onPress={handleBuy} disabled={stockForSelected === 0}>
            {t('product.buy')}
          </Button>
        </View>
      )}

      {/* Staff: stock and prices per variant */}
      <View className="flex-row items-center justify-between px-1 pt-2">
        <View className="gap-0.5">
          <Text className="type-subhead text-ink">{t('product.staffPanel')}</Text>
          <Text className="font-onest text-[13px] text-muted">{t('product.adminAccess')}</Text>
        </View>
        <IconButton icon={Trash2} variant="danger" accessibilityLabel={t('product.deleteProduct')} onPress={handleDelete} />
      </View>

      {product.variants.map((variant) => (
        <ProductVariantCard
          key={variant.id}
          variant={variant}
          nameById={nameById}
          onHistory={(id) => console.log('History', id)}
          onMovement={(id) => console.log('Movement', id)}
        />
      ))}
    </ScrollView>
  );
}
