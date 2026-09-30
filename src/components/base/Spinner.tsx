import React from 'react';
import { ActivityIndicator, View, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface SpinnerProps extends ViewProps {
  /**
   * Spinner size
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Spinner color (hex color)
   */
  color?: string;
  /**
   * Additional className for styling
   */
  className?: string;
}

/**
 * Spinner — индикатор загрузки
 *
 * Обертка над ActivityIndicator для отображения состояния загрузки.
 * Автоматически центрируется внутри родителя.
 *
 * @example
 * <Spinner />
 *
 * @example
 * // Большой спиннер с кастомным цветом
 * <Spinner size="lg" color="#E7000B" />
 *
 * @example
 * // В карточке
 * <Card className="items-center justify-center h-32">
 *   <Spinner />
 * </Card>
 */
export function Spinner({
  size = 'md',
  color = '#171717', // primary color
  className,
  ...props
}: SpinnerProps) {
  // Map size to ActivityIndicator size
  const activitySize = size === 'sm' ? 'small' : 'large';

  return (
    <View
      className={cn('items-center justify-center', className)}
      {...props}
    >
      <ActivityIndicator size={activitySize} color={color} />
    </View>
  );
}
