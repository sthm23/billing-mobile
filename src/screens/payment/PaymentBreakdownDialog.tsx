import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import CustomIcon from "@/icons/custom-icon";
import { IconNames } from "@/icons/icon.type";
import { PaymentType } from "@/models/order.model";
import { CashboxTransaction } from "@/models/payment.model";
import { useTranslation } from "react-i18next";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  transactions: CashboxTransaction[];
  balance: number;
};

const PAYMENT_TYPE_ICON: Record<PaymentType, IconNames> = {
  [PaymentType.CASH]: IconNames.MONEY,
  [PaymentType.CARD]: IconNames.CREDIT_CARD,
  [PaymentType.ONLINE]: IconNames.ONLINE_PAYMENT,
  [PaymentType.TRANSFER]: IconNames.TRANSFER,
};

export const PaymentBreakdownDialog = ({ isOpen, onClose, transactions, balance }: Props) => {
  const { t } = useTranslation();

  const totalByType = (type: PaymentType) =>
    transactions
      .filter(tx => tx.paymentType === type)
      .reduce((sum, tx) => sum + +tx.amount, 0);

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} size="lg">
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Text size="xl" bold>{t('payment.paymentBreakdown')}</Text>
        </AlertDialogHeader>

        <AlertDialogBody>
          <VStack className="gap-4 py-2">
            {Object.values(PaymentType).map((type) => (
              <HStack key={type} className="items-center justify-between">
                <HStack className="items-center gap-3">
                  <CustomIcon name={PAYMENT_TYPE_ICON[type]} size={20} />
                  <Text size="md">{t(`order.paymentMethod.${type}`)}</Text>
                </HStack>
                <Text size="md" bold>
                  {totalByType(type).toLocaleString()} UZS
                </Text>
              </HStack>
            ))}

            <Divider />

            <HStack className="items-center justify-between">
              <Text size="md" bold>{t('payment.total')}</Text>
              <Text size="lg" bold className="text-primary-600">
                {balance.toLocaleString()} UZS
              </Text>
            </HStack>
          </VStack>
        </AlertDialogBody>

        <AlertDialogFooter>
          <Button onPress={onClose} className="flex-1">
            <ButtonText>{t('payment.close')}</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
