import { Pressable, Text } from '@/components/base';
import { cn } from '@/libs/utils';
import { View } from 'react-native';

export interface ChartBar {
  key: string;
  value: number;
  /** Read by screen readers: «12 ноября: 1 250 000 UZS» */
  accessibilityLabel: string;
}

interface BarChartProps {
  bars: ChartBar[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Labels under the axis, spread evenly («1 · 10 · 20 · 30») */
  axis: string[];
  height?: number;
}

/** Lowest visible bar, so a small day still shows next to a big one. */
const MIN_BAR_PERCENT = 3;
const EMPTY_BAR_PX = 2;

/**
 * Vertical bar chart of plain views (no chart library): a bar's height is its
 * share of the largest bar. Tapping a bar selects it; the caller shows its
 * value above the chart. Values come from the backend.
 */
export function BarChart({ bars, selectedKey, onSelect, axis, height = 140 }: BarChartProps) {
  const max = bars.reduce((m, b) => Math.max(m, b.value), 0);

  return (
    <View className="gap-1.5">
      <View style={{ height }} className="flex-row items-end gap-0.5 border-b border-track">
        <View pointerEvents="none" className="absolute left-0 right-0 top-0 border-t border-track" />
        {bars.map((bar) => {
          const selected = bar.key === selectedKey;
          const percent = max > 0 ? Math.max(MIN_BAR_PERCENT, Math.round((bar.value / max) * 100)) : 0;
          return (
            <Pressable
              key={bar.key}
              onPress={() => onSelect(bar.key)}
              accessibilityRole="button"
              accessibilityLabel={bar.accessibilityLabel}
              accessibilityState={{ selected }}
              className="flex-1 min-w-0 h-full justify-end"
            >
              <View
                className={cn('w-full rounded-t-[4px]', selected ? 'bg-ink' : bar.value > 0 ? 'bg-chart' : 'bg-track')}
                style={{ height: bar.value > 0 ? `${percent}%` : EMPTY_BAR_PX }}
              />
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row justify-between">
        {axis.map((label, i) => (
          <Text key={`${label}-${i}`} className="font-onest text-[11px] text-muted">
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
