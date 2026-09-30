import React, { createContext, useContext, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  type ViewProps,
  type TextProps,
} from 'react-native';
import { cn } from '@/libs/utils';

interface SelectContextValue {
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  placeholder?: string;
  selectedLabel?: string;
}

const SelectContext = createContext<SelectContextValue>({
  isOpen: false,
  setIsOpen: () => {},
});

export interface SelectProps {
  children: React.ReactNode;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
}

export interface SelectTriggerProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'outline' | 'underlined' | 'rounded';
  size?: 'sm' | 'md' | 'lg';
}

export interface SelectInputProps extends TextProps {
  placeholder?: string;
  className?: string;
}

export interface SelectIconProps {
  as: React.ComponentType<any>;
  className?: string;
  size?: number;
  color?: string;
}

export interface SelectPortalProps {
  children: React.ReactNode;
}

export interface SelectBackdropProps extends ViewProps {}

export interface SelectContentProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export interface SelectDragIndicatorWrapperProps extends ViewProps {
  children: React.ReactNode;
}

export interface SelectDragIndicatorProps extends ViewProps {}

export interface SelectItemProps extends ViewProps {
  label: string;
  value: string;
  className?: string;
}

const variantClasses = {
  outline: 'border border-border rounded-lg',
  underlined: 'border-b border-border',
  rounded: 'border border-border rounded-full',
};

const sizeClasses = {
  sm: 'h-10 px-3',
  md: 'h-12 px-4',
  lg: 'h-14 px-5',
};

/**
 * Select — выпадающий список
 *
 * Компонент выбора значения из списка опций.
 * Реализован на базе Modal для кроссплатформенности.
 *
 * @example
 * <Select selectedValue={value} onValueChange={setValue}>
 *   <SelectTrigger>
 *     <SelectInput placeholder="Select option" />
 *     <SelectIcon as={ChevronDownIcon} />
 *   </SelectTrigger>
 *   <SelectPortal>
 *     <SelectBackdrop />
 *     <SelectContent>
 *       <SelectItem label="Option 1" value="opt1" />
 *       <SelectItem label="Option 2" value="opt2" />
 *     </SelectContent>
 *   </SelectPortal>
 * </Select>
 */
export function Select({ children, selectedValue, onValueChange }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>();

  const handleValueChange = (value: string, label: string) => {
    setSelectedLabel(label);
    onValueChange?.(value);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        selectedValue,
        onValueChange: (value: string) => handleValueChange(value, ''),
        isOpen,
        setIsOpen,
        selectedLabel,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

/**
 * SelectTrigger — кнопка для открытия списка
 */
export function SelectTrigger({
  className,
  children,
  variant = 'outline',
  size = 'md',
  ...props
}: SelectTriggerProps) {
  const { setIsOpen } = useContext(SelectContext);

  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-between bg-background',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onPress={() => setIsOpen(true)}
      {...props}
    >
      {children}
    </Pressable>
  );
}

/**
 * SelectInput — отображение выбранного значения
 */
export function SelectInput({ placeholder, className, ...props }: SelectInputProps) {
  const { selectedValue, selectedLabel } = useContext(SelectContext);

  return (
    <Text
      className={cn(
        'flex-1 text-base',
        !selectedValue && 'text-muted-foreground',
        className
      )}
      {...props}
    >
      {selectedLabel || selectedValue || placeholder}
    </Text>
  );
}

/**
 * SelectIcon — иконка (обычно стрелка вниз)
 */
export function SelectIcon({ as: IconComponent, className, size = 20, color, ...props }: SelectIconProps) {
  return (
    <View className={cn('ml-2', className)}>
      <IconComponent size={size} color={color} {...props} />
    </View>
  );
}

/**
 * SelectPortal — портал для модального окна
 */
export function SelectPortal({ children }: SelectPortalProps) {
  const { isOpen } = useContext(SelectContext);

  if (!isOpen) return null;

  return <>{children}</>;
}

/**
 * SelectBackdrop — затемненный фон
 */
export function SelectBackdrop({ ...props }: SelectBackdropProps) {
  return null; // Handled by SelectContent
}

/**
 * SelectContent — контейнер списка опций
 */
export function SelectContent({ className, children, ...props }: SelectContentProps) {
  const { setIsOpen } = useContext(SelectContext);

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={() => setIsOpen(false)}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-end bg-black/50"
        onPress={() => setIsOpen(false)}
      >
        <Pressable
          className={cn(
            'bg-background rounded-t-3xl pb-6 max-h-96',
            className
          )}
          onPress={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * SelectDragIndicatorWrapper — обертка для индикатора перетаскивания
 */
export function SelectDragIndicatorWrapper({ children, ...props }: SelectDragIndicatorWrapperProps) {
  return (
    <View className="items-center py-3" {...props}>
      {children}
    </View>
  );
}

/**
 * SelectDragIndicator — индикатор перетаскивания
 */
export function SelectDragIndicator({ ...props }: SelectDragIndicatorProps) {
  return (
    <View
      className="w-12 h-1 bg-border rounded-full"
      {...props}
    />
  );
}

/**
 * SelectItem — элемент списка
 */
export function SelectItem({ label, value, className, ...props }: SelectItemProps) {
  const { selectedValue, onValueChange, setIsOpen } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  const handlePress = () => {
    onValueChange?.(value);
    // Update context with label
    const context = useContext(SelectContext);
    (context as any).selectedLabel = label;
    setIsOpen(false);
  };

  return (
    <Pressable
      className={cn(
        'px-6 py-4 active:bg-accent',
        isSelected && 'bg-accent',
        className
      )}
      onPress={handlePress}
      {...props}
    >
      <Text
        className={cn(
          'text-base',
          isSelected ? 'font-semibold text-primary' : 'text-foreground'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
