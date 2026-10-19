import { Text } from "@/components/base";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/libs/utils";
import { CashTransactionType } from "@/models/payment.model";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { BottomSheet } from "@expo/ui";
import { ArrowDownRight, ArrowUpRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { TransactionForm } from "./TransactionForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cashboxId: string;
  transactionType: CashTransactionType;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
  isLoading?: boolean;
};

export const AddTransactionSheet = ({
  isOpen,
  onClose,
  cashboxId,
  transactionType,
  onSubmit,
  isLoading = false,
}: Props) => {
  const { t } = useTranslation();
  const colors = useTheme();

  const isIncome = transactionType === CashTransactionType.INCOME;
  const Icon = isIncome ? ArrowDownRight : ArrowUpRight;
  const typeLabel = isIncome ? t('payment.addIncome') : t('payment.addExpense');

  return (
    <BottomSheet
      isPresented={isOpen}
      onDismiss={onClose}
      snapPoints={['full']}
    >
      <View className="flex-1 bg-card px-4 pt-2 pb-6">
        <View className="flex-row items-center gap-3 pb-4">
          <View className={cn('w-10 h-10 rounded-full items-center justify-center', isIncome ? 'bg-ok-bg' : 'bg-err-bg')}>
            <Icon size={18} color={isIncome ? colors.okFg : colors.errFg} strokeWidth={2} />
          </View>
          <Text className="type-heading text-ink">{typeLabel}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="flex-1">
          <TransactionForm
            cashboxId={cashboxId}
            transactionType={transactionType}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </ScrollView>
      </View>
    </BottomSheet>
  );
};
