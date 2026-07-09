import { useTheme } from "@/hooks/use-theme";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";

const _layout = () => {
  const colors = useTheme();
  const {t}= useTranslation();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.surface}
      labelStyle={{ selected: { color: colors.text } }}
      labelVisibilityMode="labeled"
      >

      <NativeTabs.Trigger name="(products)">
        <NativeTabs.Trigger.Label>{t('navigation.products')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md='list'
          sf='list.bullet'
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(orders)">
        <NativeTabs.Trigger.Label>{t('navigation.orders')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md='shopping_cart'
          sf='cart.fill'
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(search)">
        <NativeTabs.Trigger.Label>{t('navigation.search')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
        sf="magnifyingglass" md="search"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(payments)" >
        <NativeTabs.Trigger.Label>{t('navigation.payments')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
        sf="creditcard" md="credit_card"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Label>{t('navigation.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
        sf="person" md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default _layout