import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ViewProps, TextProps } from 'react-native';
import { cn } from '@/libs/utils';

interface SelectProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  selectedValue?: string;
}

interface SelectTriggerProps extends ViewProps {
  variant?: 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

interface SelectInputProps extends TextProps {
  placeholder?: string;
}

interface SelectIconProps {
  as: React.ComponentType<any>;
  className?: string;
}

interface SelectItemProps {
  label: string;
  value: string;
}

interface SelectContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

export const Select: React.FC<SelectProps> = ({ children, onValueChange, selectedValue }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, selectedValue, onValueChange, placeholder: '' }}>
      {children}
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  variant = 'outline',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const { setIsOpen } = useSelectContext();

  const variantClass = variant === 'outline' ? 'border border-input-border' : 'bg-surface';
  const sizeClass = size === 'md' ? 'h-12 px-4' : size === 'lg' ? 'h-14 px-5' : 'h-10 px-3';

  return (
    <TouchableOpacity
      onPress={() => setIsOpen(true)}
      className={cn(
        'flex-row items-center justify-between rounded-lg',
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

export const SelectInput: React.FC<SelectInputProps> = ({ placeholder, className, ...props }) => {
  const { selectedValue } = useSelectContext();
  const context = React.useContext(SelectContext);

  if (context) {
    context.placeholder = placeholder || '';
  }

  return (
    <Text
      className={cn('flex-1 text-typography-900', !selectedValue && 'text-typography-400', className)}
      {...props}
    >
      {selectedValue || placeholder}
    </Text>
  );
};

export const SelectIcon: React.FC<SelectIconProps> = ({ as: IconComponent, className }) => {
  return <IconComponent className={cn('text-typography-500', className)} />;
};

export const SelectPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen } = useSelectContext();

  if (!isOpen) return null;

  return <>{children}</>;
};

export const SelectBackdrop: React.FC = () => {
  const { isOpen, setIsOpen } = useSelectContext();

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsOpen(false)}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={() => setIsOpen(false)}
      />
    </Modal>
  );
};

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen, setIsOpen } = useSelectContext();

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setIsOpen(false)}
    >
      <View className="flex-1 justify-end">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        />
        <View className="bg-background rounded-t-3xl max-h-96 border-t border-border">
          {children}
        </View>
      </View>
    </Modal>
  );
};

export const SelectDragIndicatorWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View className="w-full py-2 items-center">{children}</View>;
};

export const SelectDragIndicator: React.FC = () => {
  return <View className="w-12 h-1 bg-border rounded-full" />;
};

export const SelectItem: React.FC<SelectItemProps> = ({ label, value }) => {
  const { selectedValue, onValueChange, setIsOpen } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <TouchableOpacity
      className={cn(
        'px-5 py-4 border-b border-border',
        isSelected && 'bg-primary/10'
      )}
      onPress={() => {
        onValueChange?.(value);
        setIsOpen(false);
      }}
    >
      <Text className={cn('text-base', isSelected && 'font-bold text-primary')}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
