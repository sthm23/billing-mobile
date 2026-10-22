import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface VStackProps extends ViewProps {
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
 * VStack — вертикальный стек (flex-column)
 *
 * Используется для вертикального расположения элементов.
 * По умолчанию имеет flex-direction: column.
 *
 * @example
 * <VStack className="p-4" gap={3}>
 *   <Text>First item</Text>
 *   <Text>Second item</Text>
 *   <Text>Third item</Text>
 * </VStack>
 *
 * @example
 * // С выравниванием
 * <VStack className="items-center" gap={2}>
 *   <Icon name="check" />
 *   <Text>Success!</Text>
 * </VStack>
 */
export function VStack({ className, gap, ...props }: VStackProps) {
  const gapClass = gap !== undefined ? `gap-${gap}` : '';

  return (
    <View
      className={cn('flex-col', gapClass, className)}
      {...props}
    />
  );
}
