import { Button, IconButton, Text } from '@/components/base';
import { Sheet, SheetScrollView, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { ArrowRight, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface OrderDiscountSheetProps {
  isOpen: boolean;
  /** Total before any discount (items at their price + services) */
  base: number;
  /** Current total with the discounts already set */
  total: number;
  /** Number of positions the discount is spread over (items + services) */
  positions: number;
  /** Some discount is set now — «Убрать скидку» is shown */
  hasDiscount: boolean;
  onClose: () => void;
  /** Applies the agreed total; false — outside 0 … base */
  onApply: (target: number) => boolean;
  onRemove: () => void;
}

const digitsOf = (text: string) => parseInt(text.replace(/\D/g, ''), 10) || 0;

/**
 * «Скидка на заказ» (owner/manager): the agreed total for the whole order. The
 * difference is spread over the lines once (rental set-discount algorithm,
 * `docs/features/orders.md`); the backend validates the resulting `sale` values.
 */
export function OrderDiscountSheet({
  isOpen,
  base,
  total,
  positions,
  hasDiscount,
  onClose,
  onApply,
  onRemove,
}: OrderDiscountSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (isOpen) setTarget('');
  }, [isOpen]);

  const value = target ? digitsOf(target) : null;
  const invalid = value !== null && value > base;
  const discount = value !== null && !invalid ? base - value : 0;

  let hint = t('sale.discount.hint');
  if (invalid) hint = t('sale.discount.invalid', { amount: formatMoney(base) });
  else if (discount > 0) hint = t('sale.discount.spread', { amount: formatMoney(discount), count: positions });

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <SheetScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pt-2 pb-8 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">
            {t('sale.discount.title')}
          </Text>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        <View className="gap-2.5">
          <Text className="font-onest text-xs text-muted px-1">{t('sale.discount.targetLabel')}</Text>
          <View className="flex-row items-center gap-2 h-[60px] px-[18px] bg-sunken rounded-lg">
            <SheetTextInput
              value={target}
              onChangeText={(text) => {
                setTarget(text.trim() === '' ? '' : formatMoney(digitsOf(text)));
              }}
              keyboardType="number-pad"
              placeholder={formatMoney(total)}
              placeholderTextColor={colors.muted}
              accessibilityLabel={t('sale.discount.targetLabel')}
              className="flex-1 min-w-0 font-onest-bold text-2xl text-ink tabular-nums"
            />
            <Text className="font-onest-medium text-[13px] text-muted">{t('common.currency')}</Text>
          </View>
          <Text
            className={cn(
              'font-onest text-xs px-1',
              invalid ? 'text-err-fg' : discount > 0 ? 'text-ok-fg' : 'text-muted'
            )}
          >
            {hint}
          </Text>
        </View>

        <View className="bg-hero rounded-3xl px-[18px] py-4 gap-2.5">
          <View className="flex-row items-end justify-between">
            <View className="gap-0.5">
              <Text className="font-onest text-xs text-hero-muted">{t('sale.discount.current')}</Text>
              <Text className="font-onest text-base text-hero-muted tabular-nums">{formatMoney(total)}</Text>
            </View>
            <ArrowRight size={20} color={colors.heroMuted} strokeWidth={2} />
            <View className="items-end gap-0.5">
              <Text className="font-onest text-xs text-hero-muted">{t('order.total')}</Text>
              <Text className="font-onest-bold text-[28px] tracking-[-0.5px] text-hero-ink tabular-nums">
                {formatMoney(value !== null && !invalid ? value : total)}
                <Text className="font-onest-medium text-[13px] text-hero-muted"> {t('common.currency')}</Text>
              </Text>
            </View>
          </View>
          {hasDiscount ? (
            <Text className="font-onest text-xs text-hero-muted pt-2.5 border-t border-hero-line">
              {t('sale.discount.replaces')}
            </Text>
          ) : null}
        </View>

        <Button
          variant="accent"
          size="lg"
          full
          disabled={value === null || invalid}
          onPress={() => {
            if (value !== null) onApply(value);
          }}
        >
          {t('sale.discount.apply')}
        </Button>
        {hasDiscount ? (
          <Button variant="secondary" size="lg" full onPress={onRemove}>
            {t('sale.discount.remove')}
          </Button>
        ) : null}
      </SheetScrollView>
    </Sheet>
  );
}
