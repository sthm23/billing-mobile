import { Button, Chip, IconButton, Money, StatusBadge, Stepper, Text, toast } from '@/components/base';
import { ConfirmSheet } from '@/components/common';
import { AddToOrderSheet } from '@/components/order';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { ProductVariantCard, RentalPriceRow } from '@/components/product/ProductVariantCard';
import { useStoreMode } from '@/hooks/use-store-mode';
import { StockMovementSheet, type StockMovementTarget } from '@/components/product/StockMovementSheet';
import { getApiErrorMessage } from '@/libs/api-error';
import { productCategoryLabel } from '@/libs/category';
import { formatMoney } from '@/libs/format';
import {
  buildAttributeMap,
  buildNameById,
  findVariantByAttrs,
  getLatestCostPrice,
  getVariantAttrs,
  getVariantLabel,
} from '@/libs/product-utils';
import { canManageProducts } from '@/libs/roles';
import { ProductDetail, ProductVariant, StockMovementType } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import { cartStore } from '@/screens/order/cart/cart-store';
import { useAddToOrder } from '@/services/order/order.queries';
import type { Order, OrderProductVariant } from '@/services/order/order.type';
import { useArchiveProduct, useRestoreProduct } from '@/services/product/product.queries';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Archive, ChevronLeft, Pencil, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';

interface ProductDetailScreenProps {
  product: ProductDetail;
  /** Reloads the product (pull to refresh) */
  onRefresh: () => Promise<unknown>;
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
  const { t, i18n } = useTranslation();
  const refreshControl = useRefreshControl(onRefresh);
  const { user } = useAuth();
  const canManage = canManageProducts(user);
  const { rentalEnabled } = useStoreMode();
  const addToOrder = useAddToOrder();
  const archive = useArchiveProduct();
  const restore = useRestoreProduct();
  const colors = useTheme();
  // Archived = read-only until restored (the backend rejects any change)
  const archived = product.isArchived;
  const [addOpen, setAddOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [movementTarget, setMovementTarget] = useState<StockMovementTarget | null>(null);
  // «В архив» / «Вернуть из архива» confirmation (ConfirmSheet: Alert.alert does nothing on web)
  // The kind stays set while the sheet slides out, so its texts don't flip
  const [confirmKind, setConfirmKind] = useState<'archive' | 'restore'>('archive');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const nameById = useMemo(
    () => buildNameById(product.attributes ?? [], i18n.language),
    [product.attributes, i18n.language]
  );

  const attributeMap = useMemo(
    () => buildAttributeMap(product.variants, nameById),
    [product.variants, nameById]
  );

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    () => getVariantAttrs(product.variants[0], nameById)
  );
  const [buyQty, setBuyQty] = useState(1);

  const selectedVariant = useMemo(
    () => findVariantByAttrs(product.variants, selectedAttrs, nameById),
    [product.variants, selectedAttrs, nameById]
  );

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

  const openConfirm = (kind: 'archive' | 'restore') => {
    setConfirmError(null);
    setConfirmKind(kind);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (archive.isPending || restore.isPending) return;
    setConfirmOpen(false);
  };

  const handleConfirm = () => {
    setConfirmError(null);
    if (confirmKind === 'archive') {
      archive.mutate(product.id, {
        onSuccess: () => {
          setConfirmOpen(false);
          toast.show(t('product.archive.done'));
          router.back();
        },
        onError: (err) => setConfirmError(getApiErrorMessage(err, t('product.archive.failed'))),
      });
    } else {
      // The returned card replaces the cached one: the screen switches to the normal mode
      restore.mutate(product.id, {
        onSuccess: () => {
          setConfirmOpen(false);
          toast.show(t('product.restore.done'));
        },
        onError: (err) => setConfirmError(getApiErrorMessage(err, t('product.restore.failed'))),
      });
    }
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

  const openRental = (variantId: string) =>
    router.push({ pathname: '/(tabs)/(products)/rental/[variantId]', params: { variantId, productId: product.id } });

  const openHistory = (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;
    router.push({
      pathname: '/(tabs)/(products)/history/[variantId]',
      params: { variantId, title: product.name, subtitle: getVariantLabel(variant), stock: String(variant.quantity) },
    });
  };

  const attributeNames = (product.attributes ?? []).map((a) => nameById[a.id]);
  const category = productCategoryLabel(product, i18n.language);
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
            {/* Edit the product card (OWNER/MANAGER); rent settings stay in the rental card */}
            {archived ? null : (
              <IconButton
                icon={Pencil}
                accessibilityLabel={t('productForm.editTitle')}
                disabled={!canManage}
                onPress={() => router.push({ pathname: '/(tabs)/(products)/edit/[id]', params: { id: product.id } })}
              />
            )}
          </>
        }
      />

      {/* Archived: hidden from the list, search and orders; owner / manager can bring it back */}
      {archived ? (
        <View className="bg-warn-bg rounded-[24px] p-4 gap-3">
          <View className="flex-row gap-3">
            <View className="w-9 h-9 rounded-full bg-card items-center justify-center">
              <Archive size={18} color={colors.warnFg} strokeWidth={2.2} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-onest-bold text-[15px] text-warn-fg">{t('product.archivedBadge')}</Text>
              <Text className="font-onest text-[13px] leading-[18px] text-warn-fg">{t('product.archivedHint')}</Text>
            </View>
          </View>
          {canManage ? (
            <Button variant="primary" full onPress={() => openConfirm('restore')} disabled={restore.isPending}>
              {t('product.restore.button')}
            </Button>
          ) : null}
        </View>
      ) : null}

      {/* Name, availability, price */}
      <View className="bg-hero rounded-2xl p-5 gap-3.5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="type-heading text-hero-ink">{product.name}</Text>
            {subtitle ? <Text className="font-onest text-[13px] text-hero-muted">{subtitle}</Text> : null}
          </View>
          <StatusBadge
            label={
              archived ? t('product.archivedBadge') : totalStock > 0 ? t('product.available') : t('product.notAvailable')
            }
            tone={!archived && totalStock > 0 ? 'accent' : 'neutral'}
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

      {/* Parameters and quantity for the sale (not for an archived product) */}
      {!archived && product.variants.length > 0 && (
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

          {rentalEnabled && selectedVariant ? (
            <RentalPriceRow variant={selectedVariant} onPress={() => openRental(selectedVariant.id)} />
          ) : null}

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
        {canManage && !archived && (
          <View className="flex-row gap-2">
            <IconButton
              icon={Plus}
              accessibilityLabel={t('productVariants.addTitle')}
              onPress={() => router.push({ pathname: '/(tabs)/(products)/variants/[id]', params: { id: product.id } })}
            />
            <IconButton
              icon={Archive}
              variant="danger"
              accessibilityLabel={t('product.deleteProduct')}
              onPress={() => openConfirm('archive')}
              disabled={archive.isPending}
            />
          </View>
        )}
      </View>

      {product.variants.map((variant) => (
        <ProductVariantCard
          key={variant.id}
          variant={variant}
          canManage={canManage}
          onHistory={openHistory}
          onMovement={archived ? undefined : openMovement}
          onRental={archived ? undefined : openRental}
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

      <ConfirmSheet
        isOpen={confirmOpen}
        onClose={closeConfirm}
        title={confirmKind === 'restore' ? t('product.restore.title') : t('product.archive.title')}
        message={
          confirmKind === 'restore'
            ? t('product.restore.text', { name: product.name })
            : t('product.archive.text', { name: product.name })
        }
        confirmLabel={confirmKind === 'restore' ? t('product.restore.confirm') : t('product.archive.confirm')}
        tone={confirmKind === 'restore' ? 'primary' : 'danger'}
        loading={archive.isPending || restore.isPending}
        error={confirmError}
        onConfirm={handleConfirm}
      />
    </ScrollView>
  );
}
