import { Text } from '@/components/base';
import { cn } from '@/libs/utils';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/** White card of one report: title, optional note on the right, content. */
export function SectionCard({
  title,
  note,
  action,
  children,
  className,
}: {
  title: string;
  /** Small muted text on the right («по выручке») */
  note?: string;
  /** Element on the right instead of the note (a link) */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('bg-card rounded-xl p-4 gap-3', className)}>
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="flex-shrink type-body-strong text-ink" accessibilityRole="header">
          {title}
        </Text>
        {action ?? (note ? <Text className="font-onest text-xs text-muted">{note}</Text> : null)}
      </View>
      {children}
    </View>
  );
}

export type TileTone = 'default' | 'ok' | 'err';

const tileTone: Record<TileTone, string> = {
  default: 'text-ink',
  ok: 'text-ok-fg',
  err: 'text-err-fg',
};

/** Grey plate with a caption and a short value, inside a card. */
export function StatTile({ label, value, tone = 'default' }: { label: string; value: string; tone?: TileTone }) {
  return (
    <View className="flex-1 min-w-0 bg-sunken rounded-md px-3 py-2.5 gap-0.5">
      <Text className="font-onest text-xs text-muted" numberOfLines={1}>
        {label}
      </Text>
      <Text className={cn('font-onest-bold text-[15px]', tileTone[tone])} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

/**
 * Row with a label, a value and a horizontal bar (payment method, expense
 * category, staff, warehouse). `width` comes from `barWidth()`.
 */
export function ShareBar({
  label,
  value,
  note,
  width,
  muted = false,
}: {
  label: string;
  value: string;
  /** After the value, muted («· 49%») */
  note?: string;
  width: `${number}%`;
  /** Grey bar (expenses) instead of the chart green */
  muted?: boolean;
}) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="flex-shrink font-onest-semibold text-sm text-ink" numberOfLines={1}>
          {label}
        </Text>
        <Text className="font-onest-bold text-sm text-ink">
          {value}
          {note ? <Text className="font-onest text-sm text-muted"> {note}</Text> : null}
        </Text>
      </View>
      <View className="h-2 rounded-full bg-sunken overflow-hidden">
        <View className={cn('h-2 rounded-full', muted ? 'bg-chart-muted' : 'bg-chart')} style={{ width }} />
      </View>
    </View>
  );
}

/** Line «caption ……… value» under a divider (totals at the bottom of a card). */
export function TotalRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: TileTone }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3 pt-2.5 border-t border-line">
      <Text className="flex-shrink font-onest text-[13px] text-muted">{label}</Text>
      <Text className={cn('font-onest-bold text-sm', tileTone[tone])}>{value}</Text>
    </View>
  );
}
