import React from 'react';
import {
  Pressable as RNPressable,
  type PressableProps as RNPressableProps,
} from 'react-native';
import { cn } from '@/libs/utils';

export interface PressableProps extends RNPressableProps {
  /**
   * Additional className for styling
   */
  className?: string;
}

/**
 * Pressable — базовый интерактивный компонент
 *
 * Обертка над React Native Pressable с поддержкой Tailwind классов.
 * Используйте для любых кликабельных элементов (карточки, области, кастомные кнопки).
 * Автоматически обрабатывает состояния нажатия, фокуса, hover.
 *
 * @example
 * // Простой pressable
 * <Pressable
 *   onPress={() => console.log('Pressed')}
 *   className="p-4 bg-card rounded-xl active:bg-accent"
 * >
 *   <Text>Tap me</Text>
 * </Pressable>
 *
 * @example
 * // Карточка продукта с pressable
 * <Pressable
 *   onPress={() => router.push(`/product/${id}`)}
 *   className="bg-card rounded-xl p-4 shadow-sm active:bg-accent"
 * >
 *   <Text className="text-lg font-bold">Product Name</Text>
 *   <Text className="text-sm text-muted-foreground">$99.99</Text>
 * </Pressable>
 *
 * @example
 * // С disabled состоянием
 * <Pressable
 *   disabled={loading}
 *   onPress={handleAction}
 *   className="p-4 bg-primary rounded-lg disabled:opacity-50"
 * >
 *   <Text className="text-primary-foreground">Submit</Text>
 * </Pressable>
 *
 * @example
 * // С динамическими стилями при нажатии
 * <Pressable
 *   onPress={handlePress}
 *   className={({ pressed }) =>
 *     cn('p-4 rounded-lg', pressed ? 'bg-accent' : 'bg-card')
 *   }
 * >
 *   <Text>Press me</Text>
 * </Pressable>
 *
 * @example
 * // Кастомная иконка кнопка
 * <Pressable
 *   onPress={onDelete}
 *   className="p-2 rounded-full active:bg-accent"
 *   accessibilityLabel="Delete item"
 *   accessibilityRole="button"
 * >
 *   <Icon name="trash" />
 * </Pressable>
 */
export function Pressable({
  className,
  disabled,
  accessibilityRole = 'button',
  ...props
}: PressableProps) {
  return (
    <RNPressable
      className={cn('active:opacity-70', disabled && 'opacity-50', className)}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        disabled: disabled ?? false,
      }}
      {...props}
    />
  );
}
