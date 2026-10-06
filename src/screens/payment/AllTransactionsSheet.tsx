import {
  Box,
  Card,
  HStack,
  Text
} from "@/components/base";
import { CashboxTransaction } from "@/models/payment.model";
import { BottomSheet } from '@expo/ui';
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { TransactionCard } from "./TransactionCard";

type Props = {
  isPresented: boolean;
  onDismiss: () => void;
  transactions: CashboxTransaction[];
};

export const AllTransactionsSheet = ({ isPresented, onDismiss, transactions }: Props) => {
  const { t } = useTranslation();

  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={[{ fraction: 0.5 }, { fraction: 0.9 }]}
    >
      <ScrollView style={{ flex: 1 }}>
        <Box className="w-full px-4 pt-3 pb-6">
          {/* Header */}
          <HStack className="items-center justify-between mb-4">
            <Text size="xl" variant='bold'>{t('payment.transactions')}</Text>
            <Text size="sm" className="text-typography-500">
              {transactions.length} {t('payment.payments')}
            </Text>
          </HStack>

          {/* Transactions list */}
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
        </Box>
      </ScrollView>
    </BottomSheet>
  );
};
