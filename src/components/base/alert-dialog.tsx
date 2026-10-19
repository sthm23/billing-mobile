import { cn } from '@/libs/utils';
import React, { createContext, useContext } from 'react';
import {
  Modal as RNModal,
  View,
  type ViewProps,
} from 'react-native';

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export interface AlertDialogBackdropProps extends ViewProps {}

export interface AlertDialogContentProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export interface AlertDialogHeaderProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export interface AlertDialogBodyProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export interface AlertDialogFooterProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full',
};

const AlertDialogSizeContext = createContext<keyof typeof sizeClasses>('md');

/**
 * AlertDialog — диалоговое окно для важных уведомлений
 *
 * Центрированное модальное окно для подтверждения действий или важных сообщений.
 *
 * @example
 * <AlertDialog isOpen={isOpen} onClose={onClose} size="md">
 *   <AlertDialogBackdrop />
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <Text>Confirm Action</Text>
 *     </AlertDialogHeader>
 *     <AlertDialogBody>
 *       <Text>Are you sure?</Text>
 *     </AlertDialogBody>
 *     <AlertDialogFooter>
 *       <Button onPress={onClose}>Cancel</Button>
 *       <Button onPress={handleConfirm}>Confirm</Button>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 */
export function AlertDialog({ isOpen, onClose, children, size = 'md' }: AlertDialogProps) {
  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <AlertDialogSizeContext.Provider value={size}>{children}</AlertDialogSizeContext.Provider>
    </RNModal>
  );
}

/**
 * AlertDialogBackdrop — затемненный фон
 */
export function AlertDialogBackdrop({ className, ...props }: AlertDialogBackdropProps) {
  return null; // Handled by AlertDialogContent
}

/**
 * AlertDialogContent — контейнер содержимого
 */
export function AlertDialogContent({ className, children, ...props }: AlertDialogContentProps) {
  const size = useContext(AlertDialogSizeContext);

  return (
    <View className="flex-1 bg-scrim items-center justify-center p-4">
      <View
        className={cn(
          'bg-card rounded-2xl w-full',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * AlertDialogHeader — заголовок диалога
 */
export function AlertDialogHeader({ className, children, ...props }: AlertDialogHeaderProps) {
  return (
    <View
      className={cn('px-6 pt-6 pb-4', className)}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * AlertDialogBody — тело диалога
 */
export function AlertDialogBody({ className, children, ...props }: AlertDialogBodyProps) {
  return (
    <View
      className={cn('px-6 py-4', className)}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * AlertDialogFooter — футер с кнопками
 */
export function AlertDialogFooter({ className, children, ...props }: AlertDialogFooterProps) {
  return (
    <View
      className={cn('px-6 pb-6 pt-4 flex-row gap-3 justify-end', className)}
      {...props}
    >
      {children}
    </View>
  );
}
