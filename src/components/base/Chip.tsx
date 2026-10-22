import { cn } from '@/libs/utils';
import { Pressable, type PressableProps } from 'react-native';
import { Text } from './Text';

export interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  /**
   * Selected chip is black (`primary`)
   */
  selected?: boolean;
  /**
   * `default` — white on `bg`; `sunken` — inside a card; `err` — warning filter («Мало · 3»)
   */
  tone?: 'default' | 'sunken' | 'err';
  /**
   * `md` 36px (filters), `lg` 40px (attribute selectors)
   */
  size?: 'md' | 'lg';
  className?: string;
}

const toneClasses = {
  default: { box: 'bg-card', text: 'text-ink font-onest-medium' },
  sunken: { box: 'bg-sunken', text: 'text-ink font-onest-medium' },
  err: { box: 'bg-err-bg', text: 'text-err-fg font-onest-semibold' },
};

/**
 * Chip — filter / option chip (STHM)
 *
 * @example
 * <Chip label="Все · 248" selected={filter === 'all'} onPress={() => setFilter('all')} />
 * <Chip label="Мало · 3" tone="err" />
 * <Chip label="14×5" tone="sunken" size="lg" selected />
 */
export function Chip({ label, selected = false, tone = 'default', size = 'md', className, ...props }: ChipProps) {
  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-pill px-4 active:opacity-80',
        size === 'md' ? 'h-9' : 'h-10',
        selected ? 'bg-primary' : toneClasses[tone].box,
        className,
      )}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      {...props}
    >
      <Text
        className={cn('text-sm', selected ? 'text-on-primary font-onest-semibold' : toneClasses[tone].text)}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
