import { Button, Chip, IconButton, Text, toast } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { getApiErrorMessage } from '@/libs/api-error';
import { cn } from '@/libs/utils';
import {
  STAFF_DEACTIVATION_REASONS,
  useDeactivateStaff,
  type StaffDeactivationReason,
  type StaffDetails,
} from '@/services/store';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { roleLabel, warehousesLabel } from './staff-format';

interface DeactivateStaffSheetProps {
  staff: StaffDetails;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * «Деактивировать» (design «Деактивировать — шит»): what happens, a reason,
 * confirm. The backend closes the login and ends every session at once.
 */
export function DeactivateStaffSheet({ staff, isOpen, onClose }: DeactivateStaffSheetProps) {
  const { t } = useTranslation();
  const deactivate = useDeactivateStaff();
  const [reason, setReason] = useState<StaffDeactivationReason>('LEFT');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setReason('LEFT');
    setError(null);
  }, [isOpen]);

  const effects = [
    { sign: '×', text: t('staff.deactivate.effectLogin'), tone: 'bg-err-bg', ink: 'text-err-fg' },
    { sign: '✓', text: t('staff.deactivate.effectHistory'), tone: 'bg-ok-bg', ink: 'text-ok-fg' },
    { sign: '↺', text: t('staff.deactivate.effectRestore'), tone: 'bg-sunken', ink: 'text-soft' },
  ];

  const submit = () => {
    setError(null);
    deactivate.mutate(
      { id: staff.id, reason },
      {
        onSuccess: () => {
          toast.show(t('staff.deactivate.done'));
          onClose();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('staff.deactivate.failed'))),
      }
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <View className="flex-row items-start gap-2">
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="type-title text-ink" accessibilityRole="header">{t('staff.deactivate.title')}</Text>
            <Text className="font-onest text-[13px] text-muted" numberOfLines={2}>
              {staff.fullName} · {roleLabel(staff.role, t)} · {warehousesLabel(staff, t)}
            </Text>
          </View>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        <View className="gap-2.5">
          {effects.map((effect) => (
            <View key={effect.sign} className="flex-row items-start gap-2.5">
              <View className={cn('w-[22px] h-[22px] rounded-full items-center justify-center', effect.tone)}>
                <Text className={cn('font-onest-bold text-xs', effect.ink)}>{effect.sign}</Text>
              </View>
              <Text className="flex-1 font-onest text-sm leading-5 text-ink">{effect.text}</Text>
            </View>
          ))}
        </View>

        <View className="gap-2">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('staff.deactivate.reason')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {STAFF_DEACTIVATION_REASONS.map((r) => (
              <Chip
                key={r}
                label={t(`staff.reason.${r}`)}
                tone="sunken"
                selected={reason === r}
                onPress={() => setReason(r)}
              />
            ))}
          </View>
        </View>

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-2 pt-1">
          <View className="flex-1">
            <Button variant="secondary" size="lg" full onPress={onClose}>
              {t('staff.deactivate.cancel')}
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="danger" size="lg" full loading={deactivate.isPending} onPress={submit}>
              {t('staff.deactivate.submit')}
            </Button>
          </View>
        </View>
      </View>
    </Sheet>
  );
}
