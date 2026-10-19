import { Modal, Money, Text } from "@/components/base";
import { useTheme } from "@/hooks/use-theme";
import { PaymentType } from "@/models/order.model";
import { CashboxTransaction } from "@/models/payment.model";
import { ArrowLeftRight, Banknote, CreditCard, Smartphone } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { ButtonIconComponent } from "@/components/base";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  transactions: CashboxTransaction[];
  balance: number;
};

const PAYMENT_TYPE_ICON: Record<PaymentType, ButtonIconComponent> = {
  [PaymentType.CASH]: Banknote,
  [PaymentType.CARD]: CreditCard,
  [PaymentType.ONLINE]: Smartphone,
  [PaymentType.TRANSFER]: ArrowLeftRight,
};

export const PaymentBreakdownDialog = ({ isOpen, onClose, transactions, balance }: Props) => {
  const { t } = useTranslation();
  const colors = useTheme();

  const totalByType = (type: PaymentType) =>
    transactions
      .filter(tx => tx.paymentType === type)
      .reduce((sum, tx) => sum + +tx.amount, 0);

  return (
    <Modal
      visible={isOpen}
      onClose={onClose}
      showCloseButton
    >
      <Text className="type-subhead text-ink pr-10">{t('payment.paymentBreakdown')}</Text>
      <View className="gap-3 pt-4">
        {Object.values(PaymentType).map((type) => {
          const Icon = PAYMENT_TYPE_ICON[type];

          return (
            <View key={type} className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-sunken items-center justify-center">
                  <Icon size={18} color={colors.ink} strokeWidth={2} />
                </View>
                <Text className="font-onest-medium text-[15px] text-ink">{t(`order.paymentMethod.${type}`)}</Text>
              </View>
              <Money value={totalByType(type)} className="text-[15px]" />
            </View>
          );
        })}
        <View className="flex-row items-center justify-between border-t border-line pt-3">
          <Text className="type-body-strong text-ink">{t('payment.total')}</Text>
          <Money value={balance} className="text-lg" />
        </View>
      </View>
    </Modal>
  );
};
