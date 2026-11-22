import { Money, Text } from "@/components/base";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/libs/utils";
import { CashboxTransaction, CashTransactionType } from "@/models/payment.model";
import { TFunction } from "i18next";
import { ArrowDownRight, ArrowUpRight } from "lucide-react-native";
import { View } from "react-native";

type Props = {
  transaction: CashboxTransaction;
  showDivider?: boolean;
  t: TFunction;
};

/**
 * Cashbox transaction row: direction icon, category, time · method, signed amount.
 */
export const TransactionCard = ({ transaction, showDivider = true, t }: Props) => {
  const colors = useTheme();
  const isIncome = transaction.type === CashTransactionType.INCOME;
  const Icon = isIncome ? ArrowDownRight : ArrowUpRight;

  const formattedTime = new Date(transaction.createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className={cn('flex-row items-center gap-3 py-3', showDivider && 'border-b border-line')}>
      <View className={cn('w-10 h-10 rounded-full items-center justify-center', isIncome ? 'bg-ok-bg' : 'bg-err-bg')}>
        <Icon size={18} color={isIncome ? colors.okFg : colors.errFg} strokeWidth={2} />
      </View>

      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="type-body-strong text-ink" numberOfLines={1}>
          {t(`payment.category.${transaction.category}`)}
        </Text>
        <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
          {formattedTime} · {t(`order.paymentMethod.${transaction.paymentType}`)}
        </Text>
      </View>

      <Money
        value={isIncome ? transaction.amount : -transaction.amount}
        signed
        currency={null}
        className={cn('text-[15px]', isIncome ? 'text-ok-fg' : 'text-err-fg')}
      />
    </View>
  );
};
