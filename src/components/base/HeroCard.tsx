import { cn } from '@/libs/utils';
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { Money } from './Money';
import { Text } from './Text';

export interface HeroCardTile {
  label: string;
  /** Amount from the backend */
  value: string | number;
  /** `accent` income / paid, `err` expense / debt, `warn` remaining */
  tone?: 'default' | 'accent' | 'err' | 'warn';
  /** Prefix positive values with "+" */
  signed?: boolean;
}

export interface HeroCardProps extends ViewProps {
  /**
   * Caption above the amount («Продажи сегодня», «Сумма в кассе»)
   */
  label: string;
  /**
   * Main amount from the backend
   */
  amount: string | number;
  /**
   * Currency label; `null` hides it
   */
  currency?: string | null;
  /**
   * Pill next to the label («14 заказов», «Открыта»)
   */
  chip?: string;
  chipTone?: 'neutral' | 'accent';
  /**
   * Up to two plates under the amount
   */
  tiles?: HeroCardTile[];
  /**
   * Extra content at the bottom (actions, progress)
   */
  children?: React.ReactNode;
  className?: string;
}

const tileToneClasses = {
  default: 'text-hero-ink',
  accent: 'text-accent',
  err: 'text-hero-err',
  warn: 'text-hero-warn',
};

/**
 * HeroCard — the one dark main block of a screen (STHM)
 *
 * Totals only: cashbox balance, sales today, order total, total debt.
 * All amounts must come from the backend.
 *
 * @example
 * <HeroCard
 *   label="Продажи сегодня"
 *   chip="14 заказов"
 *   amount={summary.total}
 *   tiles={[
 *     { label: 'Оплачено', value: summary.paid, tone: 'accent' },
 *     { label: 'В долг', value: summary.debt, tone: 'err' },
 *   ]}
 * />
 */
export function HeroCard({
  label,
  amount,
  currency = 'UZS',
  chip,
  chipTone = 'neutral',
  tiles,
  children,
  className,
  ...props
}: HeroCardProps) {
  return (
    <View className={cn('bg-hero rounded-2xl p-[18px] gap-3.5', className)} {...props}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-onest-medium text-sm text-hero-muted flex-shrink" numberOfLines={1}>
          {label}
        </Text>
        {chip ? (
          <View className={cn('rounded-pill px-2.5 py-1', chipTone === 'accent' ? 'bg-accent' : 'bg-hero-sub')}>
            <Text
              className={cn(
                'font-onest-semibold text-xs',
                chipTone === 'accent' ? 'text-on-accent' : 'text-hero-ink',
              )}
              numberOfLines={1}
            >
              {chip}
            </Text>
          </View>
        ) : null}
      </View>

      <Money
        value={amount}
        currency={currency}
        className="text-[32px] tracking-[-0.64px] text-hero-ink"
        currencyClassName="text-[15px] text-hero-muted"
        adjustsFontSizeToFit
      />

      {tiles && tiles.length > 0 ? (
        <View className="flex-row gap-2">
          {tiles.map((tile) => (
            <View key={tile.label} className="flex-1 bg-hero-sub rounded-md px-3 py-2.5 gap-0.5">
              <Text className="font-onest text-xs text-hero-muted" numberOfLines={1}>
                {tile.label}
              </Text>
              <Money
                value={tile.value}
                signed={tile.signed}
                currency={null}
                className={cn('font-onest-semibold text-[15px]', tileToneClasses[tile.tone ?? 'default'])}
              />
            </View>
          ))}
        </View>
      ) : null}

      {children}
    </View>
  );
}
