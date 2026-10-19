import { cn } from '@/libs/utils';
import React from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { Money } from './Money';
import { StatusBadge, type StatusTone } from './StatusBadge';
import { Text } from './Text';

export interface ListCardProps extends Omit<PressableProps, 'children'> {
  title: string;
  subtitle?: string;
  /**
   * Short text in the round lead: initials («ТС») or a number («#127»)
   */
  lead?: string;
  /**
   * Custom lead (photo, icon); replaces `lead`
   */
  leading?: React.ReactNode;
  /**
   * Amount from the backend, shown on the right
   */
  amount?: string | number;
  /**
   * `err` — debt / expense
   */
  amountTone?: 'default' | 'err';
  /**
   * Text before the amount («от» for price ranges)
   */
  amountPrefix?: string;
  /**
   * Currency label after the amount; hidden by default
   */
  amountCurrency?: string;
  /**
   * Status under the amount
   */
  badge?: { label: string; tone: StatusTone };
  /**
   * Accent ring + accent lead (open cashbox, selected row)
   */
  highlight?: boolean;
  className?: string;
}

/**
 * ListCard — list row for orders, cashboxes, debtors (STHM)
 *
 * Pressable when `onPress` is set.
 *
 * @example
 * <ListCard
 *   lead={`#${order.number}`}
 *   title={order.customer?.fullName ?? t('order.noCustomer')}
 *   subtitle={`${order.warehouse.name} · ${time}`}
 *   amount={order.totalAmount}
 *   badge={{ label: t(`order.status.${order.status}`), tone: 'warn' }}
 *   onPress={() => router.push(`/(tabs)/(orders)/${order.id}`)}
 * />
 */
export function ListCard({
  title,
  subtitle,
  lead,
  leading,
  amount,
  amountTone = 'default',
  amountPrefix,
  amountCurrency,
  badge,
  highlight = false,
  onPress,
  className,
  ...props
}: ListCardProps) {
  return (
    <Pressable
      className={cn(
        // Border is always reserved so the highlight ring doesn't shift the layout.
        'flex-row items-center gap-3 bg-card rounded-lg px-3.5 py-3 border-2',
        highlight ? 'border-accent' : 'border-transparent',
        onPress && 'active:opacity-80',
        className,
      )}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      {...props}
    >
      {leading ??
        (lead ? (
          <View
            className={cn(
              'w-11 h-11 rounded-full items-center justify-center',
              highlight ? 'bg-accent' : 'bg-sunken',
            )}
          >
            <Text
              className={cn('font-onest-bold text-[13px]', highlight ? 'text-on-accent' : 'text-ink')}
              numberOfLines={1}
            >
              {lead}
            </Text>
          </View>
        ) : null)}

      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="font-onest-semibold text-[15px] text-ink" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {amount !== undefined || badge ? (
        <View className="items-end gap-1">
          {amount !== undefined ? (
            <Money
              value={amount}
              prefix={amountPrefix}
              currency={amountCurrency ?? null}
              className={cn('text-[15px]', amountTone === 'err' ? 'text-err-fg' : 'text-ink')}
            />
          ) : null}
          {badge ? <StatusBadge label={badge.label} tone={badge.tone} size="sm" className="self-end" /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}
