import { Button, Chip, IconButton, Money, Text, toast } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { CashboxPickerSheet } from '@/components/cashbox';
import { digitsOf, PAYMENT_METHODS } from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { useOpenCashboxes } from '@/services/cashbox';
import { PaymentType } from '@/services/order/order.type';
import { useCancelRental, type RentalDetail } from '@/services/rental';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { formatDay } from './rental-format';

interface CancelRentalSheetProps {
  rental: RentalDetail;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * «Отменить бронь» (design «Аренда · отмена», OWNER/MANAGER — the backend
 * checks it): part of the prepayment back to the customer (0 … paid), the
 * method, a reason. The rest stays in the cashbox as income.
 */
export function CancelRentalSheet({ rental, isOpen, onClose }: CancelRentalSheetProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const { data: openCashboxes } = useOpenCashboxes();
  const cancel = useCancelRental();

  const [refund, setRefund] = useState('');
  const [method, setMethod] = useState<PaymentType>(PaymentType.CASH);
  const [reason, setReason] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRefund('');
    setMethod(PaymentType.CASH);
    setReason('');
    setError(null);
  }, [isOpen]);

  const paid = Math.max(Number(rental.order.paidAmount), 0);
  const refundValue = digitsOf(refund);
  const tooMuch = refundValue > paid;
  const kept = paid - refundValue;

  const presets = [
    { key: 'all', label: t('rental.cancel.all'), value: paid },
    { key: 'half', label: t('rental.cancel.half'), value: Math.round(paid / 2) },
    { key: 'zero', label: '0', value: 0 },
  ];

  const send = (cashboxId?: string) => {
    setError(null);
    cancel.mutate(
      {
        id: rental.id,
        body: {
          refundAmount: refundValue,
          refundPaymentType: refundValue > 0 ? method : undefined,
          reason: reason.trim() || undefined,
          cashboxId,
        },
      },
      {
        onSuccess: () => {
          toast.show(t('rental.cancel.success'), 'success');
          onClose();
        },
        onError: (err) => setError(getApiErrorMessage(err, t('rental.cancel.failed'))),
      },
    );
  };

  const submit = () => {
    if (tooMuch || cancel.isPending) return;
    // Money back needs a cashbox: the own open one (the backend takes it) or a chosen one
    if (refundValue > 0 && !openCashboxes?.some((c) => c.isMine)) setPickerOpen(true);
    else send();
  };

  const customerName = rental.order.customer?.user.fullName ?? t('rental.noCustomer');

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} size="auto">
        <View className="px-4 pt-1 pb-3 gap-3">
          <View className="flex-row items-start gap-2">
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="type-title text-ink" accessibilityRole="header">
                {t('rental.cancel.title', { code: rental.code })}
              </Text>
              <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
                {customerName} · {formatDay(rental.startDate, lang)} – {formatDay(rental.endDate, lang)}
              </Text>
            </View>
            <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>

          <View className="flex-row items-center justify-between rounded-md bg-sunken px-4 py-3">
            <Text className="font-onest-semibold text-sm text-soft">{t('rental.cancel.paid')}</Text>
            <Money value={paid} currency={t('common.currency')} className="text-base text-ink" currencyClassName="text-xs text-muted" />
          </View>

          {paid > 0 ? (
            <>
              <View className="gap-1.5">
                <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.cancel.refund')}</Text>
                <View
                  className={cn(
                    'flex-row items-center h-[52px] px-4 rounded-2xl bg-sunken gap-2',
                    tooMuch && 'border-[1.5px] border-err-fg',
                  )}
                >
                  <SheetTextInput
                    value={refund}
                    onChangeText={(text) => {
                      const n = digitsOf(text);
                      setRefund(text.trim() === '' ? '' : formatMoney(n));
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    accessibilityLabel={t('rental.cancel.refund')}
                    className="flex-1 min-w-0 font-onest-bold text-lg text-ink tabular-nums"
                  />
                  <Text className="font-onest text-sm text-muted">{t('common.currency')}</Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                {presets.map((preset) => (
                  <Chip
                    key={preset.key}
                    label={preset.label}
                    tone="sunken"
                    selected={refund !== '' && refundValue === preset.value}
                    onPress={() => setRefund(formatMoney(preset.value))}
                  />
                ))}
              </View>
              {refundValue > 0 ? (
                <View className="gap-1.5">
                  <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.cancel.method')}</Text>
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
              ) : null}
            </>
          ) : null}

          <View className="gap-1.5">
            <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.cancel.reason')}</Text>
            <SheetTextInput
              value={reason}
              onChangeText={setReason}
              placeholder={t('rental.cancel.reasonPlaceholder')}
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              className="min-h-[76px] px-4 py-3 rounded-2xl bg-sunken font-onest text-base text-ink"
            />
          </View>

          {error ? (
            <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
              <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
            </View>
          ) : null}

          <View className="gap-2 pt-1">
            <Button variant="danger" size="lg" full disabled={tooMuch} loading={cancel.isPending} onPress={submit}>
              {t('rental.cancel.submit')}
            </Button>
            {paid > 0 ? (
              <Text className={cn('font-onest text-[13px] text-center', tooMuch ? 'text-err-fg' : 'text-muted')}>
                {tooMuch
                  ? t('rental.cancel.tooMuch', { amount: formatMoney(paid) })
                  : kept > 0
                    ? t('rental.cancel.kept', { amount: formatMoney(kept) })
                    : t('rental.cancel.allBack')}
              </Text>
            ) : null}
          </View>
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
