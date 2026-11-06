import { Button, IconButton, Stepper, Switch, Text, toast } from '@/components/base';
import { EmptyState } from '@/components/common';
import { digitsOf } from '@/components/order';
import { useStoreMode } from '@/hooks/use-store-mode';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { getVariantLabel } from '@/libs/product-utils';
import { canManageProducts } from '@/libs/roles';
import { cn } from '@/libs/utils';
import type { ProductDetail, ProductVariant } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import { useUpdateVariant } from '@/services/product/product.queries';
import { router } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Backend MAX_CLEANING_DAYS */
const MAX_CLEANING_DAYS = 30;

interface RentalItemFormScreenProps {
  product: ProductDetail;
  variant: ProductVariant;
}

/**
 * «Цена и аренда» of a variant (design «Аренда · вещь · форма», OWNER/MANAGER —
 * the backend checks it): rented or not, day price, dry cleaning after a
 * return, and the sale price when the store sells. `PUT /product/variants/:id`.
 * Units owned are stock: changed by «Приход / Списание» (a stock movement).
 */
export function RentalItemFormScreen({ product, variant }: RentalItemFormScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { salesEnabled } = useStoreMode();
  const update = useUpdateVariant();

  const [canRent, setCanRent] = useState(!!variant.canRent);
  const [rentPrice, setRentPrice] = useState(() => {
    const n = Number(variant.rentPricePerDay ?? 0);
    return n > 0 ? formatMoney(n) : '';
  });
  const [cleaningDays, setCleaningDays] = useState(variant.defaultCleaningDays ?? 0);
  const [salePrice, setSalePrice] = useState(() => {
    const n = Number(variant.price);
    return n > 0 ? formatMoney(n) : '';
  });
  const [error, setError] = useState<string | null>(null);

  const header = (
    <View className="flex-row items-start gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('rental.itemForm.title')}</Text>
        <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
          {product.name} · {getVariantLabel(variant)}
        </Text>
      </View>
    </View>
  );

  if (!canManageProducts(user)) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={Lock} message={t('rental.itemForm.noAccess')} />
      </View>
    );
  }

  const rentValue = digitsOf(rentPrice);
  const needsPrice = canRent && rentValue <= 0;

  const save = () => {
    if (needsPrice || update.isPending) return;
    setError(null);
    update.mutate(
      {
        variantId: variant.id,
        body: {
          // The endpoint always takes the sale price: unchanged unless the store sells
          price: salesEnabled ? digitsOf(salePrice) : Number(variant.price),
          canRent,
          ...(rentValue > 0 ? { rentPricePerDay: rentValue } : {}),
          defaultCleaningDays: cleaningDays,
        },
      },
      {
        onSuccess: () => {
          toast.show(t('rental.itemForm.saved'), 'success');
          router.back();
        },
        onError: (err) => setError(getApiErrorMessage(err, t('rental.itemForm.failed'))),
      },
    );
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
      >
        <View className="bg-card rounded-xl p-4 gap-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="type-body-strong text-ink">{t('rental.itemForm.canRent')}</Text>
              <Text className="font-onest text-xs text-muted">{t('rental.itemForm.canRentHint')}</Text>
            </View>
            <Switch value={canRent} onValueChange={setCanRent} accessibilityLabel={t('rental.itemForm.canRent')} />
          </View>

          {canRent ? (
            <>
              <PriceField
                label={t('rental.itemForm.dayPrice')}
                unit={t('rental.item.perDay')}
                value={rentPrice}
                onChange={setRentPrice}
                invalid={needsPrice}
              />
              {needsPrice ? <Text className="font-onest text-xs text-err-fg -mt-2">{t('rental.itemForm.needPrice')}</Text> : null}

              <View className="flex-row items-center gap-3">
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="type-body-strong text-ink">{t('rental.itemForm.units')}</Text>
                  <Text className="font-onest text-xs text-muted">{t('rental.itemForm.unitsHint')}</Text>
                </View>
                <Text className="font-onest-bold text-xl text-ink tabular-nums">{variant.quantity}</Text>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="type-body-strong text-ink">{t('rental.itemForm.cleaning')}</Text>
                  <Text className="font-onest text-xs text-muted">
                    {cleaningDays > 0
                      ? t('rental.itemForm.cleaningHint', { days: t('rental.days', { count: cleaningDays }) })
                      : t('rental.itemForm.noCleaning')}
                  </Text>
                </View>
                <Stepper value={cleaningDays} onChange={setCleaningDays} min={0} max={MAX_CLEANING_DAYS} size="sm" />
              </View>
            </>
          ) : null}
        </View>

        <View className="bg-card rounded-xl p-4 gap-3">
          <Text className="type-body-strong text-ink">{t('rental.itemForm.salePrice')}</Text>
          {salesEnabled ? (
            <PriceField label={t('rental.itemForm.salePriceLabel')} value={salePrice} onChange={setSalePrice} />
          ) : (
            <Text className="font-onest text-[13px] text-muted">{t('rental.itemForm.salesOff')}</Text>
          )}
        </View>

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pt-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button variant="accent" size="lg" full disabled={needsPrice} loading={update.isPending} onPress={save}>
          {t('rental.itemForm.save')}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

function PriceField({
  label,
  unit,
  value,
  onChange,
  invalid = false,
}: {
  label: string;
  unit?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const colors = useTheme();
  return (
    <View className="gap-1.5">
      <Text className="font-onest-semibold text-[13px] text-soft">{label}</Text>
      <View className={cn('flex-row items-center h-[52px] px-4 rounded-2xl bg-sunken gap-2', invalid && 'border-[1.5px] border-err-fg')}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.trim() === '' ? '' : formatMoney(digitsOf(text)))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.muted}
          accessibilityLabel={label}
          textAlignVertical="center"
          className="flex-1 min-w-0 h-11 py-0 font-onest-bold text-lg text-ink tabular-nums"
        />
        <Text className="font-onest text-sm text-muted">{unit ?? t('common.currency')}</Text>
      </View>
    </View>
  );
}
