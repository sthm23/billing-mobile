import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  Button,
  ButtonText,
  Divider,
  HStack,
  Text,
  VStack,
} from "@/components/base";
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
          <Text size="xl" variant='bold'>{t('payment.paymentBreakdown')}</Text>
        </AlertDialogHeader>

        <AlertDialogBody>
          <VStack className="gap-4 py-2">
            {Object.values(PaymentType).map((type) => (
              <HStack key={type} className="items-center justify-between">
                <HStack className="items-center gap-3">
                  <CustomIcon name={PAYMENT_TYPE_ICON[type]} size={20} />
                  <Text size="md">{t(`order.paymentMethod.${type}`)}</Text>
                </HStack>
                <Text size="md" variant='bold'>
                  {totalByType(type).toLocaleString()} {t('common.currency')}
                </Text>
              </HStack>
            ))}

            <Divider />

            <HStack className="items-center justify-between">
              <Text size="md" variant='bold'>{t('payment.total')}</Text>
              <Text size="lg" variant='bold' className="text-primary-600">
                {balance.toLocaleString()} {t('common.currency')}
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
