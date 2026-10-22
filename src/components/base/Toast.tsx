import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { Check, CircleAlert } from 'lucide-react-native';
import { useEffect, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';

export type ToastTone = 'success' | 'error';

interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

const DURATION_MS = 2600;

let current: ToastMessage | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function setCurrent(next: ToastMessage | null) {
  current = next;
  listeners.forEach((listener) => listener());
}

/**
 * toast — short in-app notification at the top of the screen (STHM)
 *
 * Call from anywhere; `ToastHost` (root layout) shows it. A new toast
 * replaces the previous one. Tap or 2.6 s hides it.
 *
 * @example
 * toast.show(t('product.addedToOrder'));
 * toast.show(t('common.error'), 'error');
 */
export const toast = {
  show(message: string, tone: ToastTone = 'success') {
    setCurrent({ id: nextId++, message, tone });
    AccessibilityInfo.announceForAccessibility(message);
  },
  /** Hides the toast (only the given one when `id` is passed). */
  hide(id?: number) {
    if (id === undefined || current?.id === id) setCurrent(null);
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getCurrent = () => current;

/** Renders the current toast above screens and sheets. Mount once in the root layout. */
export function ToastHost() {
  const message = useSyncExternalStore(subscribe, getCurrent, getCurrent);
  const insets = useSafeAreaInsets();
  const colors = useTheme();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => toast.hide(message.id), DURATION_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const isError = message?.tone === 'error';
  const Icon = isError ? CircleAlert : Check;

  return (
    // Always mounted so the exit animation can run; touches pass through.
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 1000, elevation: 1000 }}
    >
      {message && (
        <Animated.View key={message.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(180)}>
          <Pressable
            onPress={() => toast.hide(message.id)}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="flex-row items-center gap-3 rounded-2xl bg-nav pl-3 pr-4 py-3"
          >
            <View
              className={cn('w-8 h-8 rounded-full items-center justify-center', isError ? 'bg-err-bg' : 'bg-accent')}
            >
              <Icon size={18} color={isError ? colors.errFg : colors.onAccent} strokeWidth={2.4} />
            </View>
            <Text className="flex-1 font-onest-semibold text-[15px] text-nav-ink" numberOfLines={2}>
              {message.message}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
