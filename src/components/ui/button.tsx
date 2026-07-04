import { cn } from '@/libs/utils';
import { ComponentRef, forwardRef } from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';

export interface ButtonProps extends PressableProps {
  variant?: 'default' | 'error' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
  loading?: boolean;
  disabled?: boolean;
}

const buttonVariants = {
  variant: {
    default: 'bg-primary dark:bg-primary-dark',
    error: 'bg-error dark:bg-error-dark',
    outline: 'border-2 border-border dark:border-border-dark bg-transparent',
    secondary: 'bg-secondary dark:bg-secondary-dark',
    ghost: 'bg-transparent',
    link: 'bg-transparent',
  },
  size: {
    default: 'h-12 px-4 py-3',
    sm: 'h-9 px-3 py-2',
    lg: 'h-14 px-8 py-4',
    icon: 'h-10 w-10',
  },
  textVariant: {
    default: 'text-primary-text dark:text-primary-text-dark',
    error: 'text-white dark:text-white',
    outline: 'text-primary-text dark:text-primary-text-dark',
    secondary: 'text-secondary-text dark:text-secondary-text-dark',
    ghost: 'text-primary-text dark:text-primary-text-dark',
    link: 'text-primary-text dark:text-primary-text-dark underline',
  },
  textSize: {
    default: 'font-medium',
    sm: 'text-sm font-medium',
    lg: 'text-lg font-semibold',
    icon: 'text-base',
  },
};

export const Button = forwardRef<ComponentRef<typeof Pressable>, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'default',
      className,
      textClassName,
      children,
      loading = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <Pressable
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'flex-row items-center justify-center rounded-lg active:opacity-80',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          isDisabled && 'opacity-50',
          className
        )}
        {...props}
      >
        {loading && (
          <ActivityIndicator
            size="small"
            className={cn(buttonVariants.textVariant[variant])}
            style={{ marginRight: 8 }}
          />
        )}
        {typeof children === 'string' ? (
          <Text
            className={cn(
              buttonVariants.textVariant[variant],
              buttonVariants.textSize[size],
              textClassName
            )}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

