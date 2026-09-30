import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface BoxProps extends ViewProps {
  /**
   * Additional className for styling
   */
  className?: string;
}

/**
 * Box — базовый layout контейнер
 *
 * Обертка над View с поддержкой Tailwind классов через NativeWind.
 * Используйте для любых контейнеров, где нужен фон, отступы, границы.
 *
 * @example
 * <Box className="p-4 bg-card rounded-xl shadow-sm">
 *   <Text>Content</Text>
 * </Box>
 *
 * @example
 * // Карточка с границей
 * <Box className="p-4 border border-border rounded-lg">
 *   <Text>Card content</Text>
 * </Box>
 */
export function Box({ className, ...props }: BoxProps) {
  return <View className={cn(className)} {...props} />;
}
