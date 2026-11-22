import { Button, IconButton, Text } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { digitsOf } from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export interface ServiceDraft {
  name: string;
  price: number;
  description: string;
}

interface ServiceSheetProps {
  isOpen: boolean;
  /** Service being edited; null — a new one */
  value: ServiceDraft | null;
  onClose: () => void;
  onSave: (service: ServiceDraft) => void;
  onRemove?: () => void;
}

/** A service of the booking (makeup, bouquet…): name, price, note */
export function ServiceSheet({ isOpen, value, onClose, onSave, onRemove }: ServiceSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(value?.name ?? '');
    setPrice(value && value.price > 0 ? formatMoney(value.price) : '');
    setDescription(value?.description ?? '');
  }, [isOpen, value]);

  const valid = name.trim().length > 0;
  const inputClass = 'h-[52px] px-4 rounded-2xl bg-sunken font-onest text-base text-ink';

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">
            {value ? t('rental.service.editTitle') : t('rental.service.newTitle')}
          </Text>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>
        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.service.name')}</Text>
          <SheetTextInput
            value={name}
            onChangeText={setName}
            placeholder={t('rental.service.namePlaceholder')}
            placeholderTextColor={colors.muted}
            className={inputClass}
          />
        </View>
        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.service.price')}</Text>
          <View className="flex-row items-center h-[52px] px-4 rounded-2xl bg-sunken gap-2">
            <SheetTextInput
              value={price}
              onChangeText={(text) => {
                const n = digitsOf(text);
                setPrice(n > 0 ? formatMoney(n) : '');
              }}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
              className="flex-1 min-w-0 font-onest-bold text-base text-ink tabular-nums"
            />
            <Text className="font-onest text-sm text-muted">{t('common.currency')}</Text>
          </View>
        </View>
        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.service.description')}</Text>
          <SheetTextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('rental.service.descriptionPlaceholder')}
            placeholderTextColor={colors.muted}
            className={inputClass}
          />
        </View>
        <View className="flex-row gap-2.5 pt-1">
          {onRemove ? (
            <IconButton icon={Trash2} variant="danger" size="lg" accessibilityLabel={t('rental.service.remove')} onPress={onRemove} />
          ) : null}
          <Button
            variant="accent"
            size="lg"
            className="flex-1"
            disabled={!valid}
            onPress={() => onSave({ name: name.trim(), price: digitsOf(price), description: description.trim() })}
          >
            {t('rental.service.save')}
          </Button>
        </View>
      </View>
    </Sheet>
  );
}
