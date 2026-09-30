import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface InputProps extends TextInputProps {
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * Input size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Error state (shows red border)
   */
  error?: boolean;
}

/**
 * Input — текстовый инпут
 *
 * Обертка над React Native TextInput с поддержкой размеров, состояния ошибки
 * и semantic colors из дизайн-системы.
 *
 * @example
 * <Input placeholder="Enter text" />
 *
 * @example
 * // С размерами
 * <Input size="sm" placeholder="Small input" />
 * <Input size="lg" placeholder="Large input" />
 *
 * @example
 * // Состояние ошибки
 * <Input error placeholder="Invalid value" />
 *
 * @example
 * // С контролируемым значением
 * <Input
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="Email"
 *   keyboardType="email-address"
 * />
 *
 * @example
 * // Disabled state
 * <Input
 *   editable={false}
 *   placeholder="Disabled input"
 * />
 */
export function Input({
  className,
  size = 'md',
  error = false,
  editable = true,
  placeholderTextColor,
  ...props
}: InputProps) {
  // Base styles
  const baseStyles =
    'rounded-lg border bg-background text-foreground';

  // Border styles
  const borderStyles = error
    ? 'border-destructive'
    : 'border-input focus:border-primary';

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm min-h-8',
    md: 'px-4 py-2 text-base min-h-10',
    lg: 'px-6 py-3 text-lg min-h-12',
  };

  // Disabled styles
  const disabledStyles = 'opacity-50 bg-muted';

  // Default placeholder color (muted-foreground)
  const defaultPlaceholderColor = '#737373'; // muted-foreground from design system

  return (
    <TextInput
      className={cn(
        baseStyles,
        borderStyles,
        sizeStyles[size],
        !editable && disabledStyles,
        className,
      )}
      editable={editable}
      placeholderTextColor={placeholderTextColor ?? defaultPlaceholderColor}
      {...props}
    />
  );
}
