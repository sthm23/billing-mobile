import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import React from 'react';
import { TextInput, View, type TextInputProps, type ViewProps } from 'react-native';

export interface InputProps extends ViewProps {
  /**
   * `sunken` — field inside a card (default); `card` — field on `bg`.
   */
  variant?: 'sunken' | 'card';
  /**
   * `sm` 40px, `md` 48px, `lg` 52px (forms)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Error state: red ring (pair it with FormControlErrorText)
   */
  invalid?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface InputFieldProps extends TextInputProps {
  className?: string;
}

const sizeClasses = {
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-13',
};

/**
 * Input — field container (STHM): filled, no border, `rounded-md`.
 *
 * Put `InputField` (the TextInput) inside; icons or buttons can sit next to it.
 *
 * @example
 * <Input size="lg" invalid={!!errors.login}>
 *   <InputField placeholder={t('login.login')} value={value} onChangeText={onChange} />
 * </Input>
 */
export function Input({
  variant = 'sunken',
  size = 'md',
  invalid = false,
  className,
  children,
  ...props
}: InputProps) {
  return (
    <View
      className={cn(
        // Border is always reserved so the error ring doesn't shift the layout.
        'flex-row items-center gap-2.5 rounded-md px-4 border-[1.5px]',
        variant === 'card' ? 'bg-card' : 'bg-sunken',
        invalid ? 'border-err-fg' : 'border-transparent',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * InputField — the text input inside `Input`
 *
 * @example
 * <Input>
 *   <InputField placeholder="+998 90 123 45 67" keyboardType="phone-pad" />
 * </Input>
 */
export function InputField({ className, placeholderTextColor, ...props }: InputFieldProps) {
  const colors = useTheme();

  return (
    <TextInput
      className={cn('flex-1 min-w-0 h-full font-onest-medium text-[15px] text-ink', className)}
      placeholderTextColor={placeholderTextColor ?? colors.muted}
      {...props}
    />
  );
}
