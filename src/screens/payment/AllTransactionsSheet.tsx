import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Card } from "@/components/ui/card";
import { CashboxTransaction } from "@/models/payment.model";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { TransactionCard } from "./TransactionCard";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  transactions: CashboxTransaction[];
};

export const AllTransactionsSheet = ({ isOpen, onClose, transactions }: Props) => {
  const { t } = useTranslation();

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="max-h-[85vh]">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <Box className="w-full px-4 pt-3 pb-6">
          {/* Header */}
          <HStack className="items-center justify-between mb-4">
            <Text size="xl" bold>{t('payment.transactions')}</Text>
            <Text size="sm" className="text-typography-500">
              {transactions.length} {t('payment.payments')}
            </Text>
          </HStack>

          {/* Transactions list */}
          <ScrollView showsVerticalScrollIndicator={false} className="max-h-[65vh]">
            {transactions.length === 0 ? (
              <Box className="py-10 items-center">
                <Text className="text-typography-500">{t('payment.noFound')}</Text>
              </Box>
            ) : (
              <Card className="rounded-xl bg-surface overflow-hidden">
                {transactions.map((transaction, index) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    showDivider={index < transactions.length - 1}
                    t={t}
                  />
                ))}
              </Card>
            )}
          </ScrollView>

          <Button variant="outline" onPress={onClose} className="mt-4">
            <ButtonText>{t('payment.close')}</ButtonText>
          </Button>
        </Box>
      </ActionsheetContent>
    </Actionsheet>
  );
};
