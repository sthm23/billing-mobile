import { Button, IconButton, Money, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { productQueryKeys } from '@/services/product/product.queries';
import { productService } from '@/services/product/product.service';
import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { Camera, ChevronLeft, CircleAlert, CircleCheck, Flashlight, FlashlightOff, Search } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cartStore, cartTotals, useCart } from './cart-store';

/** Same code is ignored for this long, so one label is not added twice. */
const REPEAT_DELAY_MS = 2000;

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'qr'] as const;

type Feedback = { tone: 'ok' | 'err'; text: string } | null;

/**
 * Barcode scanner for the order: each scan looks the code up with the
 * product search of the cart's warehouse and adds one unit to the cart.
 */
export function ScanScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const cart = useCart();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const busy = useRef(false);
  const last = useRef<{ code: string; at: number } | null>(null);
  const totals = cartTotals(cart);

  // Leaving the scanner with an empty new order (Scan button, nothing scanned):
  // there is no order to return to — go to the order list instead.
  const leave = () => {
    if (!cart.orderId && cart.lines.length === 0) {
      router.dismissTo('/(tabs)/(orders)');
    } else {
      router.back();
    }
  };

  const handleScan = async ({ data }: BarcodeScanningResult) => {
    const code = data.trim();
    const now = Date.now();
    if (!code || busy.current) return;
    if (!cart.warehouseId) {
      setFeedback({ tone: 'err', text: t('sale.cart.chooseWarehouse') });
      return;
    }
    if (last.current && last.current.code === code && now - last.current.at < REPEAT_DELAY_MS) return;

    busy.current = true;
    last.current = { code, at: now };
    try {
      const warehouseId = cart.warehouseId;
      const result = await queryClient.fetchQuery({
        queryKey: [...productQueryKeys.all(), 'search', warehouseId, code],
        queryFn: () => productService.searchProducts(warehouseId, code),
        staleTime: 10_000,
      });
      const variants = result.data;
      const variant =
        variants.find((v) => v.barCode === code || v.sku === code) ?? (variants.length === 1 ? variants[0] : undefined);

      if (!variant) {
        setFeedback({ tone: 'err', text: t('sale.scan.notFound', { code }) });
        return;
      }

      const added = cartStore.addVariant(variant);
      setFeedback(
        added === 'added'
          ? { tone: 'ok', text: t('sale.scan.added', { name: variant.productName }) }
          : { tone: 'err', text: added === 'outOfStock' ? t('sale.scan.outOfStock', { name: variant.productName }) : t('sale.scan.maxReached', { name: variant.productName }) }
      );
    } catch {
      setFeedback({ tone: 'err', text: t('sale.scan.failed') });
    } finally {
      last.current = { code, at: Date.now() };
      busy.current = false;
    }
  };

  const header = (
    <View className="flex-row items-center gap-2 px-4" style={{ paddingTop: insets.top + 8 }}>
      <IconButton icon={ChevronLeft} variant="hero" accessibilityLabel={t('order.back')} onPress={leave} />
      <Text className="flex-1 type-heading text-hero-ink" accessibilityRole="header">{t('sale.scan.title')}</Text>
      {permission?.granted && (
        <IconButton
          icon={torch ? FlashlightOff : Flashlight}
          variant="hero"
          accessibilityLabel={torch ? t('sale.scan.torchOff') : t('sale.scan.torchOn')}
          onPress={() => setTorch((v) => !v)}
        />
      )}
    </View>
  );

  if (!permission) {
    return <View className="flex-1 bg-hero">{header}</View>;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-hero">
        {header}
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View className="w-16 h-16 rounded-full bg-hero-sub items-center justify-center">
            <Camera size={28} color={colors.heroInk} strokeWidth={1.75} />
          </View>
          <Text className="font-onest-bold text-lg text-hero-ink text-center">{t('sale.scan.permissionTitle')}</Text>
          <Text className="font-onest text-[13px] leading-[19px] text-hero-muted text-center">{t('sale.scan.permissionText')}</Text>
          {permission.canAskAgain ? (
            <Button variant="accent" onPress={requestPermission}>{t('sale.scan.allow')}</Button>
          ) : (
            <Button variant="accent" onPress={() => Linking.openSettings()}>{t('sale.scan.openSettings')}</Button>
          )}
          <Button variant="hero" icon={Search} onPress={() => router.replace('/(tabs)/(orders)/search')}>
            {t('sale.scan.searchInstead')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-hero">
      <CameraView
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={handleScan}
      />
      {header}

      {/* Aiming frame */}
      <View className="flex-1 items-center justify-center" pointerEvents="none">
        <View className="w-[78%] h-40 rounded-3xl border-[3px] border-accent" />
        <Text className="mt-4 font-onest-medium text-sm text-hero-ink">{t('sale.scan.hint')}</Text>
      </View>

      <View className="px-4 gap-3" style={{ paddingBottom: insets.bottom + 16 }}>
        {feedback && (
          <View
            className={cn('flex-row items-center gap-2 rounded-2xl px-3.5 py-3', feedback.tone === 'ok' ? 'bg-ok-bg' : 'bg-err-bg')}
            accessibilityLiveRegion="polite"
          >
            {feedback.tone === 'ok' ? (
              <CircleCheck size={18} color={colors.okFg} strokeWidth={2} />
            ) : (
              <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
            )}
            <Text className={cn('flex-1 font-onest-medium text-[13px]', feedback.tone === 'ok' ? 'text-ok-fg' : 'text-err-fg')}>
              {feedback.text}
            </Text>
          </View>
        )}
        <View className="h-[68px] flex-row items-center gap-3 pl-[22px] pr-2 rounded-[34px] bg-hero-sub">
          <View className="flex-1 min-w-0">
            <Text className="font-onest text-xs text-hero-muted">{t('sale.search.inOrder', { count: totals.quantity })}</Text>
            <Money value={totals.total} className="text-[17px] text-hero-ink" currencyClassName="text-xs text-hero-muted" />
          </View>
          <Button variant="accent" size="lg" onPress={leave}>
            {t('sale.search.done')}
          </Button>
        </View>
      </View>
    </View>
  );
}
