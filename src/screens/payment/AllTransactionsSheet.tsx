import { Text } from "@/components/base";
import { EmptyState } from "@/components/common";
import { CashboxTransaction } from "@/models/payment.model";
import { Sheet, SheetScrollView } from '@/components/base/Sheet';
import { Receipt } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { TransactionCard } from "./TransactionCard";

type Props = {
  isPresented: boolean;
  onDismiss: () => void;
  transactions: CashboxTransaction[];
};

export const AllTransactionsSheet = ({ isPresented, onDismiss, transactions }: Props) => {
  const { t } = useTranslation();

  return (
    <Sheet isOpen={isPresented} onClose={onDismiss}>
      <View className="flex-1 px-4 pt-2">
        <View className="flex-row items-baseline justify-between pb-2">
          <Text className="type-subhead text-ink">{t('payment.transactions')}</Text>
          <Text className="font-onest text-[13px] text-muted">
            {transactions.length} {t('payment.payments')}
          </Text>
        </View>

        {transactions.length === 0 ? (
          <EmptyState icon={Receipt} message={t('payment.noFound')} />
        ) : (
          <SheetScrollView className="flex-1" contentContainerClassName="pb-6">
            {transactions.map((transaction, index) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                showDivider={index < transactions.length - 1}
                t={t}
              />
            ))}
          </SheetScrollView>
        )}
      </View>
    </Sheet>
  );
};
