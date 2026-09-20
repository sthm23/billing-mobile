import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import CustomIcon from "@/icons/custom-icon";
import { IconNames } from "@/icons/icon.type";
import { CashboxStatus, CashTransactionType } from "@/models/payment.model";
import { useCashboxById, useCloseCashbox, useCreateTransaction } from "@/services/cashbox";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView } from "react-native";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { AllTransactionsSheet } from "./AllTransactionsSheet";
import { PaymentBreakdownDialog } from "./PaymentBreakdownDialog";
import { TransactionCard } from "./TransactionCard";

const PREVIEW_COUNT = 5;

export default function CashboxDetailsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<CashTransactionType>(CashTransactionType.INCOME);
  const [allTransactionsVisible, setAllTransactionsVisible] = useState(false);
  const [breakdownVisible, setBreakdownVisible] = useState(false);

  const { data: cashbox, isLoading, isError } = useCashboxById(id, {
    refetchInterval: 30000,
  });
  const closeCashboxMutation = useCloseCashbox();
  const createTransactionMutation = useCreateTransaction();

  const isOpen = cashbox?.status === CashboxStatus.OPEN;

  const handleCloseCashbox = () => {
    Alert.alert(
      t('payment.closeCashboxConfirmation.title'),
      t('payment.closeCashboxConfirmation.message'),
      [
        { text: t('payment.closeCashboxConfirmation.cancelButton'), style: 'cancel' },
        {
          text: t('payment.closeCashboxConfirmation.confirmButton'),
          onPress: () => {
            closeCashboxMutation.mutate(id, {
              onSuccess: () => router.back(),
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

  const createdDate = cashbox
    ? new Date(cashbox.createdAt).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: t('payment.cashbox') }} />
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </Box>
      </>
    );
  }

  if (isError || !cashbox) {
    return (
      <>
        <Stack.Screen options={{ title: t('payment.cashbox') }} />
        <Box className="flex-1 items-center justify-center p-4">
          <Text size="xl" bold className="text-error-600">
            {t('payment.noFound')}
          </Text>
        </Box>
      </>
    );
  }

  const totalIncome = cashbox.transactions
    .filter(tx => tx.type === CashTransactionType.INCOME)
    .reduce((sum, tx) => +sum + +tx.amount, 0);

  const totalExpense = cashbox.transactions
    .filter(tx => tx.type === CashTransactionType.EXPENSE)
    .reduce((sum, tx) => +sum + +tx.amount, 0);

  const sortedTransactions = [...cashbox.transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const previewTransactions = sortedTransactions.slice(0, PREVIEW_COUNT);
  const hasMoreTransactions = sortedTransactions.length > PREVIEW_COUNT;

  return (
    <>
      {/* Override navigation header with cashbox info */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <VStack className="gap-0">
              <Text bold size="lg">{t('payment.cashbox')}</Text>
              <Text size="xs" className="text-typography-500">{createdDate}</Text>
            </VStack>
          ),
          headerRight: () => isOpen ? (
            <Button
              variant="destructive"
              size="sm"
              onPress={handleCloseCashbox}
              disabled={closeCashboxMutation.isPending}
              className="mr-2"
            >
              <ButtonText>{t('payment.closeCashbox')}</ButtonText>
            </Button>
          ) : null,
        }}
      />

      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Balance Card */}
        <Box className="px-4 pt-3 pb-4">
          <Card className="p-5 rounded-2xl bg-surface">
            <VStack className="gap-4">
              {/* Card header: seller+warehouse on left, status badge on right */}
              <HStack className="items-start justify-between">
                <VStack className="gap-1">
                  <HStack className="items-center gap-1.5">
                    <CustomIcon name={IconNames.PERSON} size={14} />
                    <Text size="xs" className="text-typography-500">
                      {cashbox.seller?.user?.fullName ?? t('payment.cashier')}
                    </Text>
                  </HStack>
                  <HStack className="items-center gap-1.5">
                    <CustomIcon name={IconNames.BOX} size={14} />
                    <Text size="xs" className="text-typography-500">
                      {cashbox.warehouse?.name}
                    </Text>
                  </HStack>
                </VStack>
                <Badge
                  action={isOpen ? 'success' : 'muted'}
                  variant="outline"
                  size="sm"
                >
                  <BadgeText>{t(`payment.cashboxStatus.${cashbox.status}`)}</BadgeText>
                </Badge>
              </HStack>

              {/* Tappable balance */}
              <Pressable onPress={() => setBreakdownVisible(true)}>
                <VStack>
                  <Text size="sm" className="text-typography-500">
                    {t('payment.balanceInCashbox')}
                  </Text>
                  <HStack className="items-center gap-2 mt-1">
                    <Text size="3xl" bold>
                      {cashbox.balance.toLocaleString()} UZS
                    </Text>
                    <CustomIcon name={IconNames.ARROW_RIGHT} size={18} />
                  </HStack>
                </VStack>
              </Pressable>

              <Divider />

              {/* Income / Expense summary */}
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
              {isOpen && (
                <HStack className="gap-3">
                  <Button
                    className="flex-1"
                    onPress={handleAddIncome}
                  >
                    <ButtonIcon as={ArrowUpIcon} />
                    <ButtonText>{t('payment.addIncome')}</ButtonText>
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onPress={handleAddExpense}
                  >
                    <ButtonIcon as={ArrowDownIcon} />
                    <ButtonText>{t('payment.addExpense')}</ButtonText>
                  </Button>
                </HStack>
              )}
            </VStack>
          </Card>
        </Box>

        {/* Transactions */}
        <Box className="px-4">
          <HStack className="items-center justify-between mb-3">
            <Text size="xl" bold>{t('payment.transactions')}</Text>
            {hasMoreTransactions && (
              <Button size="sm" variant="outline" onPress={() => setAllTransactionsVisible(true)}>
                <ButtonText>{t('payment.all')}</ButtonText>
              </Button>
            )}
          </HStack>

          {previewTransactions.length === 0 ? (
            <Box className="py-10 items-center">
              <Text className="text-typography-500">{t('payment.noFound')}</Text>
            </Box>
          ) : (
            <Card className="rounded-xl bg-surface overflow-hidden">
              {previewTransactions.map((transaction, index) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  showDivider={index < previewTransactions.length - 1}
                  t={t}
                />
              ))}
            </Card>
          )}
        </Box>
      </ScrollView>

      {/* Payment Breakdown Dialog */}
      <PaymentBreakdownDialog
        isOpen={breakdownVisible}
        onClose={() => setBreakdownVisible(false)}
        transactions={cashbox.transactions}
        balance={cashbox.balance}
      />

      {/* All Transactions Sheet */}
      <AllTransactionsSheet
        isOpen={allTransactionsVisible}
        onClose={() => setAllTransactionsVisible(false)}
        transactions={sortedTransactions}
      />

      {/* Add Transaction Sheet */}
      <AddTransactionSheet
        isOpen={sheetVisible}
        onClose={() => setSheetVisible(false)}
        cashboxId={id}
        transactionType={transactionType}
        onSubmit={handleCreateTransaction}
        isLoading={createTransactionMutation.isPending}
      />
    </>
  );
}
