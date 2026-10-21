import type { ComponentProps, ReactElement } from 'react';
import { styled } from 'react-native-css';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

export type SafeAreaViewProps = ComponentProps<typeof RNSafeAreaView> & { className?: string };

/**
 * SafeAreaView that accepts `className`.
 *
 * On iOS/Android react-native-css wraps only `SafeAreaProvider` from
 * react-native-safe-area-context — its `SafeAreaView` ignores `className`
 * (`flex-1` was dropped and screens collapsed; on web it worked). Always
 * import SafeAreaView from here.
 *
 * @example
 * <SafeAreaView edges={['top']} className="flex-1 bg-bg">…</SafeAreaView>
 */
export const SafeAreaView = styled(RNSafeAreaView) as (props: SafeAreaViewProps) => ReactElement;
