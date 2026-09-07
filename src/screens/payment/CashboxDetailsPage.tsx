import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import { useCashboxById, useCloseCashbox } from "@/services/cashbox";
import { CashTransactionType } from "@/models/payment.model";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, ActivityIndicator, Alert } from "react-native";
import { TransactionCard } from "./TransactionCard";

export default function CashboxDetailsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<CashTransactionType | null>(null);

  const { data: cashbox, isLoading, isError, refetch } = useCashboxById(id, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  const closeCashboxMutation = useCloseCashbox();

  const handleCloseCashbox = () => {
    Alert.alert(
      t('payment.closeCashboxConfirmation.title'),
      t('payment.closeCashboxConfirmation.message'),
      [
        {
          text: t('payment.closeCashboxConfirmation.cancelButton'),
          style: 'cancel',
        },
        {
          text: t('payment.closeCashboxConfirmation.confirmButton'),
          onPress: () => {
            closeCashboxMutation.mutate(id, {
              onSuccess: () => {
                router.back();
              },
            });
          },
        },
      ]
    );
  };

  const handleAddIncome = () => {
    setTransactionType(CashTransactionType.INCOME);
    setSheetVisible(true);
  };

  const handleAddExpense = () => {
    setTransactionType(CashTransactionType.EXPENSE);
    setSheetVisible(true);
  };

  const handleViewAll = () => {
    router.push(`/(tabs)/(payments)/${id}/transactions`);
  };

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </Box>
    );
  }

  if (isError || !cashbox) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <Text size="xl" bold className="text-error-600">
          {t('payment.noFound')}
        </Text>
      </Box>
    );
  }

  const totalIncome = cashbox.totalIncome || 0;
  const totalExpense = cashbox.totalExpense || 0;
  const todayTransactions = cashbox.transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.createdAt).toDateString();
    const today = new Date().toDateString();
    return transactionDate === today;
  });

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <HStack className="items-center justify-between px-4 py-3 border-b border-border">
        <Text size="2xl" bold>
          {t('payment.cashbox')}
        </Text>
        {cashbox.status === 'OPEN' && (
          <Button
            size="sm"
            action="negative"
            onPress={handleCloseCashbox}
            disabled={closeCashboxMutation.isPending}
          >
            <ButtonText>{t('payment.closeCashbox')}</ButtonText>
          </Button>
        )}
      </HStack>

      {/* Balance Card */}
      <Box className="p-4">
        <Card className="p-5 rounded-2xl bg-surface">
          <VStack className="gap-4">
            {/* Total Balance */}
            <VStack>
              <Text size="sm" className="text-typography-500">
                {t('payment.balanceInCashbox')}
              </Text>
              <Text size="3xl" bold className="mt-1">
                {cashbox.balance.toLocaleString()} UZS
              </Text>
            </VStack>

            {/* Income and Expense */}
            <HStack className="justify-between">
              <VStack>
                <Text size="sm" className="text-typography-500">
                  {t('payment.totalIncome')}
                </Text>
                <Text size="lg" bold className="text-success-600 mt-1">
                  + {totalIncome.toLocaleString()} UZS
                </Text>
              </VStack>
              <VStack className="items-end">
                <Text size="sm" className="text-typography-500">
                  {t('payment.totalExpense')}
                </Text>
                <Text size="lg" bold className="text-error-600 mt-1">
                  - {totalExpense.toLocaleString()} UZS
                </Text>
              </VStack>
            </HStack>

            {/* Action Buttons */}
            <HStack className="gap-3 mt-2">
              <Button
                className="flex-1"
                action="positive"
                onPress={handleAddIncome}
              >
                <ButtonText>{t('payment.addIncome')}</ButtonText>
              </Button>
              <Button
                className="flex-1"
                action="negative"
                onPress={handleAddExpense}
              >
                <ButtonText>{t('payment.addExpense')}</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </Card>
      </Box>

      {/* Transactions Today */}
      <Box className="px-4 pb-4">
        <HStack className="items-center justify-between mb-3">
          <Text size="xl" bold>
            {t('payment.paymentsToday')}
          </Text>
          {todayTransactions.length > 0 && (
            <Button size="sm" variant="link" onPress={handleViewAll}>
              <ButtonText className="text-primary-600">
                {t('payment.all')}
              </ButtonText>
            </Button>
          )}
        </HStack>

        {todayTransactions.length === 0 ? (
          <Box className="py-8 items-center">
            <Text className="text-typography-500">
              {t('payment.noFound')}
            </Text>
          </Box>
        ) : (
          <Card className="rounded-xl bg-surface overflow-hidden">
            {todayTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                t={t}
              />
            ))}
          </Card>
        )}
      </Box>

      {/* TODO: Add AddTransactionSheet component */}
    </ScrollView>
  );
}
