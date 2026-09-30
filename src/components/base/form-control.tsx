import React, { createContext, useContext } from 'react';
import { View, Text, type ViewProps, type TextProps } from 'react-native';
import { cn } from '@/libs/utils';

interface FormControlContextValue {
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const FormControlContext = createContext<FormControlContextValue>({});

export interface FormControlProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export interface FormControlLabelProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export interface FormControlLabelTextProps extends TextProps {
  className?: string;
  children: React.ReactNode;
}

export interface FormControlErrorProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export interface FormControlErrorTextProps extends TextProps {
  className?: string;
  children: React.ReactNode;
}

export interface FormControlHelperProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export interface FormControlHelperTextProps extends TextProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * FormControl — контейнер для полей формы
 *
 * Обертка для поля ввода с лейблом, сообщением об ошибке и вспомогательным текстом.
 * Управляет состоянием валидации через контекст.
 *
 * @example
 * <FormControl isInvalid={!!errors.email}>
 *   <FormControlLabel>
 *     <FormControlLabelText>Email</FormControlLabelText>
 *   </FormControlLabel>
 *   <Input ... />
 *   {errors.email && (
 *     <FormControlError>
 *       <FormControlErrorText>{errors.email.message}</FormControlErrorText>
 *     </FormControlError>
 *   )}
 * </FormControl>
 *
 * @example
 * // С вспомогательным текстом
 * <FormControl>
 *   <FormControlLabel>
 *     <FormControlLabelText>Password</FormControlLabelText>
 *   </FormControlLabel>
 *   <Input type="password" />
 *   <FormControlHelper>
 *     <FormControlHelperText>Must be at least 8 characters</FormControlHelperText>
 *   </FormControlHelper>
 * </FormControl>
 */
export function FormControl({
  className,
  children,
  isInvalid = false,
  isRequired = false,
  isDisabled = false,
  ...props
}: FormControlProps) {
  return (
    <FormControlContext.Provider value={{ isInvalid, isRequired, isDisabled }}>
      <View className={cn('gap-1.5', className)} {...props}>
        {children}
      </View>
    </FormControlContext.Provider>
  );
}

/**
 * FormControlLabel — контейнер для лейбла
 */
export function FormControlLabel({ className, children, ...props }: FormControlLabelProps) {
  return (
    <View className={cn('mb-1', className)} {...props}>
      {children}
    </View>
  );
}

/**
 * FormControlLabelText — текст лейбла
 */
export function FormControlLabelText({ className, children, ...props }: FormControlLabelTextProps) {
  const { isRequired } = useContext(FormControlContext);

  return (
    <Text
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
      {isRequired && <Text className="text-error-500"> *</Text>}
    </Text>
  );
}

/**
 * FormControlError — контейнер для ошибки
 */
export function FormControlError({ className, children, ...props }: FormControlErrorProps) {
  return (
    <View className={cn('mt-1', className)} {...props}>
      {children}
    </View>
  );
}

/**
 * FormControlErrorText — текст ошибки
 */
export function FormControlErrorText({ className, children, ...props }: FormControlErrorTextProps) {
  return (
    <Text
      className={cn('text-xs text-error-600', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * FormControlHelper — контейнер для вспомогательного текста
 */
export function FormControlHelper({ className, children, ...props }: FormControlHelperProps) {
  return (
    <View className={cn('mt-1', className)} {...props}>
      {children}
    </View>
  );
}

/**
 * FormControlHelperText — вспомогательный текст
 */
export function FormControlHelperText({ className, children, ...props }: FormControlHelperTextProps) {
  return (
    <Text
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  );
}
