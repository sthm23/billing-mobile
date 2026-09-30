import React from 'react';
import { View, Text, type ViewProps, type TextProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface BadgeProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'solid' | 'outline';
  action?: 'success' | 'error' | 'warning' | 'info' | 'muted';
  size?: 'sm' | 'md' | 'lg';
}

export interface BadgeTextProps extends TextProps {
  className?: string;
  children: React.ReactNode;
}

const variantClasses = {
  solid: {
    success: 'bg-success-500',
    error: 'bg-error-500',
    warning: 'bg-warning-500',
    info: 'bg-info-500',
    muted: 'bg-secondary',
  },
  outline: {
    success: 'border border-success-500 bg-success-50',
    error: 'border border-error-500 bg-error-50',
    warning: 'border border-warning-500 bg-warning-50',
    info: 'border border-info-500 bg-info-50',
    muted: 'border border-border bg-background',
  },
};

const textColorClasses = {
  solid: {
    success: 'text-white',
    error: 'text-white',
    warning: 'text-white',
    info: 'text-white',
    muted: 'text-secondary-foreground',
  },
  outline: {
    success: 'text-success-700',
    error: 'text-error-700',
    warning: 'text-warning-700',
    info: 'text-info-700',
    muted: 'text-foreground',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 rounded',
  md: 'px-2.5 py-1 rounded-md',
  lg: 'px-3 py-1.5 rounded-lg',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Badge — значок/метка
 *
 * Компактный индикатор статуса, категории или количества.
 *
 * @example
 * <Badge action="success" variant="solid">
 *   <BadgeText>Active</BadgeText>
 * </Badge>
 *
 * @example
 * <Badge action="error" variant="outline" size="sm">
 *   <BadgeText>Closed</BadgeText>
 * </Badge>
 *
 * @example
 * <Badge action="info">
 *   <BadgeText>New</BadgeText>
 * </Badge>
 */
export function Badge({
  className,
  children,
  variant = 'solid',
  action = 'muted',
  size = 'md',
  ...props
}: BadgeProps) {
  return (
    <View
      className={cn(
        'inline-flex items-center justify-center',
        sizeClasses[size],
        variantClasses[variant][action],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * BadgeText — текст внутри badge
 */
export function BadgeText({ className, children, ...props }: BadgeTextProps) {
  return (
    <Text
      className={cn(
        'font-medium',
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}
