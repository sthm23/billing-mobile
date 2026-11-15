import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { Pressable, type PressableProps } from 'react-native';
import type { ButtonIconComponent } from './Button';

export interface IconButtonProps extends Omit<PressableProps, 'children'> {
  /**
   * Lucide icon component
   */
  icon: ButtonIconComponent;
  /**
   * Required: icon-only buttons have no visible label
   */
  accessibilityLabel: string;
  /**
   * `card` — on `bg`, `sunken` — inside a card, `primary` — black,
   * `accent` — sage (scan), `danger` — delete, `hero` — on the dark `hero` block
   */
  variant?: 'card' | 'sunken' | 'primary' | 'accent' | 'danger' | 'hero';
  /**
   * `sm` 36px, `md` 44px, `lg` 52px
   */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses = {
  card: 'bg-card',
  sunken: 'bg-sunken',
  primary: 'bg-primary',
  accent: 'bg-accent',
  danger: 'bg-err-bg',
  hero: 'bg-hero-sub',
};

const sizeClasses = { sm: 'w-9 h-9', md: 'w-11 h-11', lg: 'w-13 h-13' };
const iconSizes = { sm: 16, md: 20, lg: 22 };

/**
 * IconButton — round icon-only button (STHM)
 *
 * @example
 * <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={router.back} />
 * <IconButton icon={Plus} variant="primary" accessibilityLabel="Добавить товар" />
 * <IconButton icon={ScanBarcode} variant="accent" size="lg" accessibilityLabel="Сканировать" />
 */
export function IconButton({
  icon: Icon,
  variant = 'card',
  size = 'md',
  disabled,
  className,
  ...props
}: IconButtonProps) {
  const colors = useTheme();
  const color = {
    card: colors.ink,
    sunken: colors.ink,
    primary: colors.onPrimary,
    accent: colors.onAccent,
    danger: colors.errFg,
    hero: colors.heroInk,
  }[variant];

  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-full active:opacity-80',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50',
        className,
      )}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      hitSlop={size === 'sm' ? 4 : undefined}
      {...props}
    >
      <Icon size={iconSizes[size]} color={color} strokeWidth={2} />
    </Pressable>
  );
}
