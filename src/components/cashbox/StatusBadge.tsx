import { cn } from '@/libs/utils';
import { Text, View } from 'react-native';

interface StatusBadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * StatusBadge — цветной бадж для отображения статусов
 *
 * Использует семантические цвета и адаптируется к light/dark теме.
 *
 * @example
 * <StatusBadge label="Active" variant="success" />
 * <StatusBadge label="Closed" variant="error" />
 * <StatusBadge label="Pending" variant="warning" />
 */
export function StatusBadge({
  label,
  variant = 'default',
  size = 'sm',
  className
}: StatusBadgeProps) {
  // Variant styles — используем семантические и Tailwind цвета
  const variantStyles = {
    default: 'bg-muted',
    success: 'bg-green-100 dark:bg-green-900/30',
    error: 'bg-red-100 dark:bg-red-900/30',
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    info: 'bg-blue-100 dark:bg-blue-900/30',
  };

  // Text color styles
  const textVariantStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-700 dark:text-green-400',
    error: 'text-red-700 dark:text-red-400',
    warning: 'text-amber-700 dark:text-amber-400',
    info: 'text-blue-700 dark:text-blue-400',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
    lg: 'px-4 py-1.5',
  };

  // Text size styles
  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <View
      className={cn(
        'rounded-full self-start',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      <Text
        className={cn(
          'font-medium',
          textVariantStyles[variant],
          textSizeStyles[size],
        )}
      >
        {label}
      </Text>
    </View>
  );
}
