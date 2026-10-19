import { cn } from '@/libs/utils';
import { View, type ViewProps } from 'react-native';
import { Text } from './Text';

export type StatusTone = 'ok' | 'warn' | 'err' | 'info' | 'neutral' | 'accent';

export interface StatusBadgeProps extends ViewProps {
  /**
   * Status text — color is never the only signal, always pass a word
   */
  label: string;
  /**
   * `ok` done / income / in stock, `warn` pending / low, `err` debt / expense,
   * `info` created, `neutral` closed / cancelled, `accent` open
   */
  tone?: StatusTone;
  /**
   * `sm` for list rows, `md` default
   */
  size?: 'sm' | 'md';
  className?: string;
}

const toneClasses: Record<StatusTone, { box: string; text: string }> = {
  ok: { box: 'bg-ok-bg', text: 'text-ok-fg' },
  warn: { box: 'bg-warn-bg', text: 'text-warn-fg' },
  err: { box: 'bg-err-bg', text: 'text-err-fg' },
  info: { box: 'bg-info-bg', text: 'text-info-fg' },
  neutral: { box: 'bg-ph-bg', text: 'text-soft' },
  accent: { box: 'bg-accent', text: 'text-on-accent' },
};

const sizeClasses = {
  sm: { box: 'px-2 py-0.5', text: 'text-[11px]' },
  md: { box: 'px-2.5 py-1', text: 'text-xs' },
};

/**
 * StatusBadge — status pill (STHM)
 *
 * @example
 * <StatusBadge label={t('order.status.COMPLETED')} tone="ok" />
 * <StatusBadge label="29 дней" tone="warn" size="sm" />
 */
export function StatusBadge({ label, tone = 'neutral', size = 'md', className, ...props }: StatusBadgeProps) {
  return (
    <View
      className={cn('self-start rounded-pill', toneClasses[tone].box, sizeClasses[size].box, className)}
      {...props}
    >
      <Text className={cn('font-onest-semibold', toneClasses[tone].text, sizeClasses[size].text)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
