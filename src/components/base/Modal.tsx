import React from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  type ModalProps as RNModalProps,
} from 'react-native';
import { cn } from '@/libs/utils';

export interface ModalProps extends Omit<RNModalProps, 'transparent' | 'animationType'> {
  /**
   * Controls visibility of the modal
   */
  visible: boolean;
  /**
   * Callback when modal is closed
   */
  onClose?: () => void;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Additional className for content container
   */
  className?: string;
  /**
   * Show close button (default: false)
   */
  showCloseButton?: boolean;
  /**
   * Close modal when backdrop is pressed (default: true)
   */
  closeOnBackdropPress?: boolean;
  /**
   * Animation type (default: 'fade')
   */
  animationType?: 'none' | 'fade' | 'slide';
}

/**
 * Modal — модальное окно
 *
 * Обертка над React Native Modal с поддержкой темной темы и семантических цветов.
 * По умолчанию центрирует контент, добавляет полупрозрачный фон и закругленные углы.
 *
 * @example
 * <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
 *   <Text>Modal content</Text>
 * </Modal>
 *
 * @example
 * // С кастомным стилем
 * <Modal
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   className="p-6 gap-4"
 * >
 *   <Heading>Confirm Action</Heading>
 *   <Text>Are you sure?</Text>
 *   <Button onPress={() => setIsOpen(false)}>OK</Button>
 * </Modal>
 *
 * @example
 * // С кнопкой закрытия
 * <Modal
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   showCloseButton
 * >
 *   <Text>Content with close button</Text>
 * </Modal>
 */
export function Modal({
  visible,
  onClose,
  children,
  className,
  showCloseButton = false,
  closeOnBackdropPress = true,
  animationType = 'fade',
  ...props
}: ModalProps) {
  const handleBackdropPress = () => {
    if (closeOnBackdropPress && onClose) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
      {...props}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center p-4"
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <Pressable
          className={cn(
            'bg-card rounded-2xl p-6 w-full max-w-md shadow-lg',
            className,
          )}
          onPress={(e) => e.stopPropagation()}
        >
          {showCloseButton && onClose && (
            <Pressable
              onPress={onClose}
              className="absolute top-4 right-4 p-2 rounded-full active:bg-accent"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <View className="w-5 h-5 items-center justify-center">
                {/* Simple X icon using View */}
                <View className="absolute w-4 h-0.5 bg-foreground rotate-45" />
                <View className="absolute w-4 h-0.5 bg-foreground -rotate-45" />
              </View>
            </Pressable>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
