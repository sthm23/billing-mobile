import {
  Box,
  Card,
  HStack,
  Text
} from "@/components/base";
import { CashboxTransaction } from "@/models/payment.model";
import BottomSheet, { BottomSheetMethods, BottomSheetScrollView, BottomSheetView } from '@expo/ui/community/bottom-sheet';
import { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { TransactionCard } from "./TransactionCard";

type Props = {
  sheetRef: RefObject<BottomSheetMethods | null>;
  transactions: CashboxTransaction[];
};

export const AllTransactionsSheet = ({ sheetRef, transactions }: Props) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#18181b' : '#ffffff';
  return (

    <BottomSheet
      backgroundStyle={{ backgroundColor }}
      ref={sheetRef}
      snapPoints={['50%', '90%']}
      index={-1}
      enablePanDownToClose
    >
      <BottomSheetView>
        <Box className="w-full px-4 pt-3 pb-6">
          {/* Header */}
          <HStack className="items-center justify-between mb-4">
            <Text size="xl" variant='bold'>{t('payment.transactions')}</Text>
            <Text size="sm" className="text-typography-500">
              {transactions.length} {t('payment.payments')}
            </Text>
          </HStack>

          {/* Transactions list */}
          <BottomSheetScrollView  >
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
          </BottomSheetScrollView>
        </Box>
      </BottomSheetView>
    </BottomSheet>
  );
};
