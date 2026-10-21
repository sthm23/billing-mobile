import { Money, Text } from "@/components/base";
import { PaymentType } from "@/models/order.model";
import { CashTransactionType, CashboxTransaction } from "@/models/payment.model";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type Props = {
  transactions: CashboxTransaction[];
};

const METHODS: PaymentType[] = [PaymentType.CASH, PaymentType.CARD, PaymentType.ONLINE, PaymentType.TRANSFER];

/**
 * Cashbox amount per payment method (design «Cashbox»): 2×2 tiles with the
 * method's share of the total as a bar.
 *
 * Pre-existing client-side totals (income − expense per method); to be
 * replaced by backend values (redesign stage 7).
 */
export const PaymentMethodTiles = ({ transactions }: Props) => {
  const { t } = useTranslation();

  const netByMethod = METHODS.map((type) => {
    const net = transactions
      .filter((tx) => tx.paymentType === type)
      .reduce((sum, tx) => sum + (tx.type === CashTransactionType.EXPENSE ? -tx.amount : +tx.amount), 0);
    return { type, net };
  });
  const positiveTotal = netByMethod.reduce((sum, m) => sum + Math.max(0, m.net), 0);

  return (
    <View className="flex-row flex-wrap gap-2">
      {netByMethod.map(({ type, net }) => {
        const share = positiveTotal > 0 ? Math.round((Math.max(0, net) / positiveTotal) * 100) : 0;

        return (
          <View
            key={type}
            className="grow basis-[45%] bg-card rounded-lg p-3.5 gap-1.5"
            accessibilityLabel={`${t(`order.paymentMethod.${type}`)}: ${net}`}
          >
            <Text className="font-onest text-[13px] text-muted">{t(`order.paymentMethod.${type}`)}</Text>
            <Money value={net} currency={null} className="text-[17px]" />
            <View className="h-1 rounded-pill bg-ph-bg overflow-hidden">
              <View className="h-1 rounded-pill bg-ink" style={{ width: `${share}%` }} />
            </View>
          </View>
        );
      })}
    </View>
  );
};
