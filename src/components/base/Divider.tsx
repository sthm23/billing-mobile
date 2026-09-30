import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface DividerProps extends ViewProps {
  /**
   * Divider orientation
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Additional className for styling
   */
  className?: string;
}

/**
 * Divider — разделитель элементов
 *
 * Простая линия для визуального разделения контента.
 * Поддерживает горизонтальную и вертикальную ориентацию.
 *
 * @example
 * <Divider />
 *
 * @example
 * // Вертикальный разделитель
 * <HStack className="items-center gap-3">
 *   <Text>Left</Text>
 *   <Divider orientation="vertical" className="h-6" />
 *   <Text>Right</Text>
 * </HStack>
 *
 * @example
 * // С кастомными отступами
 * <VStack className="gap-4">
 *   <Text>Content 1</Text>
 *   <Divider className="my-2" />
 *   <Text>Content 2</Text>
 * </VStack>
 */
export function Divider({
  orientation = 'horizontal',
  className,
  ...props
}: DividerProps) {
  // Base styles
  const baseStyles = 'bg-border';

  // Orientation styles
  const orientationStyles = {
    horizontal: 'h-px w-full',
    vertical: 'w-px h-full',
  };

  return (
    <View
      className={cn(baseStyles, orientationStyles[orientation], className)}
      {...props}
    />
  );
}
