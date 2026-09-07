import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { CashTransactionType } from "@/models/payment.model";
import { useCashboxById, useCloseCashbox, useCreateTransaction } from "@/services/cashbox";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView } from "react-native";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { TransactionCard } from "./TransactionCard";

export default function CashboxDetailsPage() {
  const { t } = useTranslation();
  const router = useRouter(); // Keep for back navigation on cashbox close
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<CashTransactionType>(CashTransactionType.INCOME);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const { data: cashbox, isLoading, isError, refetch } = useCashboxById(id, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  const closeCashboxMutation = useCloseCashbox();
  const createTransactionMutation = useCreateTransaction();

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

  const handleCreateTransaction = async (payload: CreateTransactionPayload) => {
    await createTransactionMutation.mutateAsync(payload);
    setSheetVisible(false);
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

  const totalIncome = cashbox.transactions
    .filter(t => t.type === CashTransactionType.INCOME)
    .reduce((sum, t) => +sum + +t.amount, 0);
  const totalExpense = cashbox.transactions
    .filter(t => t.type === CashTransactionType.EXPENSE)
    .reduce((sum, t) => +sum + +t.amount, 0);

  // Sort all transactions by date (newest first)
  const sortedTransactions = [...cashbox.transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Show either first 5 or all transactions based on state
  const displayedTransactions = showAllTransactions
    ? sortedTransactions
    : sortedTransactions.slice(0, 5);

  const hasMoreTransactions = sortedTransactions.length > 5;

  return (
    <ScrollView className="bg-background p-0 mt-0">
      {/* Header */}
      <HStack className="items-center justify-between px-4 py-3 border-b border-border mt-0">
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

      {/* Recent Transactions */}
      <Box className="px-4 pb-4">
        <HStack className="items-center justify-between mb-3">
          <Text size="xl" bold>
            {t('payment.transactions')}
          </Text>
          {hasMoreTransactions && !showAllTransactions && (
            <Button
              size="sm"
              variant="link"
              onPress={() => setShowAllTransactions(true)}
            >
              <ButtonText className="text-primary-600">
                {t('payment.all')}
              </ButtonText>
            </Button>
          )}
        </HStack>

        {displayedTransactions.length === 0 ? (
          <Box className="py-8 items-center">
            <Text className="text-typography-500">
              {t('payment.noFound')}
            </Text>
          </Box>
        ) : (
          <Card className="rounded-xl bg-surface overflow-hidden">
            {displayedTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                t={t}
              />
            ))}
          </Card>
        )}

        {showAllTransactions && hasMoreTransactions && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onPress={() => setShowAllTransactions(false)}
          >
            <ButtonText>{t('order.cancel')}</ButtonText>
          </Button>
        )}
      </Box>

      {/* Add Transaction Sheet */}
      <AddTransactionSheet
        isOpen={sheetVisible}
        onClose={() => setSheetVisible(false)}
        cashboxId={id}
        transactionType={transactionType}
        onSubmit={handleCreateTransaction}
        isLoading={createTransactionMutation.isPending}
      />
    </ScrollView>
  );
}
