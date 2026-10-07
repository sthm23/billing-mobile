import { Card, Text } from "@/components/base";
import { CashboxTransaction } from "@/models/payment.model";
import { BottomSheet } from '@expo/ui';
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
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
    >
      <ScrollView style={{ width: '100%' }}>
        {/* Header */}
        <View className="flex flex-row justify-between items-center mb-4">
          <Text size="xl" variant='bold'>{t('payment.transactions')}</Text>
          <Text size="sm" className="text-typography-500">
            {transactions.length} {t('payment.payments')}
          </Text>
        </View>

        {/* Transactions list */}
        {transactions.length === 0 ? (
          <View className="py-10 items-center">
            <Text className="text-typography-500">{t('payment.noFound')}</Text>
          </View>
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
    </BottomSheet>
  );
};
