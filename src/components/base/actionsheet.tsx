import React from 'react';
import {
  Modal,
  View,
  Pressable,
  Animated,
  type ViewProps,
} from 'react-native';
import { cn } from '@/libs/utils';

export interface ActionsheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface ActionsheetContentProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export interface ActionsheetBackdropProps extends ViewProps {}

export interface ActionsheetDragIndicatorWrapperProps extends ViewProps {
  children: React.ReactNode;
}

export interface ActionsheetDragIndicatorProps extends ViewProps {}

/**
 * Actionsheet — нижняя выдвигающаяся панель
 *
 * Компонент модального окна, которое появляется снизу экрана.
 * Альтернатива BottomSheet для простых случаев.
 *
 * @example
 * <Actionsheet isOpen={isOpen} onClose={onClose}>
 *   <ActionsheetBackdrop />
 *   <ActionsheetContent>
 *     <ActionsheetDragIndicatorWrapper>
 *       <ActionsheetDragIndicator />
 *     </ActionsheetDragIndicatorWrapper>
 *     <Text>Content here</Text>
 *   </ActionsheetContent>
 * </Actionsheet>
 */
export function Actionsheet({ isOpen, onClose, children }: ActionsheetProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {children}
    </Modal>
  );
}

/**
 * ActionsheetBackdrop — затемненный фон
 */
export function ActionsheetBackdrop({ className, ...props }: ActionsheetBackdropProps) {
  return null; // Handled by parent
}

/**
 * ActionsheetContent — контейнер содержимого
 */
export function ActionsheetContent({ className, children, ...props }: ActionsheetContentProps) {
  return (
    <Pressable
      className="flex-1 justify-end bg-black/50"
      onPress={(e) => {
        // Close only if clicked on backdrop, not content
        if (e.target === e.currentTarget) {
          const actionsheet = React.Children.toArray(children).find(
            (child: any) => child?.type === Actionsheet
          );
        }
      }}
    >
      <View
        className={cn(
          'bg-background rounded-t-3xl pb-4',
          className
        )}
        {...props}
      >
        {children}
      </View>
    </Pressable>
  );
}

/**
 * ActionsheetDragIndicatorWrapper — обертка для индикатора перетаскивания
 */
export function ActionsheetDragIndicatorWrapper({
  children,
  className,
  ...props
}: ActionsheetDragIndicatorWrapperProps) {
  return (
    <View
      className={cn('items-center py-3', className)}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * ActionsheetDragIndicator — индикатор перетаскивания
 */
export function ActionsheetDragIndicator({ className, ...props }: ActionsheetDragIndicatorProps) {
  return (
    <View
      className={cn('w-12 h-1 bg-border rounded-full', className)}
      {...props}
    />
  );
}
