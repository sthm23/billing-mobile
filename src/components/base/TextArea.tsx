import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

export interface TextAreaProps extends TextInputProps {
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * TextArea size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Error state (red ring)
   */
  error?: boolean;
  /**
   * Number of visible text rows (controls min height)
   */
  rows?: number;
}

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-[15px]',
  lg: 'px-4 py-3.5 text-base',
};

// Approximate line height per size, used for the min height.
const lineHeights = { sm: 20, md: 22, lg: 24 };

/**
 * TextArea — multi-line field (STHM): filled `sunken`, `rounded-md`, no border.
 *
 * @example
 * <TextArea placeholder="Например: аренда за октябрь" rows={3} value={comment} onChangeText={setComment} />
 *
 * @example
 * <TextArea error placeholder="Invalid value" />
 */
export function TextArea({
  className,
  size = 'md',
  error = false,
  rows = 3,
  editable = true,
  placeholderTextColor,
  style,
  ...props
}: TextAreaProps) {
  const colors = useTheme();
  const minHeight = rows * lineHeights[size] + 24;

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      className={cn(
        'rounded-md bg-sunken font-onest-medium text-ink border-[1.5px]',
        error ? 'border-err-fg' : 'border-transparent',
        sizeClasses[size],
        !editable && 'opacity-50',
        className,
      )}
      style={[{ minHeight }, style]}
      editable={editable}
      placeholderTextColor={placeholderTextColor ?? colors.muted}
      {...props}
    />
  );
}
