import { Button, Chip, IconButton, Text, toast } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { useRejectOnlineOrder } from '@/services/telegram-shop';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** Same limit as the backend (`RejectOnlineOrderDto`). */
const MAX_REASON = 300;

interface RejectOnlineOrderSheetProps {
  id: string;
  number: number;
  isOpen: boolean;
  onClose: () => void;
  /** After a successful rejection (the list and the card are already refreshed) */
  onDone: () => void;
}

/**
 * «Отклонить заявку»: an optional reason that goes into the customer's Telegram message.
 * The customer is told by the backend; `customerNotified: false` is shown to the employee.
 */
export function RejectOnlineOrderSheet({ id, number, isOpen, onClose, onDone }: RejectOnlineOrderSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const reject = useRejectOnlineOrder();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setError(null);
  }, [isOpen]);

  const submit = () => {
    setError(null);
    reject.mutate(
      { id, reason: reason.trim() || undefined },
      {
        onSuccess: (result) => {
          toast.show(result.customerNotified ? t('onlineOrders.rejected') : t('onlineOrders.rejectedNotNotified'));
          onClose();
          onDone();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('onlineOrders.rejectFailed'))),
      }
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <View className="flex-row items-start gap-2">
          <View className="flex-1 min-w-0 gap-1">
            <Text className="type-title text-ink" accessibilityRole="header">
              {t('onlineOrders.rejectTitle', { number })}
            </Text>
            <Text className="font-onest text-sm leading-5 text-muted">{t('onlineOrders.rejectText')}</Text>
          </View>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        <View className="gap-2">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('onlineOrders.rejectReason')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {(['reasonNoStock', 'reasonNoAnswer'] as const).map((key) => (
              <Chip
                key={key}
                label={t(`onlineOrders.${key}`)}
                tone="sunken"
                selected={reason === t(`onlineOrders.${key}`)}
                onPress={() => setReason(t(`onlineOrders.${key}`))}
              />
            ))}
          </View>
          <SheetTextInput
            value={reason}
            onChangeText={(text) => setReason(text.slice(0, MAX_REASON))}
            placeholder={t('onlineOrders.rejectReasonPlaceholder')}
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            accessibilityLabel={t('onlineOrders.rejectReason')}
            className="min-h-[76px] px-4 py-3 rounded-2xl bg-sunken font-onest text-base text-ink"
          />
        </View>

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-2 pt-1">
          <View className="flex-1">
            <Button variant="secondary" size="lg" full onPress={onClose} disabled={reject.isPending}>
              {t('common.cancel')}
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="danger" size="lg" full loading={reject.isPending} onPress={submit}>
              {t('onlineOrders.rejectConfirm')}
            </Button>
          </View>
        </View>
      </View>
    </Sheet>
  );
}
