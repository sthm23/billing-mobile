import { Button, IconButton, PhotoPlaceholder, Pressable, Stepper, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { BottomSheet } from '@expo/ui';
import { ArrowDown, ArrowRight, ArrowUp, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TextInput, View } from 'react-native';

export interface PriceSheetLine {
  key: string;
  name: string;
  variantLabel: string;
  basePrice: number;
  retailPrice: number;
  sale: number;
  quantity: number;
  stock: number;
}

export interface PriceSheetResult {
  retailPrice: number;
  sale: number;
  quantity: number;
}

interface PriceSheetProps {
  line: PriceSheetLine | null;
  /** Owner/manager — may set a price below the catalogue price */
  canLower: boolean;
  onClose: () => void;
  onApply: (key: string, result: PriceSheetResult) => void;
}

type Direction = 'down' | 'up';
type Unit = 'sum' | 'pct';

const QUICK_SUM = [1000, 5000, 10000, 20000];
const QUICK_PCT = [5, 10, 15, 20];

const digitsOf = (text: string) => parseInt(text.replace(/\D/g, ''), 10) || 0;

/**
 * «Изменить цену» sheet: quantity, lower/raise the price by a sum or percent
 * of the catalogue price. Lowering maps to `sale`, raising to `retailPrice`
 * (the backend model); the backend validates the result again.
 */
export function PriceSheet({ line, canLower, onClose, onApply }: PriceSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [direction, setDirection] = useState<Direction>('down');
  const [unit, setUnit] = useState<Unit>('sum');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState(1);

  const base = line?.basePrice ?? 0;
  const initialPrice = line ? line.retailPrice - line.sale : 0;

  // Reset the form for each opened line.
  useEffect(() => {
    if (!line) return;
    const delta = line.retailPrice - line.sale - line.basePrice;
    // Show the current change as is (a seller may see a manager's discount, but not set a new one).
    setDirection(delta < 0 ? 'down' : canLower && delta === 0 ? 'down' : 'up');
    setUnit('sum');
    setAmount(delta === 0 ? '' : formatMoney(Math.abs(delta)));
    setQuantity(line.quantity);
  }, [line, canLower]);

  const value = digitsOf(amount);
  const delta = unit === 'pct' ? Math.round((base * Math.min(value, 100)) / 100) : value;
  const newPrice = direction === 'down' ? Math.max(0, base - delta) : base + delta;
  const percent = base ? Math.round((delta / base) * 1000) / 10 : 0;
  // A seller may keep a discount a manager already gave, but not set a new one.
  const blocked = newPrice < base && !canLower && newPrice !== initialPrice;
  const overStock = line ? quantity > line.stock : false;
  const sign = direction === 'down' ? '−' : '+';

  const apply = () => {
    if (!line || blocked) return;
    // Price unchanged: keep the saved retailPrice/sale as they are, so the backend
    // still sees an unchanged item (e.g. a booking made before the catalogue price rose).
    const result: PriceSheetResult =
      newPrice === initialPrice
        ? { retailPrice: line.retailPrice, sale: line.sale, quantity }
        : direction === 'down'
          ? { retailPrice: base, sale: base - newPrice, quantity }
          : { retailPrice: newPrice, sale: 0, quantity };
    onApply(line.key, result);
  };

  const quick = unit === 'pct' ? QUICK_PCT : QUICK_SUM;

  return (
    <BottomSheet isPresented={line !== null} onDismiss={onClose} snapPoints={['full']}>
      <ScrollView className="flex-1 bg-card" keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pt-2 pb-8 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">
            {t('sale.price.title')}
          </Text>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        {line && (
          <>
            <View className="flex-row items-center gap-3 bg-sunken rounded-[18px] p-2.5">
              <PhotoPlaceholder size="sm" />
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="type-body-strong text-ink" numberOfLines={1}>{line.name}</Text>
                <Text className="font-onest text-xs text-muted" numberOfLines={1}>{line.variantLabel}</Text>
              </View>
              <View className="items-end">
                <Text className="font-onest text-[11px] text-muted">{t('sale.price.price')}</Text>
                <Text className="font-onest-bold text-[15px] text-ink tabular-nums">{formatMoney(base)}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-0.5">
                <Text className="font-onest-semibold text-[15px] text-ink">{t('sale.price.quantity')}</Text>
                <Text className={cn('font-onest text-xs', overStock ? 'text-err-fg' : 'text-muted')}>
                  {overStock
                    ? t('sale.price.overStock', { count: line.stock })
                    : t('sale.price.inStock', { count: line.stock })}
                </Text>
              </View>
              <Stepper value={quantity} onChange={setQuantity} min={1} />
            </View>

            <View className="flex-row gap-1 p-1 bg-sunken rounded-pill">
              <Pressable
                onPress={() => canLower && setDirection('down')}
                disabled={!canLower}
                accessibilityRole="button"
                accessibilityState={{ selected: direction === 'down', disabled: !canLower }}
                className={cn(
                  'flex-1 h-11 rounded-pill flex-row items-center justify-center gap-1.5',
                  direction === 'down' && 'bg-err-bg'
                )}
              >
                <ArrowDown size={18} color={direction === 'down' ? colors.errFg : colors.soft} strokeWidth={2.2} />
                <Text className={cn('font-onest-semibold text-[15px]', direction === 'down' ? 'text-err-fg' : 'text-soft', !canLower && 'opacity-50')}>
                  {t('sale.price.lower')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDirection('up')}
                accessibilityRole="button"
                accessibilityState={{ selected: direction === 'up' }}
                className={cn(
                  'flex-1 h-11 rounded-pill flex-row items-center justify-center gap-1.5',
                  direction === 'up' && 'bg-ok-bg'
                )}
              >
                <ArrowUp size={18} color={direction === 'up' ? colors.okFg : colors.soft} strokeWidth={2.2} />
                <Text className={cn('font-onest-semibold text-[15px]', direction === 'up' ? 'text-ok-fg' : 'text-soft')}>
                  {t('sale.price.raise')}
                </Text>
              </Pressable>
            </View>
            {!canLower && (
              <Text className="font-onest text-xs text-muted -mt-2 px-1">{t('sale.price.lowerNotAllowed')}</Text>
            )}

            <View className="gap-2.5">
              <View className="flex-row items-center gap-2 h-[60px] pl-[18px] pr-1.5 bg-sunken rounded-lg">
                <Text className={cn('font-onest-bold text-2xl', direction === 'down' ? 'text-err-fg' : 'text-ok-fg')}>{sign}</Text>
                <TextInput
                  value={amount}
                  onChangeText={(text) => {
                    const digits = digitsOf(text);
                    setAmount(digits ? formatMoney(digits) : '');
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  accessibilityLabel={t('sale.price.amountLabel')}
                  className="flex-1 font-onest-bold text-2xl text-ink tabular-nums"
                />
                <View className="flex-row gap-0.5 p-[3px] bg-card rounded-pill">
                  {(['sum', 'pct'] as const).map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => {
                        setUnit(u);
                        setAmount('');
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: unit === u }}
                      className={cn('h-[38px] min-w-11 px-3 rounded-pill items-center justify-center', unit === u && 'bg-primary')}
                    >
                      <Text className={cn('font-onest-semibold text-[13px]', unit === u ? 'text-on-primary' : 'text-soft')}>
                        {u === 'sum' ? t('common.currency') : '%'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View className="flex-row gap-2">
                {quick.map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => setAmount(formatMoney(q))}
                    accessibilityRole="button"
                    className="flex-1 h-10 rounded-pill bg-sunken items-center justify-center"
                  >
                    <Text className="font-onest-medium text-sm text-ink">{unit === 'pct' ? `${q}%` : formatMoney(q)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="bg-hero rounded-3xl px-[18px] py-4 gap-2.5">
              <View className="flex-row items-end justify-between">
                <View className="gap-0.5">
                  <Text className="font-onest text-xs text-hero-muted">{t('sale.price.was')}</Text>
                  <Text className="font-onest text-base text-hero-muted line-through tabular-nums">{formatMoney(base)}</Text>
                </View>
                <ArrowRight size={20} color={colors.heroMuted} strokeWidth={2} />
                <View className="items-end gap-0.5">
                  <Text className="font-onest text-xs text-hero-muted">{t('sale.price.newPrice')}</Text>
                  <Text className="font-onest-bold text-[28px] tracking-[-0.5px] text-hero-ink tabular-nums">
                    {formatMoney(newPrice)}
                    <Text className="font-onest-medium text-[13px] text-hero-muted"> {t('common.currency')}</Text>
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between pt-2.5 border-t border-hero-line">
                <View className="px-2.5 py-1 rounded-pill bg-hero-sub">
                  <Text className={cn('font-onest-semibold text-[13px]', direction === 'down' ? 'text-hero-err' : 'text-accent')}>
                    {delta === 0
                      ? t('sale.price.unchanged')
                      : t(direction === 'down' ? 'sale.price.discountLabel' : 'sale.price.markupLabel', {
                          amount: `${sign}${formatMoney(delta)}`,
                          percent: `${sign}${percent}`,
                        })}
                  </Text>
                </View>
                <Text className="font-onest text-[13px] text-hero-muted">
                  {t('sale.price.lineTotal', { quantity, total: formatMoney(newPrice * quantity) })}
                </Text>
              </View>
            </View>

            {blocked && (
              <Text className="font-onest-semibold text-[13px] text-err-fg text-center">{t('sale.price.lowerNotAllowed')}</Text>
            )}

            <Button variant="accent" size="lg" full onPress={apply} disabled={blocked}>
              {t('sale.price.apply')}
            </Button>
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
