import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon, ArrowUpIcon, ArrowDownIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { CashboxTransaction, CashTransactionType } from "@/models/payment.model";
import { TFunction } from "i18next";

type TransactionCardProps = {
  transaction: CashboxTransaction;
  t: TFunction;
};

export const TransactionCard = ({ transaction, t }: TransactionCardProps) => {
  const isIncome = transaction.type === CashTransactionType.INCOME;
  const formattedTime = new Date(transaction.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const categoryLabel = t(`payment.category.${transaction.category}`);
  const amountColor = isIncome ? 'text-success-600' : 'text-error-600';
  const iconBgColor = isIncome ? 'bg-success-100' : 'bg-error-100';
  const iconColor = isIncome ? 'text-success-600' : 'text-error-600';
  const amountSign = isIncome ? '+' : '-';

  return (
    <HStack className="items-center justify-between py-3 px-4 border-b border-border">
      {/* Icon */}
      <Box className={`h-10 w-10 items-center justify-center rounded-full ${iconBgColor}`}>
        <Icon
          as={isIncome ? ArrowUpIcon : ArrowDownIcon}
          size="lg"
          className={iconColor}
        />
      </Box>

      {/* Transaction Info */}
      <VStack className="flex-1 ml-3">
        <Text size="md" bold>
          {categoryLabel}
        </Text>
        <Text size="sm" className="text-typography-500">
          {formattedTime}
        </Text>
      </VStack>

      {/* Amount */}
      <Text size="lg" bold className={amountColor}>
        {amountSign} {transaction.amount.toLocaleString()} UZS
      </Text>
    </HStack>
  );
};
