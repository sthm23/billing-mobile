import { Button, Chip, IconButton, Money, Text, toast } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { CashboxPickerSheet } from '@/components/cashbox';
import { PAYMENT_METHODS } from '@/components/order';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { useOpenCashboxes } from '@/services/cashbox';
import { usePayoutReturn } from '@/services/order/order.queries';
import { PaymentType } from '@/services/order/order.type';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface RefundPayoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  returnId: string;
  /** What the store owes the customer (`settlement.owedToCustomer`, backend) */
  amount: number;
  customerName?: string;
}

/**
 * «Выдать деньги» for a return paid out later (CREDIT): the whole amount by
 * one method. The money leaves the employee's own open cashbox or a chosen
 * one. The backend checks the amount and the role (OWNER/MANAGER).
 */
export function RefundPayoutSheet({ isOpen, onClose, returnId, amount, customerName }: RefundPayoutSheetProps) {
  const { t } = useTranslation();
  const { data: openCashboxes } = useOpenCashboxes(isOpen);
  const payout = usePayoutReturn();
  const [method, setMethod] = useState<PaymentType>(PaymentType.CASH);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMethod(PaymentType.CASH);
    setError(null);
  }, [isOpen]);

  const send = (cashboxId?: string) => {
    setError(null);
    payout.mutate(
      { returnId, cashboxId, payments: [{ type: method, amount }] },
      {
        onSuccess: () => {
          toast.show(t('orderView.payout.success', { amount: formatMoney(amount) }), 'success');
          onClose();
        },
        onError: (err) => setError(getApiErrorMessage(err, t('orderView.payout.failed'))),
      },
    );
  };

  const submit = () => {
    if (payout.isPending || amount <= 0) return;
    // Own open cashbox — the backend takes it; otherwise ask which one pays
    if (openCashboxes?.some((c) => c.isMine)) send();
    else setPickerOpen(true);
  };

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} size="auto">
        <View className="px-4 pt-1 pb-3 gap-3">
          <View className="flex-row items-start gap-2">
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="type-title text-ink" accessibilityRole="header">{t('orderView.payout.title')}</Text>
              {customerName ? (
                <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>{customerName}</Text>
              ) : null}
            </View>
            <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>

          <View className="flex-row items-center justify-between rounded-md bg-sunken px-4 py-3">
            <Text className="font-onest-semibold text-sm text-soft">{t('orderView.payout.amount')}</Text>
            <Money value={amount} currency={t('common.currency')} className="text-base text-ink" currencyClassName="text-xs text-muted" />
          </View>

          <View className="gap-1.5">
            <Text className="font-onest-semibold text-[13px] text-soft">{t('orderView.payout.method')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <Chip
                  key={m.type}
                  label={t(`sale.pay.method.${m.type}`)}
                  tone="sunken"
                  selected={method === m.type}
                  onPress={() => setMethod(m.type)}
                />
              ))}
            </View>
          </View>

          <Text className="font-onest text-[13px] leading-[19px] text-muted">{t('orderView.payout.note')}</Text>

          {error ? (
            <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
              <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
            </View>
          ) : null}

          <Button variant="accent" size="lg" full loading={payout.isPending} onPress={submit}>
            {t('orderView.payout.submit', { amount: formatMoney(amount) })}
          </Button>
        </View>
      </Sheet>

      <CashboxPickerSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(cashboxId) => {
          setPickerOpen(false);
          send(cashboxId);
        }}
      />
    </>
  );
}
