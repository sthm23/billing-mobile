import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/libs/utils';

interface AvailabilityBadgeProps {
  isAvailable: boolean;
  className?: string;
}

/**
 * AvailabilityBadge — бадж для отображения наличия товара
 *
 * Использует семантические цвета и адаптируется к light/dark теме.
 *
 * @example
 * <AvailabilityBadge isAvailable={true} />
 * <AvailabilityBadge isAvailable={false} />
 */
export function AvailabilityBadge({ isAvailable, className }: AvailabilityBadgeProps) {
  const variant = isAvailable ? 'success' : 'error';

  // Variant styles — используем семантические и Tailwind цвета
  const variantStyles = {
    success: 'bg-green-100 dark:bg-green-900/30',
    error: 'bg-red-100 dark:bg-red-900/30',
  };

  // Text color styles
  const textVariantStyles = {
    success: 'text-green-700 dark:text-green-400',
    error: 'text-red-700 dark:text-red-400',
  };

  return (
    <View
      className={cn(
        'rounded-full px-3 py-1 self-start',
        variantStyles[variant],
        className,
      )}
    >
      <Text
        className={cn(
          'text-xs font-medium',
          textVariantStyles[variant],
        )}
      >
        {isAvailable ? 'В наличии' : 'Нет в наличии'}
      </Text>
    </View>
  );
}
