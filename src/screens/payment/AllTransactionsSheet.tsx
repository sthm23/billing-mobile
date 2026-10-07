import {
  Box,
  Card,
  HStack,
  Text
} from "@/components/base";
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
      snapPoints={['half', 'full']}
    >
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text size="xl" variant='bold'>{t('payment.transactions')}</Text>
          <Text size="sm" className="text-typography-500">
            {transactions.length} {t('payment.payments')}
          </Text>
        </View>

        {/* Transactions list */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {transactions.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
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
      </View>
    </BottomSheet>
  );
};
