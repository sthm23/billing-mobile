import { Button, Chip, IconButton, ListCard, Spinner, Text, toast } from '@/components/base';
import { Sheet, SheetScrollView } from '@/components/base/Sheet';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatTime } from '@/libs/date';
import { useStaffWarehouses } from '@/screens/order/cart/use-staff-warehouses';
import { useOpenCashbox, useOpenCashboxes } from '@/services/cashbox';
import { Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
 * open their own (on one of their warehouses) or choose any open cashbox of
 * the store.
 */
export function CashboxPickerSheet({ isOpen, onClose, onPick }: CashboxPickerSheetProps) {
  const { t } = useTranslation();
  const warehouses = useStaffWarehouses();
  const { data: cashboxes, isLoading } = useOpenCashboxes(isOpen);
  const openCashbox = useOpenCashbox();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  useEffect(() => {
    if (isOpen) setWarehouseId(warehouses.length === 1 ? warehouses[0].id : undefined);
  }, [isOpen, warehouses]);

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

        {warehouses.length > 1 && (
          <View className="gap-2">
            <Text className="type-label text-muted px-1">{t('debtors.cashbox.chooseWarehouse')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {warehouses.map((w) => (
                <Chip
                  key={w.id}
                  label={w.name}
                  tone="sunken"
                  selected={w.id === warehouseId}
                  onPress={() => setWarehouseId(w.id)}
                />
              ))}
            </View>
          </View>
        )}
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
