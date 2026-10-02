import { cn } from '@/libs/utils';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * Text variant for quick styling
   */
  variant?: 'default' | 'muted' | 'small' | 'large' | 'bold';

  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
}

/**
 * Text — базовый текстовый компонент
 *
 * Обертка над React Native Text с поддержкой Tailwind и вариантов.
 * По умолчанию использует semantic color (text-foreground).
 *
 * @example
 * <Text>Regular text</Text>
 *
 * @example
 * // С вариантами
 * <Text variant="muted">Secondary text</Text>
 * <Text variant="bold">Bold text</Text>
 * <Text variant="large">Large text</Text>
 *
 * @example
 * // С кастомными стилями
 * <Text className="text-lg font-semibold text-primary">
 *   Custom styled text
 * </Text>
 */
export function Text({
  className,
  size,
  variant = 'default',
  ...props
}: TextProps) {
  const variantStyles = {
    default: 'text-base text-foreground',
    muted: 'text-sm text-muted-foreground',
    small: 'text-xs text-foreground',
    large: 'text-lg text-foreground',
    variant='bold': 'text-base font-bold text-foreground',
  };

  return (
    <RNText
      className={cn(variantStyles[variant], size && `text-${size}`, className)}
      {...props}
    />
  );
}
