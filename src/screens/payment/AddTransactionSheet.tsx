import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Badge, BadgeText } from "@/components/ui/badge";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { CashTransactionType } from "@/models/payment.model";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { useTranslation } from "react-i18next";
import { TransactionForm } from "./TransactionForm";

type AddTransactionSheetProps = {
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
}: AddTransactionSheetProps) => {
  const { t } = useTranslation();

  const isIncome = transactionType === CashTransactionType.INCOME;
  const badgeAction = isIncome ? "success" : "error";
  const badgeText = isIncome ? t('payment.type.INCOME') : t('payment.type.EXPENSE');

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="max-h-[85vh]">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <Box className="w-full px-4 py-5">
          {/* Header */}
          <HStack className="items-center justify-between mb-6">
            <Text size="2xl" bold>
              {t('payment.paymentDetails')}
            </Text>
            <Badge action={badgeAction} variant="solid" size="md">
              <BadgeText>{badgeText}</BadgeText>
            </Badge>
          </HStack>

          {/* Transaction Form */}
          <TransactionForm
            cashboxId={cashboxId}
            transactionType={transactionType}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </Box>
      </ActionsheetContent>
    </Actionsheet>
  );
};
