import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface CardProps extends ViewProps {
  /**
   * Card variant
   */
  variant?: 'default' | 'elevated';
  /**
   * Additional className for styling
   */
  className?: string;
}

/**
 * Card — карточка с контентом
 *
 * Обертка над View для отображения контента в карточке.
 * Автоматически применяет фон, скругление, отступы и тень.
 *
 * @example
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 *
 * @example
 * // Приподнятая карточка с большей тенью
 * <Card variant="elevated">
 *   <Text>Elevated card</Text>
 * </Card>
 *
 * @example
 * // С кастомными стилями
 * <Card className="gap-3">
 *   <Text className="text-lg font-bold">Title</Text>
 *   <Text className="text-sm text-muted-foreground">Description</Text>
 * </Card>
 */
export function Card({
  variant = 'default',
  className,
  ...props
}: CardProps) {
  // Base styles
  const baseStyles = 'bg-card rounded-xl p-4';

  // Variant styles
  const variantStyles = {
    default: 'shadow-sm',
    elevated: 'shadow-md',
  };

  return (
    <View
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    />
  );
}
