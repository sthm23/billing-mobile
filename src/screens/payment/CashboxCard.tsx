import { Box } from "@/components/ui/box";
import { Badge, BadgeText } from "@/components/ui/badge";
import { ChevronRightIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Payment, CashboxStatus } from "@/models/payment.model";
import { TFunction } from "i18next";

type CashboxCardProps = {
  cashbox: Payment;
  onPress: (cashbox: Payment) => void;
  t: TFunction;
};

export const CashboxCard = ({ cashbox, onPress, t }: CashboxCardProps) => {
  const isOpen = cashbox.status === CashboxStatus.OPEN;
  const formattedDate = new Date(cashbox.createdAt).toLocaleString();
  const cashierName = `${cashbox.seller.user.name} ${cashbox.seller.user.lastname}`;

  return (
    <Pressable
      className="mb-3 rounded-lg border border-border bg-surface p-4"
      onPress={() => onPress(cashbox)}
    >
      <HStack className="items-center justify-between">
        <VStack className="flex-1 gap-2">
          {/* Status Badge */}
          <HStack className="items-center gap-2">
            <Badge
              size="sm"
              variant="solid"
              action={isOpen ? "success" : "muted"}
              className="rounded-md"
            >
              <BadgeText>
                {t(`payment.cashboxStatus.${cashbox.status}`)}
              </BadgeText>
            </Badge>
            <Text size="sm" className="text-typography-500">
              {formattedDate}
            </Text>
          </HStack>

          {/* Cashier */}
          <HStack className="items-center gap-1">
            <Text size="sm" className="text-typography-600">
              {t('payment.cashier')}:
            </Text>
            <Text size="sm" bold>
              {cashierName}
            </Text>
          </HStack>

          {/* Warehouse */}
          <HStack className="items-center gap-1">
            <Text size="sm" className="text-typography-600">
              {t('payment.warehouse')}:
            </Text>
            <Text size="sm" bold>
              {cashbox.warehouse.name}
            </Text>
          </HStack>

          {/* Balance */}
          <HStack className="items-center gap-1">
            <Text size="sm" className="text-typography-600">
              {t('payment.total')}:
            </Text>
            <Text size="lg" bold className="text-success-600">
              {cashbox.balance.toLocaleString()} UZS
            </Text>
          </HStack>
        </VStack>

        {/* Chevron Icon */}
        <Box className="ml-2">
          <Icon as={ChevronRightIcon} size="xl" className="text-typography-400" />
        </Box>
      </HStack>
    </Pressable>
  );
};
