import { useTheme } from '@/hooks/use-theme';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import type { FlatListProps, ScrollViewProps, StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { styled } from 'react-native-css';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SNAP_POINTS = {
  full: ['92%'],
  half: ['55%'],
} as const;

export interface SheetProps {
  isOpen: boolean;
  /** Called when the sheet closes: swipe down, backdrop tap, back button */
  onClose: () => void;
  children: React.ReactNode;
  /**
   * `full` — 92% of the screen, `half` — about half; children fill it
   * (`flex-1`; use `SheetScrollView` / `SheetFlatList` for scrolling).
   * `auto` — fits the content.
   * @default 'full'
   */
  size?: 'full' | 'half' | 'auto';
}

/**
 * Sheet — bottom sheet on `@gorhom/bottom-sheet` (STHM)
 *
 * Swipe to close, backdrop, keyboard handling. Requires
 * `BottomSheetModalProvider` (root layout). Inside a sheet use `SheetScrollView`,
 * `SheetFlatList` and `SheetTextInput` instead of the React Native ones — they
 * cooperate with the sheet's gestures and keyboard.
 *
 * Not `@expo/ui` `BottomSheet`: on Android its React Native children get no
 * height and the sheet shows empty.
 *
 * @example
 * <Sheet isOpen={open} onClose={() => setOpen(false)}>
 *   <SheetScrollView contentContainerClassName="px-4 gap-3">…</SheetScrollView>
 * </Sheet>
 */
export function Sheet({ isOpen, onClose, children, size = 'full' }: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  // Present/dismiss only on a real change. dismiss() on a modal that was never
  // presented (a sheet mounted closed) marks it as unmounting in the provider,
  // and every later present() is ignored — the sheet never shows.
  const presented = useRef(false);

  useEffect(() => {
    if (isOpen && !presented.current) {
      presented.current = true;
      ref.current?.present();
    } else if (!isOpen && presented.current) {
      presented.current = false;
      ref.current?.dismiss();
    }
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    // Closed by the user (swipe, backdrop, back button) — sync, then tell the parent.
    presented.current = false;
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const isAuto = size === 'auto';

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={handleDismiss}
      snapPoints={isAuto ? undefined : [...SNAP_POINTS[size]]}
      enableDynamicSizing={isAuto}
      topInset={insets.top}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: colors.track, width: 40, height: 5 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {isAuto ? (
        // Measures the content for dynamic sizing; must not contain Sheet* scrollables.
        <BottomSheetView style={{ paddingBottom: insets.bottom }}>{children}</BottomSheetView>
      ) : (
        // A plain View, not BottomSheetView: on focus BottomSheetView marks the sheet
        // content as a non-scrollable view, overriding a nested SheetScrollView /
        // SheetFlatList (parent effects run after child effects) — lists won't scroll.
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>{children}</View>
      )}
    </BottomSheetModal>
  );
}

type ContentClassNames = { className?: string; contentContainerClassName?: string };

/** ScrollView for sheet content (accepts `className` / `contentContainerClassName`). */
// styled() builds its mapping type from every prop of the base component — over
// gorhom's or full RN prop types that is too deep for TypeScript (TS2589/TS2590).
// So it gets a minimal type, and the public type is set by the cast after it.
type StyleTargets = React.ComponentType<{ style?: StyleProp<ViewStyle>; contentContainerStyle?: StyleProp<ViewStyle> }>;

export const SheetScrollView = styled(BottomSheetScrollView as unknown as StyleTargets, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
}) as unknown as React.ComponentType<ScrollViewProps & ContentClassNames>;

/** FlatList for sheet content (accepts `className` / `contentContainerClassName`). */
export const SheetFlatList = styled(BottomSheetFlatList as unknown as StyleTargets, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
}) as unknown as <T>(props: FlatListProps<T> & ContentClassNames) => React.ReactElement;

/** TextInput that keeps the focused field above the keyboard inside a sheet (accepts `className`). */
export const SheetTextInput = styled(BottomSheetTextInput as unknown as StyleTargets) as unknown as React.ComponentType<
  TextInputProps & { className?: string }
>;
