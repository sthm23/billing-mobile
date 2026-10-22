import { Button, Chip, IconButton, Money, StatusBadge, Stepper, Text, toast } from '@/components/base';
import { AddToOrderSheet } from '@/components/order';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { ProductVariantCard } from '@/components/product/ProductVariantCard';
import { StockMovementSheet, type StockMovementTarget } from '@/components/product/StockMovementSheet';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { getLatestCostPrice, getVariantLabel } from '@/libs/product-utils';
import { canManageProducts } from '@/libs/roles';
import {
  Attribute,
  ProductDetail,
  ProductVariant,
  StockMovementType,
} from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import { cartStore } from '@/screens/order/cart/cart-store';
import { useAddToOrder } from '@/services/order/order.queries';
import type { Order, OrderProductVariant } from '@/services/order/order.type';
import { useArchiveProduct } from '@/services/product/product.queries';
import { router } from 'expo-router';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';

interface ProductDetailScreenProps {
  product: ProductDetail;
  /** Reloads the product (pull to refresh) */
  onRefresh: () => Promise<unknown>;
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

/** Variant of the product card in the shape the order cart takes. */
function toOrderVariant(
  product: ProductDetail,
  variant: ProductVariant,
  nameById: Record<string, string>
): OrderProductVariant {
  return {
    id: variant.id,
    barCode: variant.barCode,
    price: variant.price,
    quantity: variant.quantity,
    sku: variant.sku,
    productId: product.id,
    productName: product.name,
    attributes: (variant.attributes ?? []).map((a) => ({
      name: nameById[a.attributeId] ?? a.attributeName ?? '',
      value: String(a.value),
    })),
    stockMovements: (variant.stockMovements ?? []).map((m) => ({
      id: m.id,
      type: m.type === StockMovementType.IN ? 'IN' : 'OUT',
      reason: m.reason,
      quantity: m.quantity,
      unitCost: m.unitCost,
      warehouseId: m.warehouseId,
      createdAt: m.createdAt,
    })),
  };
}

export default function ProductDetailScreen({ product, onRefresh }: ProductDetailScreenProps) {
  const { t } = useTranslation();
  const refreshControl = useRefreshControl(onRefresh);
  const { user } = useAuth();
  const canManage = canManageProducts(user);
  const addToOrder = useAddToOrder();
  const archive = useArchiveProduct();
  const [addOpen, setAddOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [movementTarget, setMovementTarget] = useState<StockMovementTarget | null>(null);
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

  const saleSubtitle = selectedVariant
    ? [product.name, getVariantLabel(selectedVariant), `${buyQty} ${t('product.unit')}`].join(' · ')
    : product.name;

  // «Новый заказ»: a fresh cart in the product's warehouse with this line.
  const handleNewOrder = () => {
    if (!selectedVariant) return;
    cartStore.startNew(product.warehouseId);
    const result = cartStore.addVariant(toOrderVariant(product, selectedVariant, nameById), buyQty);
    if (result !== 'added') {
      toast.show(t('product.addToOrder.noStock'), 'error');
      return;
    }
    setAddOpen(false);
    router.push({ pathname: '/(tabs)/(orders)/create', params: { keep: '1' } });
  };

  const handleSelectOrder = (order: Order) => {
    if (!selectedVariant || pendingOrderId) return;
    setPendingOrderId(order.id);
    addToOrder.mutate(
      {
        orderId: order.id,
        variantId: selectedVariant.id,
        quantity: buyQty,
        retailPrice: Number(selectedVariant.price),
        costAtSale: getLatestCostPrice(selectedVariant),
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setBuyQty(1);
          toast.show(t('product.addToOrder.added'));
        },
        onError: (err) => toast.show(getApiErrorMessage(err, t('product.addToOrder.failed')), 'error'),
        onSettled: () => setPendingOrderId(null),
      }
    );
  };

  const handleDelete = () => {
    Alert.alert(t('product.archive.title'), t('product.archive.text', { name: product.name }), [
      { text: t('product.cancel'), style: 'cancel' },
      {
        text: t('product.archive.confirm'),
        style: 'destructive',
        onPress: () =>
          archive.mutate(product.id, {
            onSuccess: () => {
              toast.show(t('product.archive.done'));
              router.back();
            },
            onError: (err) => toast.show(getApiErrorMessage(err, t('product.archive.failed')), 'error'),
          }),
      },
    ]);
  };

  const openMovement = (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;
    setMovementTarget({
      variantId: variant.id,
      warehouseId: product.warehouseId,
      name: product.name,
      variantLabel: getVariantLabel(variant),
      stock: variant.quantity,
      price: Number(variant.price),
      lastCost: getLatestCostPrice(variant),
    });
  };

  const openHistory = (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;
    router.push({
      pathname: '/(tabs)/(products)/history/[variantId]',
      params: { variantId, title: product.name, subtitle: getVariantLabel(variant), stock: String(variant.quantity) },
    });
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
      refreshControl={refreshControl}
      contentContainerClassName="px-4 pt-2 pb-10 gap-3"
    >
      <ImageCarousel
        images={product.images ?? []}
        productName={product.name}
        overlay={
          <>
            <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
            {/* Product editing is not available on mobile yet */}
            <IconButton icon={Pencil} accessibilityLabel={t('common.edit')} disabled />
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
      {product.variants.length > 0 && (
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

          <Button
            variant="accent"
            size="lg"
            full
            onPress={() => setAddOpen(true)}
            disabled={!selectedVariant || stockForSelected === 0}
          >
            {selectedVariant
              ? t('product.toOrder', { amount: formatMoney(displayPrice * buyQty), currency: t('common.currency') })
              : t('product.chooseVariant')}
          </Button>
        </View>
      )}

      {/* Staff: stock and prices per variant */}
      <View className="flex-row items-center justify-between px-1 pt-2">
        <View className="gap-0.5">
          <Text className="type-subhead text-ink">{t('product.staffPanel')}</Text>
          <Text className="font-onest text-[13px] text-muted">{t('product.adminAccess')}</Text>
        </View>
        {canManage && (
          <IconButton
            icon={Trash2}
            variant="danger"
            accessibilityLabel={t('product.deleteProduct')}
            onPress={handleDelete}
            disabled={archive.isPending}
          />
        )}
      </View>

      {product.variants.map((variant) => (
        <ProductVariantCard
          key={variant.id}
          variant={variant}
          canManage={canManage}
          onHistory={openHistory}
          onMovement={openMovement}
        />
      ))}

      <AddToOrderSheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        warehouseId={product.warehouseId}
        subtitle={saleSubtitle}
        pendingOrderId={pendingOrderId}
        onSelectOrder={handleSelectOrder}
        onNewOrder={handleNewOrder}
      />

      <StockMovementSheet target={movementTarget} onClose={() => setMovementTarget(null)} />
    </ScrollView>
  );
}
