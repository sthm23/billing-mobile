import {
  Box,
  Divider,
  HStack,
  Text
} from "@/components/base";
import CustomIcon from "@/icons/custom-icon";
import { IconNames } from "@/icons/icon.type";
import { CashTransactionType } from "@/models/payment.model";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { BottomSheet } from "@expo/ui";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
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

  const isIncome = transactionType === CashTransactionType.INCOME;
  const iconName = isIncome ? IconNames.ARROW_UP : IconNames.ARROW_DOWN;
  const iconBgColor = isIncome ? 'bg-success-100' : 'bg-error-100';
  const iconColor = isIncome ? '#16a34a' : '#dc2626';
  const typeLabel = isIncome ? t('payment.type.INCOME') : t('payment.type.EXPENSE');

  return (
    <BottomSheet
      isPresented={isOpen}
      onDismiss={onClose}
      snapPoints={[{ fraction: 0.7 }]}
    >
      <ScrollView style={{ flex: 1 }}>
        <Box className="px-4 pt-2 pb-6">
          <HStack className="items-center gap-3 mb-4">
            <Box className={`h-10 w-10 items-center justify-center rounded-full ${iconBgColor}`}>
              <CustomIcon name={iconName} size={18} color={iconColor} />
            </Box>
            <Text size="2xl" variant={'bold'}>{typeLabel}</Text>
          </HStack>

          <Divider className="mb-5" />

          <TransactionForm
            cashboxId={cashboxId}
            transactionType={transactionType}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </Box>
      </ScrollView>
    </BottomSheet>
  );
};
