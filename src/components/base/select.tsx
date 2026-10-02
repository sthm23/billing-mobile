import { cn } from '@/libs/utils';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { Platform, View } from 'react-native';

export interface SelectProps<T = string> {
  /**
   * Currently selected value
   */
  selectedValue?: T;
  /**
   * Callback when value changes
   */
  onValueChange?: (value: T) => void;
  /**
   * Style variant
   */
  variant?: 'outline' | 'underlined' | 'rounded';
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * Select items as children
   */
  children: React.ReactNode;
  /**
   * Whether the select is disabled
   */
  disabled?: boolean;
}

export interface SelectItemProps {
  /**
   * Display label
   */
  label: string;
  /**
   * Value to be selected
   */
  value: string | number;
  /**
   * Text color (platform-specific)
   */
  color?: string;
  /**
   * Font family (iOS only)
   */
  fontFamily?: string;
}

const variantClasses = {
  outline: 'border border-border rounded-lg',
  underlined: 'border-b border-border',
  rounded: 'border border-border rounded-full',
};

const sizeClasses = {
  sm: 'h-12',
  md: 'h-14',
  lg: 'h-16',
};

/**
 * Select — нативный выпадающий список
 *
 * Обертка над нативным Picker (@react-native-picker/picker).
 * Показывает нативный UI для каждой платформы:
 * - Android: dropdown меню
 * - iOS: wheel picker
 *
 * @example
 * <Select selectedValue={value} onValueChange={setValue}>
 *   <Select.Item label="Option 1" value="opt1" />
 *   <Select.Item label="Option 2" value="opt2" />
 * </Select>
 *
 * @example
 * // С вариантами стиля
 * <Select
 *   variant="outline"
 *   size="md"
 *   selectedValue={category}
 *   onValueChange={setCategory}
 * >
 *   {categories.map((cat) => (
 *     <Select.Item key={cat.id} label={cat.name} value={cat.id} />
 *   ))}
 * </Select>
 */
export function Select<T = string>({
  selectedValue,
  onValueChange,
  variant = 'outline',
  size = 'md',
  className,
  children,
  disabled = false,
}: SelectProps<T>) {
  const pickerStyle = Platform.select({
    ios: {},
    android: {
      marginLeft: -8, // Compensate for Android padding
    },
  });

  const pickerItemStyle = Platform.select({
    ios: {
      fontSize: 16,
      height: 120,
    },
    android: undefined,
  });

  return (
    <View
      className={cn(
        'overflow-hidden justify-center bg-background',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50',
        className
      )}
    >
      <Picker
        selectedValue={selectedValue}
        onValueChange={(itemValue) => onValueChange?.(itemValue as T)}
        enabled={!disabled}
        style={pickerStyle}
        itemStyle={pickerItemStyle}
      >
        {children}
      </Picker>
    </View>
  );
}

/**
 * SelectItem — элемент списка
 */
Select.Item = function SelectItem({ label, value, color, fontFamily }: SelectItemProps) {
  return <Picker.Item label={label} value={value} color={color} fontFamily={fontFamily} />;
};
