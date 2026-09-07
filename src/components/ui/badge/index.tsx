import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';
import { cn } from '@/libs/utils';

type BadgeVariant = 'solid' | 'outline';
type BadgeAction = 'primary' | 'success' | 'error' | 'warning' | 'muted';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  action?: BadgeAction;
  size?: BadgeSize;
  children: React.ReactNode;
}

interface BadgeTextProps extends TextProps {
  children: React.ReactNode;
}

const badgeVariants = {
  solid: {
    primary: 'bg-primary',
    success: 'bg-success-600',
    error: 'bg-error-600',
    warning: 'bg-warning-600',
    muted: 'bg-gray-400',
  },
  outline: {
    primary: 'border border-primary bg-transparent',
    success: 'border border-success-600 bg-transparent',
    error: 'border border-error-600 bg-transparent',
    warning: 'border border-warning-600 bg-transparent',
    muted: 'border border-gray-400 bg-transparent',
  },
};

const badgeTextVariants = {
  solid: {
    primary: 'text-white',
    success: 'text-white',
    error: 'text-white',
    warning: 'text-white',
    muted: 'text-white',
  },
  outline: {
    primary: 'text-primary',
    success: 'text-success-600',
    error: 'text-error-600',
    warning: 'text-warning-600',
    muted: 'text-gray-600',
  },
};

const badgeSizes = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
  lg: 'px-4 py-1.5',
};

const badgeTextSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const Badge = React.forwardRef<View, BadgeProps>(
  ({ variant = 'solid', action = 'primary', size = 'md', className, children, ...props }, ref) => {
    const variantClass = badgeVariants[variant][action];
    const sizeClass = badgeSizes[size];

    return (
      <View
        ref={ref}
        className={cn('inline-flex items-center justify-center rounded-md', variantClass, sizeClass, className)}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Badge.displayName = 'Badge';

export const BadgeText = React.forwardRef<Text, BadgeTextProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn('font-medium', className)}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

BadgeText.displayName = 'BadgeText';
