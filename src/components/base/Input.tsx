import React from 'react';
import { View, TextInput, type TextInputProps, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface InputProps extends ViewProps {
  variant?: 'outline' | 'underlined' | 'rounded';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export interface InputFieldProps extends TextInputProps {
  className?: string;
}

const variantClasses = {
  outline: 'border border-border rounded-lg',
  underlined: 'border-b border-border',
  rounded: 'border border-border rounded-full',
};

const sizeClasses = {
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-14',
};

/**
 * Input — контейнер для поля ввода
 *
 * @example
 * <Input variant="outline" size="md">
 *   <InputField placeholder="Enter text" />
 * </Input>
 */
export function Input({
  variant = 'outline',
  size = 'md',
  className,
  children,
  ...props
}: InputProps) {
  return (
    <View
      className={cn(
        'flex-row items-center bg-background px-4',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * InputField — текстовое поле ввода
 *
 * @example
 * <Input>
 *   <InputField placeholder="Email" keyboardType="email-address" />
 * </Input>
 */
export function InputField({
  className,
  placeholderTextColor = '#737373',
  ...props
}: InputFieldProps) {
  return (
    <TextInput
      className={cn('flex-1 text-base text-foreground', className)}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
}
