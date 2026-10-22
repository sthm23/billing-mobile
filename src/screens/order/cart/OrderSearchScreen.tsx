import { Button, Chip, IconButton, Money, PhotoPlaceholder, StatusBadge, Text } from '@/components/base';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import type { OrderProductVariant } from '@/services/order/order.type';
import { useProductVariantSearch } from '@/services/product/product.queries';
import { router } from 'expo-router';
import { ChevronLeft, Minus, Plus, ScanBarcode, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cartStore, cartTotals, useCart, variantLabel } from './cart-store';

type Filter = 'all' | 'inStock';

const LOW_STOCK = 5;

/**
 * Product search for the order (design «OrderSearch»): by name, SKU or
 * barcode in the cart's warehouse; adds lines to the shared cart.
 */
export function OrderSearchScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const debounced = useDebounce(query, 400);
  const { data, isFetching, isError } = useProductVariantSearch(cart.warehouseId, debounced);
  const totals = cartTotals(cart);

  const hasQuery = debounced.trim().length >= 2;
  const results = hasQuery ? (data?.data ?? []).filter((v) => filter === 'all' || v.quantity > 0) : [];

  const renderItem = ({ item }: { item: OrderProductVariant }) => {
    const inCart = cart.lines.find((l) => l.variantId === item.id);
    const count = inCart?.quantity ?? 0;
    const outOfStock = item.quantity <= 0;
    const stock = outOfStock
      ? { label: t('sale.search.outOfStock'), tone: 'err' as const }
      : item.quantity <= LOW_STOCK
        ? { label: t('sale.cart.stockLow', { count: item.quantity }), tone: 'warn' as const }
        : { label: t('sale.cart.inStock', { count: item.quantity }), tone: 'ok' as const };

    return (
      <View className={cn('flex-row items-center gap-3 bg-card rounded-lg p-2.5', count > 0 && 'border-2 border-accent')}>
        <PhotoPlaceholder size="md" />
        <View className="flex-1 min-w-0 gap-1">
          <Text className="font-onest-medium text-[15px] text-ink" numberOfLines={1}>{item.productName}</Text>
          <View className="flex-row items-center gap-1.5">
            <View className="px-[7px] py-0.5 rounded-lg bg-sunken max-w-[60%]">
              <Text className="font-onest-semibold text-xs text-ink" numberOfLines={1}>
                {variantLabel(item.attributes, item.sku)}
              </Text>
            </View>
            {item.barCode && (
              <Text className="font-onest text-xs text-muted tabular-nums" numberOfLines={1}>…{item.barCode.slice(-4)}</Text>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <Money value={item.price} className="text-[15px]" />
            <StatusBadge label={stock.label} tone={stock.tone} size="sm" />
          </View>
        </View>
        {count > 0 ? (
          <View className="items-center gap-0.5 bg-accent rounded-[22px] p-1">
            <IconButton
              icon={Plus}
              size="sm"
              variant="card"
              accessibilityLabel={t('sale.search.addOneMore')}
              onPress={() => cartStore.addVariant(item)}
              disabled={count >= item.quantity}
            />
            <Text className="font-onest-bold text-sm text-on-accent tabular-nums">{count}</Text>
            <IconButton
              icon={Minus}
              size="sm"
              variant="card"
              accessibilityLabel={t('sale.search.removeOne')}
              onPress={() => cartStore.decrementVariant(item.id)}
            />
          </View>
        ) : (
          <IconButton
            icon={Plus}
            variant="primary"
            accessibilityLabel={t('order.add')}
            onPress={() => cartStore.addVariant(item)}
            disabled={outOfStock}
          />
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('order.back')} onPress={() => router.back()} />
        <View className="flex-1 flex-row items-center gap-2 h-12 pl-3.5 pr-1.5 rounded-pill bg-card border-2 border-ink">
          <Search size={18} color={colors.muted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('sale.search.placeholder')}
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="search"
            accessibilityLabel={t('sale.search.placeholder')}
            className="flex-1 font-onest-medium text-base text-ink"
          />
          {query.length > 0 && (
            <IconButton icon={X} size="sm" variant="sunken" accessibilityLabel={t('common.clear')} onPress={() => setQuery('')} />
          )}
        </View>
        <IconButton
          icon={ScanBarcode}
          variant="accent"
          accessibilityLabel={t('sale.scan.title')}
          onPress={() => router.replace('/(tabs)/(orders)/scan')}
        />
      </View>

      <View className="flex-row gap-2 px-4 pb-3">
        <Chip label={t('sale.search.all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={t('sale.search.inStockOnly')} selected={filter === 'inStock'} onPress={() => setFilter('inStock')} />
      </View>

      <View className="flex-row items-baseline justify-between px-5 pb-2">
        <Text className="font-onest-semibold text-[13px] text-muted">
          {hasQuery ? t('sale.search.found', { count: results.length }) : t('sale.search.title')}
        </Text>
        <Text className="font-onest text-xs text-muted">{t('sale.search.hint')}</Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110, gap: 8 }}
        ListEmptyComponent={
          isFetching ? (
            <ActivityIndicator color={colors.muted} className="pt-8" />
          ) : (
            <View className="bg-card rounded-3xl px-5 py-7 items-center gap-2.5">
              <View className="w-[52px] h-[52px] rounded-full bg-sunken items-center justify-center">
                <Search size={24} color={colors.muted} strokeWidth={2} />
              </View>
              <Text className="font-onest-semibold text-base text-ink">
                {isError ? t('sale.search.failed') : hasQuery ? t('sale.search.notFound') : t('sale.search.startTyping')}
              </Text>
              {hasQuery && !isError && (
                <Text className="font-onest text-[13px] leading-[19px] text-muted text-center">
                  {t('sale.search.notFoundText')}
                </Text>
              )}
            </View>
          )
        }
      />

      {/* Cart summary */}
      <View
        className="absolute left-4 right-4 h-[68px] flex-row items-center gap-3 pl-[22px] pr-2 rounded-[34px] bg-hero"
        style={{ bottom: insets.bottom + 16 }}
      >
        <View className="flex-1 min-w-0">
          <Text className="font-onest text-xs text-hero-muted">
            {t('sale.search.inOrder', { count: totals.quantity })}
          </Text>
          <Money value={totals.total} className="text-[17px] text-hero-ink" currencyClassName="text-xs text-hero-muted" />
        </View>
        <Button variant="accent" size="lg" onPress={() => router.back()}>
          {t('sale.search.done')}
        </Button>
      </View>
    </View>
  );
}
