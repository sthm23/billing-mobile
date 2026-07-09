import { useTheme } from "@/hooks/use-theme";
import { NativeTabs } from "expo-router/unstable-native-tabs";

const _layout = () => {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.surface}
      labelStyle={{ selected: { color: colors.text } }}>

      <NativeTabs.Trigger name="(products)">
        <NativeTabs.Trigger.Label>Products</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md='list'
          sf='list.bullet'
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(orders)">
        <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md='shopping_cart'
          sf='cart.fill'
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(search)">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
        sf="magnifyingglass" md="search"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(payments)">
        <NativeTabs.Trigger.Label>Payments</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
        sf="creditcard" md="credit_card"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
        sf="person" md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default _layout