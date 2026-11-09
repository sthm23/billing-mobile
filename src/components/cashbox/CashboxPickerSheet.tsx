import { Button, IconButton, ListCard, Spinner, Text, toast } from '@/components/base';
import { Sheet, SheetScrollView } from '@/components/base/Sheet';
import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatTime } from '@/libs/date';
import { useOpenCashbox, useOpenCashboxes } from '@/services/cashbox';
import { Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface CashboxPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * `undefined` — the employee's own cashbox was just opened (the backend
   * picks it); an id — an open cashbox of the store chosen from the list.
   */
  onPick: (cashboxId: string | undefined) => void;
}

/**
 * «Куда принять деньги» — shown when the employee has no open cashbox:
 * open their own (on the working warehouse) or choose any open cashbox of
 * the store.
 */
export function CashboxPickerSheet({ isOpen, onClose, onPick }: CashboxPickerSheetProps) {
  const { t } = useTranslation();
  // The own cashbox opens on the working warehouse (Profile → «Рабочий склад»)
  const { warehouseId } = useWorkingWarehouse();
  const { data: cashboxes, isLoading } = useOpenCashboxes(isOpen);
  const openCashbox = useOpenCashbox();

  const others = (cashboxes ?? []).filter((c) => !c.isMine);

  const openOwn = () => {
    if (!warehouseId) return;
    openCashbox.mutate(
      { warehouseId },
      {
        onSuccess: () => {
          toast.show(t('debtors.cashbox.opened'));
          onPick(undefined);
        },
        onError: (err) => toast.show(getApiErrorMessage(err, t('debtors.cashbox.openFailed')), 'error'),
      }
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="half">
      <View className="flex-row items-center justify-between gap-3 px-4 pt-2 pb-2">
        <Text className="flex-1 type-title text-ink" accessibilityRole="header">{t('debtors.cashbox.title')}</Text>
        <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
      </View>
      <SheetScrollView className="flex-1" contentContainerClassName="px-4 pb-6 gap-3">
        <Text className="font-onest text-[13px] leading-[19px] text-muted">{t('debtors.cashbox.text')}</Text>

        <Button
          variant="accent"
          size="lg"
          icon={Plus}
          full
          onPress={openOwn}
          disabled={!warehouseId}
          loading={openCashbox.isPending}
        >
          {t('debtors.cashbox.open')}
        </Button>

        <Text className="type-label text-muted px-1 pt-2">{t('debtors.cashbox.others')}</Text>
        {isLoading ? (
          <Spinner size="sm" className="py-4" />
        ) : others.length === 0 ? (
          <Text className="font-onest text-[13px] text-muted text-center py-4">{t('debtors.cashbox.none')}</Text>
        ) : (
          others.map((c) => (
            <ListCard
              key={c.id}
              lead={c.seller.fullName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join('')}
              title={c.seller.fullName}
              subtitle={t('debtors.cashbox.since', { warehouse: c.warehouse.name, time: formatTime(c.createdAt) })}
              amount={c.balance}
              disabled={openCashbox.isPending}
              onPress={() => onPick(c.id)}
              className="bg-sunken"
            />
          ))
        )}
      </SheetScrollView>
    </Sheet>
  );
}
