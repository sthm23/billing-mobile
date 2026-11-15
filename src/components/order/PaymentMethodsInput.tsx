import { Button, Pressable, Text } from '@/components/base';
import type { ButtonIconComponent } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { PaymentType } from '@/services/order/order.type';
import { ArrowLeftRight, Banknote, CreditCard, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

/** Order of the method tiles; «Click» is the ONLINE payment type. */
export const PAYMENT_METHODS: { type: PaymentType; icon: ButtonIconComponent }[] = [
  { type: PaymentType.CASH, icon: Banknote },
  { type: PaymentType.CARD, icon: CreditCard },
  { type: PaymentType.ONLINE, icon: Smartphone },
  { type: PaymentType.TRANSFER, icon: ArrowLeftRight },
];

export type PaymentAmounts = Record<PaymentType, string>;

export const EMPTY_PAYMENT_AMOUNTS: PaymentAmounts = {
  [PaymentType.CASH]: '',
  [PaymentType.CARD]: '',
  [PaymentType.ONLINE]: '',
  [PaymentType.TRANSFER]: '',
};

export const digitsOf = (text: string) => parseInt(text.replace(/\D/g, ''), 10) || 0;

/** Amount entered for a method (0 when the method is not selected). */
export function amountOf(selected: PaymentType[], amounts: PaymentAmounts, type: PaymentType): number {
  return selected.includes(type) ? digitsOf(amounts[type]) : 0;
}

/** Sum over the selected methods. */
export function totalEntered(selected: PaymentType[], amounts: PaymentAmounts): number {
  return PAYMENT_METHODS.reduce((acc, m) => acc + amountOf(selected, amounts, m.type), 0);
}

interface PaymentMethodsInputProps {
  selected: PaymentType[];
  amounts: PaymentAmounts;
  onSelectedChange: (selected: PaymentType[]) => void;
  onAmountsChange: (amounts: PaymentAmounts) => void;
  /** Amount to collect — «Остаток» fills a method up to it */
  due: number;
}

/**
 * «Способ оплаты» block (design «OrderPay»): method tiles (several allowed)
 * and an amount field per selected method with «Остаток» / «Очистить».
 */
export function PaymentMethodsInput({ selected, amounts, onSelectedChange, onAmountsChange, due }: PaymentMethodsInputProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const paid = totalEntered(selected, amounts);

  const toggle = (type: PaymentType) => {
    onSelectedChange(selected.includes(type) ? selected.filter((m) => m !== type) : [...selected, type]);
  };

  const setAmount = (type: PaymentType, value: number) => {
    onAmountsChange({ ...amounts, [type]: value > 0 ? formatMoney(value) : '' });
  };

  return (
    <View className="bg-card rounded-3xl p-3.5 gap-3">
      <View className="flex-row items-baseline justify-between px-0.5">
        <Text className="font-onest-bold text-[15px] text-ink">{t('sale.pay.methods')}</Text>
        <Text className="font-onest text-xs text-muted">{t('sale.pay.methodsHint')}</Text>
      </View>
      <View className="flex-row gap-1.5">
        {PAYMENT_METHODS.map(({ type, icon: Icon }) => {
          const on = selected.includes(type);
          return (
            <Pressable
              key={type}
              onPress={() => toggle(type)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              className={cn('flex-1 h-[68px] rounded-2xl items-center justify-center gap-[5px]', on ? 'bg-primary' : 'bg-sunken')}
            >
              <Icon size={22} color={on ? colors.onPrimary : colors.ink} strokeWidth={2} />
              <Text className={cn('font-onest-semibold text-xs', on ? 'text-on-primary' : 'text-ink')}>
                {t(`sale.pay.method.${type}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {PAYMENT_METHODS.filter((m) => selected.includes(m.type)).map(({ type }) => {
        const leftForThis = Math.max(0, due - (paid - amountOf(selected, amounts, type)));
        return (
          <View key={type} className="flex-row items-center gap-2.5 h-14 pl-3.5 pr-1.5 rounded-[18px] bg-sunken">
            <Text className="w-[84px] font-onest-semibold text-[13px] text-soft">{t(`sale.pay.method.${type}`)}</Text>
            <TextInput
              value={amounts[type]}
              onChangeText={(text) => setAmount(type, digitsOf(text))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
              accessibilityLabel={t('sale.pay.amountFor', { method: t(`sale.pay.method.${type}`) })}
              // textAlign as a prop, not `text-right`: react-native-css's TextInput
              // wrapper crashes on text-align classes on native ("undefined is not a function").
              textAlign="right"
              className="flex-1 min-w-0 font-onest-bold text-lg text-ink tabular-nums"
            />
            <Button
              variant="ghost"
              size="sm"
              className="bg-card"
              onPress={() => setAmount(type, leftForThis > 0 ? leftForThis : 0)}
            >
              {leftForThis > 0 ? t('sale.pay.fillRest') : t('common.clear')}
            </Button>
          </View>
        );
      })}
      {selected.length === 0 && (
        <Text className="font-onest text-[13px] text-muted text-center py-1.5">{t('sale.pay.chooseMethod')}</Text>
      )}
    </View>
  );
}
