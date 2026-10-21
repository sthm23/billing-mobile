import { Button, IconButton, Pressable, SearchField, Text } from '@/components/base';
import { EmptyState } from '@/components/common';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { cn } from '@/libs/utils';
import { type OrderCustomer, useCreateCustomer, useCustomerSearch } from '@/services/customer';
import { Sheet, SheetFlatList, SheetTextInput } from '@/components/base/Sheet';
import { Check, UserPlus, UserRound, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

const PHONE_PREFIX = '+998';
const PHONE_DIGITS = 9;

interface CustomerPickerSheetProps {
  isOpen: boolean;
  selectedId?: string | null;
  onClose: () => void;
  onSelect: (customer: OrderCustomer) => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * Picks the order customer: search by name/phone or create a new one
 * (`GET`/`POST /users/customers`).
 */
export function CustomerPickerSheet({ isOpen, selectedId, onClose, onSelect }: CustomerPickerSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounce(search, 400);
  const { data, isFetching, isError } = useCustomerSearch(debounced, isOpen);
  const createCustomer = useCreateCustomer();

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setCreating(false);
      setFullName('');
      setPhone('');
      setError(null);
    }
  }, [isOpen]);

  const customers = (data?.data ?? []).filter((c) => c.customer);

  const startCreate = () => {
    // Pre-fill from the search text: digits → phone, otherwise → name.
    const digits = search.replace(/\D/g, '');
    if (digits.length >= 3) setPhone(digits.slice(-PHONE_DIGITS));
    else setFullName(search.trim());
    setError(null);
    setCreating(true);
  };

  const submitCreate = () => {
    if (fullName.trim().length < 2) {
      setError(t('sale.customer.nameRequired'));
      return;
    }
    if (phone.length !== PHONE_DIGITS) {
      setError(t('sale.customer.phoneInvalid'));
      return;
    }
    setError(null);
    createCustomer.mutate(
      { fullName: fullName.trim(), phone: `${PHONE_PREFIX}${phone}` },
      {
        onSuccess: (created) => {
          if (!created.customer) return;
          onSelect({ id: created.customer.id, fullName: created.fullName, phone: created.phone });
        },
        onError: (err) => setError(getApiErrorMessage(err, t('sale.customer.createFailed'))),
      }
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-1 px-4 pt-2 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">
            {creating ? t('sale.customer.newTitle') : t('sale.customer.title')}
          </Text>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        {creating ? (
          <View className="gap-3">
            <View className="gap-1.5">
              <Text className="font-onest-semibold text-[13px] text-soft">{t('sale.customer.fullName')}</Text>
              <SheetTextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('sale.customer.fullNamePlaceholder')}
                placeholderTextColor={colors.muted}
                autoFocus
                className="h-[52px] px-4 rounded-2xl bg-sunken font-onest text-base text-ink"
              />
            </View>
            <View className="gap-1.5">
              <Text className="font-onest-semibold text-[13px] text-soft">{t('sale.customer.phone')}</Text>
              <View className="flex-row items-center h-[52px] px-4 rounded-2xl bg-sunken gap-2">
                <Text className="font-onest-semibold text-base text-ink">{PHONE_PREFIX}</Text>
                <SheetTextInput
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, PHONE_DIGITS))}
                  keyboardType="phone-pad"
                  placeholder="90 123 45 67"
                  placeholderTextColor={colors.muted}
                  className="flex-1 font-onest text-base text-ink tabular-nums"
                />
              </View>
            </View>
            {error && <Text className="font-onest text-[13px] text-err-fg">{error}</Text>}
            <View className="flex-row gap-2.5 pt-1">
              <Button variant="secondary" size="lg" className="flex-1" onPress={() => setCreating(false)}>
                {t('common.back')}
              </Button>
              <Button variant="accent" size="lg" className="flex-1" onPress={submitCreate} loading={createCustomer.isPending}>
                {t('sale.customer.create')}
              </Button>
            </View>
          </View>
        ) : (
          <>
            <SearchField
              value={search}
              onChangeText={setSearch}
              placeholder={t('sale.customer.searchPlaceholder')}
              variant="sunken"
            />
            <Button variant="secondary" icon={UserPlus} onPress={startCreate}>
              {t('sale.customer.add')}
            </Button>
            {isError ? (
              <EmptyState icon={UserRound} message={t('sale.customer.loadFailed')} />
            ) : customers.length === 0 ? (
              isFetching ? (
                <ActivityIndicator color={colors.muted} className="pt-6" />
              ) : (
                <EmptyState icon={UserRound} message={t('sale.customer.notFound')} />
              )
            ) : (
              <SheetFlatList
                className="flex-1"
                data={customers}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
                renderItem={({ item }) => {
                  const customerId = item.customer!.id;
                  const selected = customerId === selectedId;
                  return (
                    <Pressable
                      onPress={() => onSelect({ id: customerId, fullName: item.fullName, phone: item.phone })}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className={cn('flex-row items-center gap-3 p-2.5 rounded-lg bg-sunken', selected && 'border-2 border-accent')}
                    >
                      <View className="w-11 h-11 rounded-full bg-accent items-center justify-center">
                        <Text className="font-onest-bold text-sm text-on-accent">{initials(item.fullName)}</Text>
                      </View>
                      <View className="flex-1 min-w-0 gap-0.5">
                        <Text className="type-body-strong text-ink" numberOfLines={1}>{item.fullName}</Text>
                        <Text className="font-onest text-xs text-muted tabular-nums">{item.phone}</Text>
                      </View>
                      {selected && <Check size={20} color={colors.ink} strokeWidth={2.2} />}
                    </Pressable>
                  );
                }}
              />
            )}
          </>
        )}
      </View>
    </Sheet>
  );
}
