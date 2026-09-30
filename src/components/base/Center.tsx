import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface CenterProps extends ViewProps {
  /**
   * Additional className for styling
   */
  className?: string;
}

/**
 * Center — контейнер с центрированием
 *
 * Центрирует дочерние элементы по вертикали и горизонтали.
 * Удобен для пустых состояний, загрузчиков, ошибок.
 *
 * @example
 * <Center className="flex-1">
 *   <Spinner size="large" />
 *   <Text className="mt-2">Loading...</Text>
 * </Center>
 *
 * @example
 * // Пустое состояние
 * <Center className="flex-1 p-6">
 *   <Icon name="inbox" size={48} />
 *   <Text className="mt-4 text-muted-foreground">No items found</Text>
 * </Center>
 */
export function Center({ className, ...props }: CenterProps) {
  return (
    <View
      className={cn('items-center justify-center', className)}
      {...props}
    />
  );
}
