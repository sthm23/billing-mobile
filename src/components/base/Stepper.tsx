import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type ViewProps } from 'react-native';
import { Text } from './Text';

export interface StepperProps extends Omit<ViewProps, 'children'> {
  value: number;
  onChange: (value: number) => void;
  /**
   * Lowest value (default 1)
   */
  min?: number;
  /**
   * Highest value, e.g. available stock from the backend
   */
  max?: number;
  /**
   * Column layout with + on top (order lines)
   */
  vertical?: boolean;
  /**
   * `sm` 34px buttons (lists), `md` 40px (default)
   */
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

/**
 * Stepper — quantity control (STHM)
 *
 * Only bounds the input for UX; the backend still validates stock.
 *
 * @example
 * <Stepper value={qty} onChange={setQty} max={variant.quantity} />
 * <Stepper value={item.quantity} onChange={update} vertical size="sm" />
 */
export function Stepper({
  value,
  onChange,
  min = 1,
  max,
  vertical = false,
  size = 'md',
  disabled = false,
  className,
  ...props
}: StepperProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && (max === undefined || value < max);
  const buttonSize = size === 'sm' ? 'w-[34px] h-[34px]' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 16 : 18;

  const renderButton = (kind: 'decrease' | 'increase') => {
    const enabled = kind === 'decrease' ? canDecrease : canIncrease;
    const Icon = kind === 'decrease' ? Minus : Plus;

    return (
      <Pressable
        onPress={() => onChange(kind === 'decrease' ? value - 1 : value + 1)}
        disabled={!enabled}
        className={cn('rounded-full items-center justify-center bg-card active:opacity-80', buttonSize, !enabled && 'opacity-40')}
        accessibilityRole="button"
        accessibilityLabel={t(`common.${kind}`)}
        accessibilityState={{ disabled: !enabled }}
      >
        <Icon size={iconSize} color={colors.ink} strokeWidth={2} />
      </Pressable>
    );
  };

  return (
    <View
      className={cn(
        'items-center gap-1 bg-sunken rounded-pill p-1',
        vertical ? 'flex-col-reverse' : 'flex-row',
        className,
      )}
      accessibilityRole="adjustable"
      accessibilityValue={{ now: value, min, max }}
      {...props}
    >
      {renderButton('decrease')}
      <Text className="min-w-8 text-center font-onest-bold text-base text-ink tabular-nums">{value}</Text>
      {renderButton('increase')}
    </View>
  );
}
