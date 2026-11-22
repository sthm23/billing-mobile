import { Button, IconButton, Money, Text, toast } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { CashboxPickerSheet } from '@/components/cashbox';
import { getApiErrorMessage } from '@/libs/api-error';
import { useCancelCleaning, type RentalCleaning } from '@/services/rental';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { formatLocalDays } from './rental-format';

/** `NO_OPEN_CASHBOX` of billing/src/cashbox/payment-cashbox.ts (no error code there) */
const NO_OPEN_CASHBOX_MESSAGE = 'No open cashbox: open one or choose an open cashbox of the store';

interface CancelCleaningSheetProps {
  cleaning: RentalCleaning | null;
  onClose: () => void;
}

/**
 * Cancel a planned dry cleaning (R13, OWNER/MANAGER, before its first day):
 * the unit is free again and the expense comes back to a cashbox — the one it
 * was paid from while open, otherwise the employee's own (the backend picks).
 */
export function CancelCleaningSheet({ cleaning, onClose }: CancelCleaningSheetProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const cancel = useCancelCleaning();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cleaning) setError(null);
  }, [cleaning]);

  const send = (cashboxId?: string) => {
    if (!cleaning) return;
    setError(null);
    cancel.mutate(
      { id: cleaning.id, cashboxId },
      {
        onSuccess: () => {
          toast.show(t('rental.cleaningCard.cancelled'), 'success');
          onClose();
        },
        onError: (err) => {
          // No open cashbox to take the money back: let the user pick one of the store
          if (!cashboxId && err.response?.status === 400 && err.response.data?.message === NO_OPEN_CASHBOX_MESSAGE) {
            setPickerOpen(true);
            return;
          }
          setError(getApiErrorMessage(err, t('rental.cleaningCard.cancelFailed')));
        },
      },
    );
  };

  return (
    <>
      <Sheet isOpen={!!cleaning} onClose={onClose} size="auto">
        {cleaning ? (
          <View className="px-4 pt-1 pb-3 gap-3">
            <View className="flex-row items-start gap-2">
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="type-title text-ink" accessibilityRole="header">
                  {t('rental.cleaningCard.cancelTitle')}
                </Text>
                <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
                  {cleaning.productName} · {formatLocalDays(cleaning.firstDay, cleaning.lastDay, lang)}
                </Text>
              </View>
              <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
            </View>

            <View className="flex-row items-center justify-between rounded-md bg-sunken px-4 py-3">
              <Text className="font-onest-semibold text-sm text-soft">{t('rental.cleaningCard.refund')}</Text>
              <Money
                value={Number(cleaning.amount)}
                currency={t('common.currency')}
                className="text-base text-ink"
                currencyClassName="text-xs text-muted"
              />
            </View>
            <Text className="font-onest text-[13px] text-muted">{t('rental.cleaningCard.cancelHint')}</Text>

            {error ? (
              <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
                <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
              </View>
            ) : null}

            <Button variant="danger" size="lg" full loading={cancel.isPending} onPress={() => send()}>
              {t('rental.cleaningCard.cancelSubmit')}
            </Button>
          </View>
        ) : null}
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
