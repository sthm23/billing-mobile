import { cn } from '@/libs/utils';
import { Pressable, View, type ViewProps } from 'react-native';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> extends Omit<ViewProps, 'children'> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Segmented — single-choice filter on a track (STHM)
 *
 * @example
 * <Segmented
 *   options={[
 *     { value: 'all', label: t('order.filter.all') },
 *     { value: 'open', label: t('order.filter.open') },
 *     { value: 'done', label: t('order.filter.done') },
 *   ]}
 *   value={filter}
 *   onChange={setFilter}
 * />
 */
export function Segmented<T extends string>({ options, value, onChange, className, ...props }: SegmentedProps<T>) {
  return (
    <View
      className={cn('flex-row gap-1 p-1 bg-track rounded-pill', className)}
      accessibilityRole="tablist"
      {...props}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn('flex-1 h-9 items-center justify-center rounded-pill px-2', selected && 'bg-seg')}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text
              className={cn(
                'text-sm',
                selected ? 'font-onest-semibold text-ink' : 'font-onest-medium text-soft',
              )}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
