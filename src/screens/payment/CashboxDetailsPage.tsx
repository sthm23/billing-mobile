import { Button, HeroCard, IconButton, Text } from "@/components/base";
import { EmptyState, LoadingState } from "@/components/common";
import { CashboxStatus, CashTransactionType } from "@/models/payment.model";
import { useCashboxById, useCloseCashbox, useCreateTransaction } from "@/services/cashbox";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, CircleAlert, Lock, Receipt } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, View } from "react-native";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { AllTransactionsSheet } from "./AllTransactionsSheet";
import { formatDayMonth, formatTime } from '@/libs/date';
import { PaymentMethodTiles } from "./PaymentMethodTiles";
import { TransactionCard } from "./TransactionCard";
import { useRefreshControl } from '@/hooks/use-refresh-control';

const PREVIEW_COUNT = 5;

export default function CashboxDetailsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<CashTransactionType>(CashTransactionType.INCOME);
  const [allTransactionsVisible, setAllTransactionsVisible] = useState(false);

  const { data: cashbox, isLoading, isError, refetch } = useCashboxById(id, {
    // refetchInterval: 30000,
  });
  const refreshControl = useRefreshControl(refetch);
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
          style: 'destructive',
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

  const header = (
    <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" numberOfLines={1} accessibilityRole="header">
          {cashbox ? `${t('payment.cashbox')} · ${cashbox.warehouse?.name ?? ''}` : t('payment.cashbox')}
        </Text>
        {cashbox ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {cashbox.seller?.user?.fullName ?? t('payment.cashier')} ·{' '}
            {new Date(cashbox.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }

  if (isError || !cashbox) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('payment.noFound')} />
      </View>
    );
  }

  const { summary } = cashbox;
  // «16.10 · 09:00 – 19:30»; without a closing time only the start
  const shift = `${formatDayMonth(cashbox.createdAt)} · ${formatTime(cashbox.createdAt)}${
    cashbox.closedAt ? ` – ${formatTime(cashbox.closedAt)}` : ''
  }`;

  const sortedTransactions = [...cashbox.transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const previewTransactions = sortedTransactions.slice(0, PREVIEW_COUNT);
  const hasMoreTransactions = sortedTransactions.length > PREVIEW_COUNT;

  return (
    <View className="flex-1 bg-bg">
      {header}

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 gap-3" refreshControl={refreshControl}>
        <HeroCard
          label={isOpen ? t('payment.balanceInCashbox') : t('payment.shiftTotal')}
          chip={t(`payment.cashboxStatus.${cashbox.status}`)}
          chipTone={isOpen ? 'accent' : 'neutral'}
          amount={cashbox.balance}
          tiles={[
            { label: t('payment.type.INCOME'), value: summary.income, tone: 'accent', signed: true },
            { label: t('payment.type.EXPENSE'), value: -summary.expense, tone: 'err' },
          ]}
        >
          {isOpen ? (
            <View className="flex-row gap-2">
              <Button variant="accent" icon={ArrowDownRight} className="flex-1" onPress={handleAddIncome}>
                {t('payment.type.INCOME')}
              </Button>
              <Button variant="hero" icon={ArrowUpRight} className="flex-1" onPress={handleAddExpense}>
                {t('payment.type.EXPENSE')}
              </Button>
              <IconButton
                icon={Lock}
                variant="danger"
                accessibilityLabel={t('payment.closeCashbox')}
                onPress={handleCloseCashbox}
                disabled={closeCashboxMutation.isPending}
              />
            </View>
          ) : (
            <View className="flex-row items-center justify-between bg-hero-sub rounded-lg px-3.5 py-3">
              <Text className="font-onest text-[13px] text-hero-muted">{t('payment.shift')}</Text>
              <Text className="font-onest-semibold text-[13px] text-hero-ink tabular-nums">{shift}</Text>
            </View>
          )}
        </HeroCard>

        <PaymentMethodTiles byMethod={summary.byMethod} />

        {/* Transactions */}
        <View className="bg-card rounded-xl px-4 pt-3 pb-1">
          <View className="flex-row items-center justify-between pb-1">
            <Text className="type-subhead text-ink">{t('payment.transactions')}</Text>
            {hasMoreTransactions && (
              <Button variant="ghost" size="sm" onPress={() => setAllTransactionsVisible(true)}>
                {t('payment.all')}
              </Button>
            )}
          </View>

          {previewTransactions.length === 0 ? (
            <EmptyState icon={Receipt} message={t('payment.noFound')} className="py-6" />
          ) : (
            previewTransactions.map((transaction, index) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                showDivider={index < previewTransactions.length - 1}
                t={t}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* All Transactions Sheet */}
      <AllTransactionsSheet
        isPresented={allTransactionsVisible}
        onDismiss={() => setAllTransactionsVisible(false)}
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
    </View>
  );
}
