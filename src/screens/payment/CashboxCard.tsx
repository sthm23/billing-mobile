import { Badge, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { CashboxStatus, Payment } from "@/models/payment.model";
import { TFunction } from "i18next";

type CashboxCardProps = {
  cashbox: Payment;
  onPress: (cashbox: Payment) => void;
  t: TFunction;
};

export const CashboxCard = ({ cashbox, onPress, t }: CashboxCardProps) => {
  const isOpen = cashbox.status === CashboxStatus.OPEN;
  const formattedDate = new Date(cashbox.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const cashierName = cashbox.seller.user.fullName;
  const warehouseName = cashbox.warehouse.name;
  const balance = Number(cashbox.balance);

  return (
    <Pressable
      className="mb-2 rounded-xl border border-border bg-surface p-4"
      onPress={() => onPress(cashbox)}
    >
      <HStack className="items-start justify-between">
        {/* Left side - Info */}
        <VStack className="flex-1 gap-1">
          {/* Cashier Name */}
          <Text size="lg" bold className="text-typography-900">
            {cashierName}
          </Text>

          {/* Warehouse */}
          <Text size="sm" className="text-typography-500">
            {warehouseName}
          </Text>

          {/* Date */}
          <Text size="sm" className="text-typography-500">
            {formattedDate}
          </Text>
        </VStack>

        {/* Right side - Status and Balance */}
        <VStack className="items-end gap-2">
          {/* Status Badge */}
          <Badge
            size="sm"
            variant="solid"
            action={isOpen ? "success" : "error"}
            className="rounded-md"
          >
            <BadgeText className="text-xs">
              {isOpen ? t('payment.cashboxStatus.OPEN') : t('payment.cashboxStatus.CLOSED')}
            </BadgeText>
          </Badge>

          {/* Balance */}
          <Text size="lg" bold className="text-typography-900">
            {balance.toLocaleString()} UZS
          </Text>
        </VStack>
      </HStack>
    </Pressable>
  );
};
