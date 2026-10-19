import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  Modal as RNModal,
  type ModalProps as RNModalProps,
} from 'react-native';

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
  const colors = useTheme();
  const { t } = useTranslation();
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
        className="flex-1 bg-scrim items-center justify-center p-4"
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
      >
        <Pressable
          className={cn(
            'bg-card rounded-2xl p-6 w-full max-w-md',
            className,
          )}
          onPress={(e) => e.stopPropagation()}
        >
          {showCloseButton && onClose && (
            <Pressable
              onPress={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-sunken items-center justify-center active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <X size={16} color={colors.ink} strokeWidth={2.2} />
            </Pressable>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
