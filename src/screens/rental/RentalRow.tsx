import { Money, PhotoPlaceholder, StatusBadge, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { RentalStatus, type RentalListItem } from '@/services/rental';
import { Image } from 'expo-image';
import { CalendarDays } from 'lucide-react-native';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { formatDay, initials, rentalBadges } from './rental-format';

const MAX_THUMBS = 3;

function Thumb({ uri, name }: { uri: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return <PhotoPlaceholder size="sm" className="w-9 h-9 rounded-[10px]" />;
  }

  return (
    <View className="w-9 h-9 rounded-[10px] overflow-hidden bg-ph-bg">
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        alt={name}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

interface RentalRowProps {
  rental: RentalListItem;
  onPress: (id: string) => void;
}

/**
 * Rental list row (design «Аренда · список»): customer, code, status, dates,
 * item thumbnails, total and what is left to pay.
 */
export const RentalRow = memo(function RentalRow({ rental, onPress }: RentalRowProps) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const name = rental.customer?.fullName ?? t('rental.noCustomer');
  const subtitle = [rental.customer?.phone, `№${rental.code}`].filter(Boolean).join(' · ');
  const thumbs = rental.items.slice(0, MAX_THUMBS);
  const more = rental.items.length - thumbs.length;

  // Amounts come from the backend; only the label is picked here
  const due = Number(rental.order.dueAmount);
  const pay =
    rental.status === RentalStatus.CANCELLED
      ? null
      : due <= 0
        ? { text: t('rental.paidInFull'), className: 'text-ok-fg' }
        : Number(rental.order.paidAmount) <= 0
          ? { text: t('rental.notPaid', { amount: formatMoney(due) }), className: 'text-err-fg' }
          : { text: t('rental.leftToPay', { amount: formatMoney(due) }), className: 'text-warn-fg' };

  return (
    <Pressable
      onPress={() => onPress(rental.id)}
      className="bg-card rounded-lg p-3.5 gap-2.5 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`${name}, №${rental.code}`}
    >
      <View className="flex-row items-center gap-2.5">
        <View className="w-10 h-10 rounded-full bg-sunken items-center justify-center">
          <Text className="font-onest-bold text-sm text-ink">{initials(name)}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-onest-semibold text-[15px] text-ink" numberOfLines={1}>{name}</Text>
          <Text className="font-onest text-xs text-muted" numberOfLines={1}>{subtitle}</Text>
        </View>
        <View className="items-end gap-1">
          {rentalBadges(rental, t).map((badge) => (
            <StatusBadge key={badge.label} label={badge.label} tone={badge.tone} />
          ))}
        </View>
      </View>

      <View className="flex-row items-center gap-1.5">
        <CalendarDays size={14} color={colors.soft} strokeWidth={2} />
        <Text className="font-onest-semibold text-[13px] text-ink">
          {formatDay(rental.startDate, i18n.language)} → {formatDay(rental.endDate, i18n.language)}
        </Text>
        <Text className="font-onest text-[13px] text-soft">· {t('rental.days', { count: rental.plannedDays })}</Text>
      </View>

      <View className="flex-row items-end justify-between gap-2.5">
        <View className="flex-row gap-1">
          {thumbs.map((item) => (
            <Thumb key={item.variantId} uri={item.imageUrl} name={item.productName} />
          ))}
          {more > 0 ? (
            <View className="w-9 h-9 rounded-[10px] bg-sunken items-center justify-center">
              <Text className="font-onest-bold text-xs text-soft">+{more}</Text>
            </View>
          ) : null}
        </View>
        <View className="items-end gap-0.5">
          <Money
            value={rental.order.totalAmount}
            currency={t('common.currency')}
            className="font-onest-bold text-base text-ink"
            currencyClassName="text-[11px] text-muted"
          />
          {pay ? <Text className={`font-onest-semibold text-xs ${pay.className}`}>{pay.text}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
});

/** Placeholder card while the list loads */
export function RentalRowSkeleton() {
  return (
    <View className="bg-card rounded-lg p-3.5 gap-3" accessibilityElementsHidden>
      <View className="flex-row items-center gap-2.5">
        <View className="w-10 h-10 rounded-full bg-sunken" />
        <View className="flex-1 gap-1.5">
          <View className="h-3 w-3/5 rounded-sm bg-sunken" />
          <View className="h-2.5 w-2/5 rounded-sm bg-sunken" />
        </View>
        <View className="w-16 h-5 rounded-pill bg-sunken" />
      </View>
      <View className="h-3 w-[70%] rounded-sm bg-sunken" />
      <View className="flex-row justify-between items-end">
        <View className="flex-row gap-1">
          <View className="w-9 h-9 rounded-[10px] bg-sunken" />
          <View className="w-9 h-9 rounded-[10px] bg-sunken" />
        </View>
        <View className="w-24 h-4 rounded-sm bg-sunken" />
      </View>
    </View>
  );
}
