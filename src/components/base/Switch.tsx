import { cn } from '@/libs/utils';
import { Pressable, View, type PressableProps } from 'react-native';

export interface SwitchProps extends Omit<PressableProps, 'children' | 'onPress'> {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Read by screen readers (the switch has no visible label of its own) */
  accessibilityLabel: string;
  className?: string;
}

/**
 * Switch — on/off toggle (STHM): black track with a white knob when on,
 * `track` grey when off. 48×28.
 *
 * @example
 * <Switch value={rent} onValueChange={setRent} accessibilityLabel={t('storeSettings.rental')} />
 */
export function Switch({ value, onValueChange, accessibilityLabel, disabled, className, ...props }: SwitchProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      className={cn(
        'w-12 h-7 rounded-pill justify-center px-[3px]',
        value ? 'bg-primary items-end' : 'bg-track items-start',
        disabled && 'opacity-50',
        className,
      )}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      <View className={cn('w-[22px] h-[22px] rounded-full', value ? 'bg-on-primary' : 'bg-card')} />
    </Pressable>
  );
}
