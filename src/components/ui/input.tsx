import { cn } from '@/libs/utils';
import { ComponentRef, forwardRef, useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { ThemedText } from '../themed-text';

export interface InputProps extends TextInputProps {
  value?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isRequired?: boolean;
}

const tokens = {
    root: 'flex-row items-center justify-start rounded-lg active:opacity-80',
    base: 'bg-white dark:bg-white-dark border border-border dark:border-border-dark text-primary dark:text-primary-dark placeholder:text-input-border dark:placeholder:text-input-border-dark',
    size: 'rounded-lg px-4 py-2 w-[200px]'
};

export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(
  (
    {
      value = '',
      label,
      placeholder,
      className,
      children,
      disabled = false,
      isRequired = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <>
            {label && <ThemedText className="mb-2" type="small">{label}</ThemedText>}
            <TextInput
                ref={ref}
                editable={!disabled}
                placeholder={placeholder}
                value={value}
                className={cn(
                tokens.root,
                tokens.base,
                tokens.size,
                disabled && 'opacity-50',
                isFocused && 'border-primary dark:border-primary-dark',
                isRequired && 'border-error dark:border-error-dark',
                className
                )}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />
        </>
    );
  }
);

Input.displayName = 'Input';

