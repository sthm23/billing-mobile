import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Package, Receipt, ScanBarcode, UserRound, Wallet } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/base';
import type { ButtonIconComponent } from '@/components/base';

/** Height of the floating bar (STHM design: 68px). */
const NAV_HEIGHT = 68;
/** Gap between the bar and the bottom edge when the device has no inset. */
const MIN_BOTTOM_OFFSET = 16;
/** Space between the last content item and the bar. */
const CONTENT_GAP = 16;

interface TabConfig {
  /** Route group name in src/app/(tabs) */
  name: string;
  /** i18n key */
  label: string;
  icon: ButtonIconComponent;
}

const LEFT_TABS: TabConfig[] = [
  { name: '(products)', label: 'navigation.products', icon: Package },
  { name: '(orders)', label: 'navigation.orders', icon: Receipt },
];

const RIGHT_TABS: TabConfig[] = [
  { name: '(cashbox)', label: 'navigation.cashbox', icon: Wallet },
  { name: '(profile)', label: 'navigation.profile', icon: UserRound },
];

function getBottomOffset(insetBottom: number): number {
  return Math.max(insetBottom, MIN_BOTTOM_OFFSET);
}

/**
 * Bottom padding a tab root screen needs so its last item isn't hidden
 * under the floating BottomNav. Apply it to the scroll container:
 * `contentContainerStyle={{ paddingBottom: bottomInset }}`.
 */
export function useBottomNavInset(): number {
  const insets = useSafeAreaInsets();

  return NAV_HEIGHT + getBottomOffset(insets.bottom) + CONTENT_GAP;
}

function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

/**
 * BottomNav — floating tab bar (STHM)
 *
 * Products · Orders · [Scan] · Cashbox · Profile. The center button starts a new
 * sale. Hidden on nested screens (details, create) and while the keyboard is open.
 * Used as `tabBar` of the (tabs) layout.
 */
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  const focusedRoute = state.routes[state.index];
  const isNestedScreen = (focusedRoute?.state?.index ?? 0) > 0;

  if (isNestedScreen || keyboardVisible) {
    return null;
  }

  const renderTab = (tab: TabConfig) => {
    const routeIndex = state.routes.findIndex((route) => route.name === tab.name);
    const route = state.routes[routeIndex];

    if (!route) {
      return null;
    }

    const focused = state.index === routeIndex;
    const Icon = tab.icon;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={tab.name}
        onPress={onPress}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        className="min-w-[52px] h-full items-center justify-center gap-[3px]"
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t(tab.label)}
      >
        <Icon size={22} color={focused ? colors.navInk : colors.navMuted} strokeWidth={2} />
        <Text
          className={cn(
            'text-[11px]',
            focused ? 'font-onest-semibold text-nav-ink' : 'font-onest-medium text-nav-muted',
          )}
          numberOfLines={1}
        >
          {t(tab.label)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className="absolute left-4 right-4 h-[68px] flex-row items-center justify-around px-2 bg-nav rounded-pill"
      style={{ bottom: getBottomOffset(insets.bottom) }}
      accessibilityRole="tablist"
    >
      {LEFT_TABS.map(renderTab)}
      <Pressable
        onPress={() => router.push('/(tabs)/(orders)/create')}
        className="w-[52px] h-[52px] rounded-full bg-accent items-center justify-center active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={t('navigation.newSale')}
      >
        <ScanBarcode size={24} color={colors.onAccent} strokeWidth={2.2} />
      </Pressable>
      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}
