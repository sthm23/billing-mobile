import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import { Text, type TextProps } from './Text';

/** Icon component compatible with lucide-react-native. */
export type ButtonIconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type StyleVariant = 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost';
/** @deprecated Pre-STHM names, mapped to STHM variants. Remove after stage 3. */
type LegacyVariant = 'default' | 'outline' | 'destructive';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  /**
   * Button content. A string is rendered as the label.
   */
  children?: React.ReactNode;
  /**
   * `primary` — black, `accent` — sage (main action), `secondary` — neutral fill,
   * `danger` — destructive, `ghost` — no fill.
   */
  variant?: StyleVariant | LegacyVariant;
  /**
   * `sm` 36px, `md` 44px (default), `lg` 56px — main action of a screen
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Icon shown before the label (lucide icon component)
   */
  icon?: ButtonIconComponent;
  /**
   * Stretch to the parent's width
   */
  full?: boolean;
  /**
   * Loading state (shows spinner, disables the button)
   */
  loading?: boolean;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Additional className for the label
   */
  textClassName?: string;
}

const LEGACY_VARIANTS: Record<LegacyVariant, StyleVariant> = {
  default: 'primary',
  outline: 'secondary',
  destructive: 'danger',
};

const containerVariants: Record<StyleVariant, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  secondary: 'bg-ph-bg',
  danger: 'bg-err-bg',
  ghost: 'bg-transparent active:bg-sunken',
};

const labelVariants: Record<StyleVariant, string> = {
  primary: 'text-on-primary',
  accent: 'text-on-accent',
  secondary: 'text-ink',
  danger: 'text-err-fg',
  ghost: 'text-ink',
};

const containerSizes = {
  sm: 'h-9 px-3.5 gap-1.5',
  md: 'h-11 px-4 gap-2',
  lg: 'h-14 px-6 gap-2',
};

const labelSizes = {
  sm: 'text-[13px]',
  md: 'text-sm',
  lg: 'text-base',
};

const iconSizes = { sm: 16, md: 18, lg: 18 };

export function resolveButtonVariant(variant: StyleVariant | LegacyVariant): StyleVariant {
  return variant in LEGACY_VARIANTS ? LEGACY_VARIANTS[variant as LegacyVariant] : (variant as StyleVariant);
}

/**
 * Button — pill-shaped button (STHM)
 *
 * One `primary` and one `accent` button per screen at most.
 * Labels are verbs with only the first word capitalized: «Оплатить».
 *
 * @example
 * <Button variant="accent" size="lg" full onPress={pay}>Оплатить</Button>
 *
 * @example
 * <Button variant="primary" size="md" icon={Plus}>Новый</Button>
 * <Button variant="danger" icon={Trash2}>Удалить</Button>
 *
 * @example
 * <Button loading={isSaving} onPress={save}>Сохранить</Button>
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  full = false,
  loading = false,
  disabled,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const colors = useTheme();
  const styleVariant = resolveButtonVariant(variant);
  const isDisabled = Boolean(disabled || loading);
  // Disabled (not loading) buttons switch to the neutral disabled look.
  const showDisabledLook = Boolean(disabled) && !loading;

  const contentColor = showDisabledLook
    ? colors.disabledFg
    : {
      primary: colors.onPrimary,
      accent: colors.onAccent,
      secondary: colors.ink,
      danger: colors.errFg,
      ghost: colors.ink,
    }[styleVariant];

  const label =
    typeof children === 'string' || typeof children === 'number' ? (
      <Text
        className={cn(
          'font-onest-bold',
          labelSizes[size],
          showDisabledLook ? 'text-disabled-fg' : labelVariants[styleVariant],
          textClassName,
        )}
        numberOfLines={1}
      >
        {children}
      </Text>
    ) : (
      children
    );

  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-center rounded-pill active:opacity-80',
        containerSizes[size],
        showDisabledLook ? 'bg-disabled-bg' : containerVariants[styleVariant],
        full && 'w-full',
        className,
      )}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : (
        Icon && <Icon size={iconSizes[size]} color={contentColor} strokeWidth={2.2} />
      )}
      {label}
    </Pressable>
  );
}

// Sub-components for custom button content

export interface ButtonTextProps extends TextProps {
  className?: string;
  children: React.ReactNode;
}

export function ButtonText({ className, children, ...props }: ButtonTextProps) {
  return (
    <Text className={cn('font-onest-bold text-base text-ink', className)} {...props}>
      {children}
    </Text>
  );
}

export interface ButtonIconProps extends ViewProps {
  as: ButtonIconComponent;
  className?: string;
  size?: number;
  color?: string;
}

export function ButtonIcon({ as: IconComponent, className, size = 20, color, ...props }: ButtonIconProps) {
  return (
    <View className={cn(className)} {...props}>
      <IconComponent size={size} color={color} />
    </View>
  );
}
