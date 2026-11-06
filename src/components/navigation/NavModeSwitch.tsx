import { Segmented } from '@/components/base';
import { useStoreMode, type NavMode } from '@/hooks/use-store-mode';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * «Заказы | Аренды» on top of the orders and rentals lists of a store with both
 * modes: switches the bottom menu and opens the other list. Renders nothing
 * in a store with one mode.
 */
export function NavModeSwitch() {
  const { t } = useTranslation();
  const { isMixed, navMode, setNavMode } = useStoreMode();

  if (!isMixed) return null;

  const change = (mode: NavMode) => {
    if (mode === navMode) return;
    void setNavMode(mode);
    router.replace(mode === 'rent' ? '/(tabs)/(rentals)' : '/(tabs)/(orders)');
  };

  return (
    <Segmented<NavMode>
      options={[
        { value: 'sale', label: t('navigation.orders') },
        { value: 'rent', label: t('navigation.rentals') },
      ]}
      value={navMode}
      onChange={change}
    />
  );
}
