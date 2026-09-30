import React from 'react';
import { Text, type TextProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface HeadingProps extends TextProps {
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * Heading level (affects size)
   */
  level?: 1 | 2 | 3 | 4;
}

/**
 * Heading — компонент заголовков
 *
 * Используется для заголовков разных уровней.
 * По умолчанию bold и использует semantic color.
 *
 * @example
 * <Heading level={1}>Main Title</Heading>
 * <Heading level={2}>Section Title</Heading>
 * <Heading level={3}>Subsection Title</Heading>
 *
 * @example
 * // С кастомными стилями
 * <Heading level={2} className="text-primary">
 *   Custom Color Heading
 * </Heading>
 */
export function Heading({
  className,
  level = 2,
  ...props
}: HeadingProps) {
  const levelStyles = {
    1: 'text-3xl font-bold',  // 30px
    2: 'text-2xl font-bold',  // 24px
    3: 'text-xl font-semibold',  // 20px
    4: 'text-lg font-semibold',  // 18px
  };

  return (
    <Text
      className={cn('text-foreground', levelStyles[level], className)}
      accessibilityRole="header"
      {...props}
    />
  );
}
