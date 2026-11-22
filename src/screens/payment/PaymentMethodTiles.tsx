import { Money, Text } from "@/components/base";
import type { CashboxSummary } from "@/services/cashbox/cashbox.types";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type Props = {
  /** Income − expense per payment method (`GET /cashbox/:id` → `summary.byMethod`) */
  byMethod: CashboxSummary['byMethod'];
};

/**
 * Cashbox amount per payment method (design «Cashbox»): 2×2 tiles with the
 * method's share of the positive total as a bar (display only).
 */
export const PaymentMethodTiles = ({ byMethod }: Props) => {
  const { t } = useTranslation();
  const positiveTotal = byMethod.reduce((sum, m) => sum + Math.max(0, m.net), 0);

  return (
    <View className="flex-row flex-wrap gap-2">
      {byMethod.map(({ paymentType, net }) => {
        const share = positiveTotal > 0 ? Math.round((Math.max(0, net) / positiveTotal) * 100) : 0;

        return (
          <View
            key={paymentType}
            className="grow basis-[45%] bg-card rounded-lg p-3.5 gap-1.5"
            accessibilityLabel={`${t(`order.paymentMethod.${paymentType}`)}: ${net}`}
          >
            <Text className="font-onest text-[13px] text-muted">{t(`order.paymentMethod.${paymentType}`)}</Text>
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
