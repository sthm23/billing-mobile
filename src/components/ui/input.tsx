import { cn } from '@/libs/utils';
import { ComponentRef, forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { ThemedText } from '../themed-text';

export interface InputProps extends TextInputProps {
  value?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
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
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled;


    return (
        <>
            {label && <ThemedText className="mb-2" type="small">{label}</ThemedText>}
            <TextInput
                ref={ref}
                editable={!isDisabled}
                placeholder={placeholder}
                value={value}
                className={cn(
                tokens.root,
                tokens.base,
                tokens.size,
                isDisabled && 'opacity-50',
                className
                )}
                {...props}
            />
        </>
    );
  }
);

Input.displayName = 'Input';

