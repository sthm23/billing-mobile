import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";
import {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetRef,
} from "@/components/ui/bottomsheet";
import CustomIcon from "@/icons/custom-icon";
import { IconNames } from "@/icons/icon.type";
import { CashTransactionType } from "@/models/payment.model";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
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
  const sheetRef = useRef<BottomSheetRef>(null);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.open();
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  const isIncome = transactionType === CashTransactionType.INCOME;
  const iconName = isIncome ? IconNames.ARROW_UP : IconNames.ARROW_DOWN;
  const iconBgColor = isIncome ? 'bg-success-100' : 'bg-error-100';
  const iconColor = isIncome ? '#16a34a' : '#dc2626';
  const typeLabel = isIncome ? t('payment.type.INCOME') : t('payment.type.EXPENSE');

  return (
    <BottomSheet ref={sheetRef} onClose={onClose}>
      <BottomSheetPortal
        snapPoints={['85%']}
        backdropComponent={(props) => <BottomSheetBackdrop {...props} />}
      >
        <BottomSheetScrollView>
          <Box className="px-4 pt-2 pb-6">
            <HStack className="items-center gap-3 mb-4">
              <Box className={`h-10 w-10 items-center justify-center rounded-full ${iconBgColor}`}>
                <CustomIcon name={iconName} size={18} color={iconColor} />
              </Box>
              <Text size="2xl" bold>{typeLabel}</Text>
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
        </BottomSheetScrollView>
      </BottomSheetPortal>
    </BottomSheet>
  );
};
