import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { type TextProps } from 'react-native';
import { Text } from './Text';

export interface MoneyProps extends Omit<TextProps, 'children'> {
  /**
   * Amount from the backend (number or Decimal string)
   */
  value: string | number | null | undefined;
  /**
   * Prefix positive values with "+"
   */
  signed?: boolean;
  /**
   * Currency label; `null` hides it
   */
  currency?: string | null;
  /**
   * Classes for the number (size, weight, color)
   */
  className?: string;
  /**
   * Classes for the currency label (default: smaller, `muted`)
   */
  currencyClassName?: string;
}

/**
 * Money — formatted amount with a de-emphasized currency (STHM)
 *
 * Display only: «18 056 319 UZS», digits tabular, «UZS» smaller and muted so the
 * amount reads first. Never calculate on the client — pass backend values.
 *
 * @example
 * <Money value={order.totalAmount} className="type-body-strong text-ink" />
 * <Money value={income} signed className="type-display text-hero-ink" currencyClassName="text-[15px] text-hero-muted" />
 */
export function Money({
  value,
  signed = false,
  currency = 'UZS',
  className,
  currencyClassName,
  ...props
}: MoneyProps) {
  return (
    <Text className={cn('font-onest-bold text-ink tabular-nums', className)} numberOfLines={1} {...props}>
      {formatMoney(value, { signed })}
      {currency ? (
        <Text className={cn('font-onest-medium text-[11px] text-muted', currencyClassName)}>
          {' '}
          {currency}
        </Text>
      ) : null}
    </Text>
  );
}
