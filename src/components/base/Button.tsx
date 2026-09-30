import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';
import { cn } from '@/libs/utils';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  /**
   * Button content (text or React elements)
   */
  children: React.ReactNode;
  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Loading state (shows spinner)
   */
  loading?: boolean;
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * Additional className for text
   */
  textClassName?: string;
}

/**
 * Button — интерактивная кнопка с вариантами
 *
 * Поддерживает разные варианты стилей, размеры, состояние загрузки.
 * Автоматически отключается при loading=true.
 *
 * @example
 * <Button onPress={() => console.log('Pressed')}>
 *   Click Me
 * </Button>
 *
 * @example
 * // С вариантами
 * <Button variant="outline">Outline Button</Button>
 * <Button variant="ghost" size="sm">Small Ghost</Button>
 * <Button variant="destructive">Delete</Button>
 *
 * @example
 * // С загрузкой
 * <Button loading={isLoading} onPress={handleSubmit}>
 *   Submit
 * </Button>
 *
 * @example
 * // С кастомным контентом
 * <Button>
 *   <Icon name="plus" />
 *   <Text>Add Item</Text>
 * </Button>
 */
export function Button({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Base styles
  const baseStyles = 'rounded-lg flex-row items-center justify-center gap-2';

  // Variant styles
  const variantStyles = {
    default: 'bg-primary active:bg-primary/90',
    outline:
      'border border-border bg-background active:bg-accent',
    ghost: 'bg-transparent active:bg-accent',
    destructive:
      'bg-destructive active:bg-destructive/90',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 min-h-8',
    md: 'px-4 py-2 min-h-10',
    lg: 'px-6 py-3 min-h-12',
  };

  // Disabled styles
  const disabledStyles = 'opacity-50';

  // Text styles by variant
  const textVariantStyles = {
    default: 'text-primary-foreground font-semibold',
    outline: 'text-foreground font-medium',
    ghost: 'text-foreground font-medium',
    destructive: 'text-white font-semibold',
  };

  // Text size styles
  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  // Render text content
  const renderContent = () => {
    if (loading) {
      const spinnerColor = variant === 'default' || variant === 'destructive'
        ? '#FFFFFF'
        : undefined;

      return (
        <>
          <ActivityIndicator size="small" color={spinnerColor} />
          {typeof children === 'string' && (
            <Text
              className={cn(
                textVariantStyles[variant],
                textSizeStyles[size],
                textClassName,
              )}
            >
              {children}
            </Text>
          )}
        </>
      );
    }

    if (typeof children === 'string') {
      return (
        <Text
          className={cn(
            textVariantStyles[variant],
            textSizeStyles[size],
            textClassName,
          )}
        >
          {children}
        </Text>
      );
    }

    return children;
  };

  return (
    <Pressable
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && disabledStyles,
        className,
      )}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      {...props}
    >
      {renderContent()}
    </Pressable>
  );
}
