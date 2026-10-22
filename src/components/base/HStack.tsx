import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface HStackProps extends ViewProps {
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * Gap between children (Tailwind spacing: 1, 2, 3, 4, 6, 8, etc.)
   */
  gap?: number;
}

/**
 * HStack — горизонтальный стек (flex-row)
 *
 * Используется для горизонтального расположения элементов.
 * По умолчанию имеет flex-direction: row.
 *
 * @example
 * <HStack className="p-4" gap={3}>
 *   <Icon name="user" />
 *   <Text>Profile</Text>
 * </HStack>
 *
 * @example
 * // С выравниванием между элементами
 * <HStack className="justify-between items-center px-4">
 *   <Text>Total</Text>
 *   <Text className="font-bold">$99.99</Text>
 * </HStack>
 */
export function HStack({ className, gap, ...props }: HStackProps) {
  const gapClass = gap !== undefined ? `gap-${gap}` : '';

  return (
    <View
      className={cn('flex-row', gapClass, className)}
      {...props}
    />
  );
}
