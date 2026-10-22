import { useTheme } from '@/hooks/use-theme';
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

// STHM fields are filled, without borders; `outline` / `underlined` are kept for compatibility.
const variantClasses = {
  outline: 'rounded-md',
  underlined: 'rounded-md',
  rounded: 'rounded-pill',
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
  const colors = useTheme();
  const pickerStyle = Platform.select({
    ios: { color: colors.ink },
    android: {
      color: colors.ink,
      marginLeft: -8, // Compensate for Android padding
    },
  });

  const pickerItemStyle = Platform.select({
    ios: {
      fontSize: 16,
      height: 120,
      color: colors.ink,
    },
    android: undefined,
  });

  return (
    <View
      className={cn(
        'overflow-hidden justify-center bg-sunken px-2',
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
        dropdownIconColor={colors.muted}
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
