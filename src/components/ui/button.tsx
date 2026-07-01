import { cn } from '@/libs/utils';
import { ComponentRef, forwardRef } from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';

export interface ButtonProps extends PressableProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
  loading?: boolean;
  disabled?: boolean;
}

const buttonVariants = {
  variant: {
    default: 'bg-slate-900 dark:bg-slate-50',
    destructive: 'bg-red-500 dark:bg-red-900',
    outline: 'border-2 border-slate-200 dark:border-slate-800 bg-transparent',
    secondary: 'bg-slate-100 dark:bg-slate-800',
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
    default: 'text-slate-50 dark:text-slate-900',
    destructive: 'text-white dark:text-white',
    outline: 'text-slate-900 dark:text-slate-50',
    secondary: 'text-slate-900 dark:text-slate-50',
    ghost: 'text-slate-900 dark:text-slate-50',
    link: 'text-slate-900 dark:text-slate-50 underline',
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
            color={variant === 'default' || variant === 'destructive' ? '#ffffff' : '#000000'}
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

