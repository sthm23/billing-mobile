import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import CustomIcon from "@/icons/custom-icon";
import { IconNames } from "@/icons/icon.type";
import { CashboxTransaction, CashTransactionType } from "@/models/payment.model";
import { TFunction } from "i18next";

type Props = {
  transaction: CashboxTransaction;
  showDivider?: boolean;
  t: TFunction;
};

export const TransactionCard = ({ transaction, showDivider = true, t }: Props) => {
  const isIncome = transaction.type === CashTransactionType.INCOME;

  const formattedTime = new Date(transaction.createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const amountColor = isIncome ? 'text-success-600' : 'text-error-600';
  const iconBgColor = isIncome ? 'bg-success-100' : 'bg-error-100';
  const amountSign = isIncome ? '+' : '−';

  return (
    <Box
      className={showDivider ? 'border-b border-border' : undefined}
    >
      <HStack className="items-center py-3 px-4 gap-3">
        {/* Type icon */}
        <Box className={`h-9 w-9 items-center justify-center rounded-full ${iconBgColor}`}>
          <CustomIcon
            name={isIncome ? IconNames.ARROW_UP : IconNames.ARROW_DOWN}
            size={16}
            color={isIncome ? '#16a34a' : '#dc2626'}
          />
        </Box>

        {/* Info */}
        <VStack className="flex-1 gap-0.5">
          <Text size="sm" bold numberOfLines={1}>
            {t(`payment.category.${transaction.category}`)}
          </Text>
          <HStack className="items-center gap-2">
            <Text size="xs" className="text-typography-400">{formattedTime}</Text>
            <Text size="xs" className="text-typography-400">·</Text>
            <Text size="xs" className="text-typography-400">
              {t(`order.paymentMethod.${transaction.paymentType}`)}
            </Text>
          </HStack>
        </VStack>

        {/* Amount */}
        <Text size="md" bold className={amountColor}>
          {amountSign} {(+transaction.amount).toLocaleString()} UZS
        </Text>
      </HStack>
    </Box>
  );
};
