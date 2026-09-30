import React, { forwardRef } from 'react';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  type BottomSheetModalProps,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useColorScheme } from 'react-native';

export interface BottomSheetProps extends Omit<BottomSheetModalProps, 'snapPoints'> {
  /**
   * Snap points for the bottom sheet (e.g., ['50%', '90%'])
   */
  snapPoints?: string[] | number[];
  /**
   * Show backdrop (default: true)
   */
  showBackdrop?: boolean;
  /**
   * Close on backdrop press (default: true)
   */
  closeOnBackdropPress?: boolean;
  /**
   * Custom backdrop component
   */
  renderBackdrop?: (props: BottomSheetBackdropProps) => React.ReactNode;
}

/**
 * BottomSheet — нижняя выдвигающаяся панель
 *
 * Чистая обертка над @gorhom/bottom-sheet с семантическими цветами и упрощенным API.
 * Автоматически адаптируется к light/dark теме.
 *
 * @example
 * const bottomSheetRef = useRef<BottomSheetModal>(null);
 *
 * <Button onPress={() => bottomSheetRef.current?.present()}>
 *   Open Sheet
 * </Button>
 *
 * <BottomSheet ref={bottomSheetRef} snapPoints={['50%', '90%']}>
 *   <View className="p-4">
 *     <Text>Bottom sheet content</Text>
 *   </View>
 * </BottomSheet>
 *
 * @example
 * // С кастомным бэкдропом
 * <BottomSheet
 *   ref={bottomSheetRef}
 *   snapPoints={['60%']}
 *   enablePanDownToClose
 *   renderBackdrop={(props) => (
 *     <BottomSheetBackdrop {...props} opacity={0.5} />
 *   )}
 * >
 *   <View>Content</View>
 * </BottomSheet>
 *
 * @example
 * // Без бэкдропа
 * <BottomSheet
 *   ref={bottomSheetRef}
 *   snapPoints={['40%']}
 *   showBackdrop={false}
 * >
 *   <View>Content</View>
 * </BottomSheet>
 */
export const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(
  function BottomSheet(
    {
      snapPoints = ['50%', '90%'],
      showBackdrop = true,
      closeOnBackdropPress = true,
      renderBackdrop,
      children,
      ...props
    },
    ref
  ) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Semantic colors from design system
    const backgroundColor = isDark ? '#171717' : '#FFFFFF'; // bg-card
    const handleIndicatorColor = isDark ? '#737373' : '#A3A3A3'; // muted-foreground

    // Default backdrop component
    const defaultBackdrop = (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        opacity={0.5}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={closeOnBackdropPress ? 'close' : 'none'}
      />
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor }}
        handleIndicatorStyle={{ backgroundColor: handleIndicatorColor }}
        backdropComponent={
          showBackdrop ? (renderBackdrop || defaultBackdrop) : undefined
        }
        enablePanDownToClose
        {...props}
      >
        {children}
      </BottomSheetModal>
    );
  }
);
