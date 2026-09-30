import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface TextAreaProps extends TextInputProps {
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * TextArea size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Error state (shows red border)
   */
  error?: boolean;
  /**
   * Number of visible text rows (controls min height)
   */
  rows?: number;
}

/**
 * TextArea — многострочный текстовый инпут
 *
 * Обертка над React Native TextInput с multiline=true.
 * Поддерживает размеры, состояние ошибки и количество строк.
 *
 * @example
 * <TextArea placeholder="Enter description" rows={4} />
 *
 * @example
 * // С размерами
 * <TextArea size="sm" placeholder="Small textarea" />
 * <TextArea size="lg" placeholder="Large textarea" rows={6} />
 *
 * @example
 * // Состояние ошибки
 * <TextArea error placeholder="Invalid value" rows={3} />
 *
 * @example
 * // С контролируемым значением
 * <TextArea
 *   value={description}
 *   onChangeText={setDescription}
 *   placeholder="Enter product description"
 *   rows={5}
 * />
 *
 * @example
 * // Disabled state
 * <TextArea
 *   editable={false}
 *   placeholder="Disabled textarea"
 *   rows={4}
 * />
 */
export function TextArea({
  className,
  size = 'md',
  error = false,
  rows = 3,
  editable = true,
  placeholderTextColor,
  ...props
}: TextAreaProps) {
  // Base styles
  const baseStyles =
    'rounded-lg border bg-background text-foreground';

  // Border styles
  const borderStyles = error
    ? 'border-destructive'
    : 'border-input focus:border-primary';

  // Size styles (horizontal padding and font size)
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Min height based on rows (approximate line height)
  const lineHeightMap = {
    sm: 20, // ~14px font + 6px spacing
    md: 24, // ~16px font + 8px spacing
    lg: 28, // ~18px font + 10px spacing
  };

  const minHeight = rows * lineHeightMap[size] + 16; // +16px for vertical padding

  // Disabled styles
  const disabledStyles = 'opacity-50 bg-muted';

  // Default placeholder color (muted-foreground)
  const defaultPlaceholderColor = '#737373'; // muted-foreground from design system

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      className={cn(
        baseStyles,
        borderStyles,
        sizeStyles[size],
        !editable && disabledStyles,
        className,
      )}
      style={{ minHeight }}
      editable={editable}
      placeholderTextColor={placeholderTextColor ?? defaultPlaceholderColor}
      {...props}
    />
  );
}
