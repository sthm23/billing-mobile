import { Button, IconButton, PhotoPlaceholder, Segmented, Text, toast } from '@/components/base';
import { Sheet, SheetScrollView, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { StockMovementReason, StockMovementType } from '@/models/product.model';
import { useInventoryMovement } from '@/services/product/product.queries';
import { ArrowRight, CircleAlert, X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export interface StockMovementTarget {
  variantId: string;
  warehouseId: string;
  name: string;
  variantLabel: string;
  stock: number;
  price: number;
  /** Cost of the latest receipt (prefills the purchase cost) */
  lastCost: number;
}

interface StockMovementSheetProps {
  target: StockMovementTarget | null;
  onClose: () => void;
}

type Mode = 'in' | 'out';

const digitsOf = (text: string) => parseInt(text.replace(/\D/g, ''), 10) || 0;
const moneyText = (text: string) => {
  const digits = digitsOf(text);
  return digits ? formatMoney(digits) : '';
};

/**
 * «Приход / Списание» sheet for one variant (owner/manager).
 * Receipt = IN + PURCHASE with a unit cost and an optional new sale price;
 * write-off = OUT + ADJUSTMENT. The backend validates again and never lets
 * stock go below zero.
 */
export function StockMovementSheet({ target, onClose }: StockMovementSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const movement = useInventoryMovement();
  const [mode, setMode] = useState<Mode>('in');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset the form for each opened variant.
  useEffect(() => {
    if (!target) return;
    setMode('in');
    setQuantity('');
    setCost(target.lastCost ? formatMoney(target.lastCost) : '');
    setPrice('');
    setError(null);
  }, [target]);

  const isIn = mode === 'in';
  const qty = digitsOf(quantity);
  const unitCost = digitsOf(cost);
  const newPrice = digitsOf(price);
  const stock = target?.stock ?? 0;
  const nextStock = isIn ? stock + qty : stock - qty;
  const overStock = !isIn && qty > stock;
  const canSubmit = qty > 0 && !overStock && (!isIn || cost.trim() !== '') && !movement.isPending;

  const submit = () => {
    if (!target || !canSubmit) return;
    setError(null);
    movement.mutate(
      {
        warehouseId: target.warehouseId,
        body: isIn
          ? {
              type: StockMovementType.IN,
              reason: StockMovementReason.PURCHASE,
              variantId: target.variantId,
              quantity: qty,
              costPrice: unitCost,
              ...(newPrice ? { price: newPrice } : {}),
            }
          : {
              type: StockMovementType.OUT,
              reason: StockMovementReason.ADJUSTMENT,
              variantId: target.variantId,
              quantity: qty,
            },
      },
      {
        onSuccess: () => {
          toast.show(isIn ? t('product.movement.receivedToast', { count: qty }) : t('product.movement.writtenOffToast', { count: qty }));
          onClose();
        },
        onError: (err) => setError(getApiErrorMessage(err, t('product.movement.failed'))),
      }
    );
  };

  return (
    <Sheet isOpen={target !== null} onClose={onClose}>
      <SheetScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pt-2 pb-8 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">
            {t('product.stockMovementButton')}
          </Text>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        {target && (
          <>
            <View className="flex-row items-center gap-3 bg-sunken rounded-[18px] p-2.5">
              <PhotoPlaceholder size="sm" />
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="type-body-strong text-ink" numberOfLines={1}>{target.name}</Text>
                <Text className="font-onest text-xs text-muted" numberOfLines={1}>{target.variantLabel}</Text>
              </View>
              <View className="items-end">
                <Text className="font-onest text-[11px] text-muted">{t('product.movement.inStock')}</Text>
                <Text className="font-onest-bold text-[15px] text-ink tabular-nums">
                  {stock} {t('product.unit')}
                </Text>
              </View>
            </View>

            <Segmented
              variant="sunken"
              value={mode}
              onChange={(value) => {
                setMode(value);
                setError(null);
              }}
              options={[
                { value: 'in', label: t('product.movement.receipt') },
                { value: 'out', label: t('product.movement.writeOff') },
              ]}
            />

            <Field label={t('product.movement.quantity')} suffix={t('product.unit')} invalid={overStock}>
              <SheetTextInput
                value={quantity}
                onChangeText={(text) => setQuantity(moneyText(text))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.muted}
                accessibilityLabel={t('product.movement.quantity')}
                className="flex-1 font-onest-bold text-xl text-ink tabular-nums"
              />
            </Field>
            {overStock && (
              <Text className="font-onest text-xs text-err-fg -mt-2 px-1">
                {t('product.movement.overStock', { count: stock })}
              </Text>
            )}

            {isIn && (
              <>
                <Field label={t('product.movement.unitCost')} suffix={t('common.currency')}>
                  <SheetTextInput
                    value={cost}
                    onChangeText={(text) => setCost(moneyText(text))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    accessibilityLabel={t('product.movement.unitCost')}
                    className="flex-1 font-onest-bold text-xl text-ink tabular-nums"
                  />
                </Field>
                <Field
                  label={t('product.movement.newPrice')}
                  hint={t('product.movement.newPriceHint', { price: formatMoney(target.price) })}
                  suffix={t('common.currency')}
                >
                  <SheetTextInput
                    value={price}
                    onChangeText={(text) => setPrice(moneyText(text))}
                    keyboardType="number-pad"
                    placeholder={formatMoney(target.price)}
                    placeholderTextColor={colors.muted}
                    accessibilityLabel={t('product.movement.newPrice')}
                    className="flex-1 font-onest-bold text-xl text-ink tabular-nums"
                  />
                </Field>
              </>
            )}

            {!isIn && <Text className="font-onest text-xs text-muted -mt-1 px-1">{t('product.movement.writeOffHint')}</Text>}

            {/* Result preview */}
            <View className="bg-hero rounded-3xl px-[18px] py-4 gap-2.5">
              <View className="flex-row items-end justify-between">
                <View className="gap-0.5">
                  <Text className="font-onest text-xs text-hero-muted">{t('product.movement.stockNow')}</Text>
                  <Text className="font-onest text-base text-hero-muted tabular-nums">
                    {stock} {t('product.unit')}
                  </Text>
                </View>
                <ArrowRight size={20} color={colors.heroMuted} strokeWidth={2} />
                <View className="items-end gap-0.5">
                  <Text className="font-onest text-xs text-hero-muted">{t('product.movement.stockAfter')}</Text>
                  <Text
                    className={cn(
                      'font-onest-bold text-[28px] tracking-[-0.5px] tabular-nums',
                      overStock ? 'text-hero-err' : 'text-hero-ink'
                    )}
                  >
                    {Math.max(nextStock, 0)}
                    <Text className="font-onest-medium text-[13px] text-hero-muted"> {t('product.unit')}</Text>
                  </Text>
                </View>
              </View>
              {isIn && qty > 0 && unitCost > 0 && (
                <View className="flex-row items-center justify-between pt-2.5 border-t border-hero-line">
                  <Text className="font-onest text-[13px] text-hero-muted">{t('product.movement.purchaseSum')}</Text>
                  <Text className="font-onest-semibold text-[15px] text-hero-ink tabular-nums">
                    {formatMoney(qty * unitCost)} {t('common.currency')}
                  </Text>
                </View>
              )}
            </View>

            {error && (
              <View className="flex-row items-center gap-2 rounded-2xl bg-err-bg px-3.5 py-3">
                <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
                <Text className="flex-1 font-onest text-[13px] text-err-fg">{error}</Text>
              </View>
            )}

            <Button
              variant={isIn ? 'accent' : 'danger'}
              size="lg"
              full
              onPress={submit}
              disabled={!canSubmit}
              loading={movement.isPending}
            >
              {isIn ? t('product.movement.submitReceipt') : t('product.movement.submitWriteOff')}
            </Button>
          </>
        )}
      </SheetScrollView>
    </Sheet>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  suffix: string;
  invalid?: boolean;
  children: ReactNode;
}

function Field({ label, hint, suffix, invalid, children }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="type-label text-muted px-1">{label}</Text>
      <View
        className={cn(
          'flex-row items-center gap-2 h-[56px] px-[18px] bg-sunken rounded-lg border-[1.5px]',
          invalid ? 'border-err-fg' : 'border-transparent'
        )}
      >
        {children}
        <Text className="font-onest-medium text-[15px] text-muted">{suffix}</Text>
      </View>
      {hint && <Text className="font-onest text-xs text-muted px-1">{hint}</Text>}
    </View>
  );
}
