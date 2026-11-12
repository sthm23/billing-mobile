import { ListCard, Pressable, Segmented, Text } from "@/components/base";
import { EmptyState } from "@/components/common";
import { useBottomNavInset } from "@/components/navigation/BottomNav";
import { useStoreMode, type NavMode } from "@/hooks/use-store-mode";
import { useWorkingWarehouse } from "@/hooks/use-working-warehouse";
import { useTheme } from "@/hooks/use-theme";
import { UserRole } from "@/models/user.model";
import { useAuth } from "@/provider/AuthProvider";
import { isAdmin } from "@/libs/roles";
import { useAdminStoreCounts } from "@/services/admin-store";
import { useDebtors } from "@/services/debt";
import { useStaffList } from "@/services/store";
import Constants from "expo-constants";
import { router } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { HandCoins, Store, UserRoundX, UsersRound } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import LogoutButton from "./LogoutButton";
import ProfileCard from "./ProfileCard";
import SettingItems from "./SettingItems";
import { WorkingWarehouseCard } from "./WorkingWarehouseCard";

// Static pages in billing_ui/public; Russian is the default version.
const PRIVACY_POLICY_URLS: Record<string, string> = {
  ru: 'https://sthm23.uz/privacy.html',
  uz: 'https://sthm23.uz/privacy.uz.html',
  en: 'https://sthm23.uz/privacy.en.html',
};

const MobileProfilePage = () => {
  const { t, i18n } = useTranslation();
  const privacyPolicyUrl = PRIVACY_POLICY_URLS[i18n.language] ?? PRIVACY_POLICY_URLS.ru;
  const { user, logout } = useAuth();
  const colors = useTheme();
  const bottomInset = useBottomNavInset();
  const version = Constants.expoConfig?.version ?? '';
  const admin = isAdmin(user);
  // The platform admin has no store: no debtors / warehouse / modes
  const debtors = useDebtors({}, !admin);
  const storeCounts = useAdminStoreCounts(admin);
  const storeMode = useStoreMode();
  const working = useWorkingWarehouse();
  const staffList = useStaffList(
    { warehouseId: working.warehouseId },
    { enabled: user?.role === UserRole.OWNER && working.isReady }
  );

  if (!user) {
    return <EmptyState icon={UserRoundX} message={t('profile.noUser')} />;
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      // One prop only: on native contentContainerStyle replaces contentContainerClassName
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, gap: 12, paddingBottom: bottomInset }}
    >
      <Text className="type-title text-ink pb-1" accessibilityRole="header">{t('profile.title')}</Text>
      <ProfileCard user={user} />
      {admin ? (
        <ListCard
          leading={
            <View className="w-11 h-11 rounded-[14px] bg-accent items-center justify-center">
              <Store size={20} color={colors.onAccent} strokeWidth={2} />
            </View>
          }
          title={t('adminShops.title')}
          subtitle={
            storeCounts.data ? t('adminShops.entrySubtitle', { count: storeCounts.data.counts.total }) : undefined
          }
          onPress={() => router.push('/(tabs)/(profile)/shops')}
        />
      ) : (
        <WorkingWarehouseCard />
      )}
      {user.role === UserRole.OWNER ? (
        <ListCard
          leading={
            <View className="w-11 h-11 rounded-full bg-sunken items-center justify-center">
              <UsersRound size={20} color={colors.ink} strokeWidth={2} />
            </View>
          }
          title={t('staff.title')}
          subtitle={staffList.data ? t('staff.entrySubtitle', { count: staffList.data.counts.total }) : undefined}
          onPress={() => router.push('/(tabs)/(profile)/staff')}
        />
      ) : null}
      {user.role === UserRole.OWNER ? (
        <ListCard
          leading={
            <View className="w-11 h-11 rounded-full bg-sunken items-center justify-center">
              <Store size={20} color={colors.ink} strokeWidth={2} />
            </View>
          }
          title={t('storeSettings.title')}
          subtitle={t('storeSettings.entrySubtitle')}
          onPress={() => router.push('/(tabs)/(profile)/store-settings')}
        />
      ) : null}
      {/* Store with sales and rental: which one the bottom menu shows */}
      {storeMode.isMixed ? (
        <View className="bg-card rounded-xl p-4 gap-2.5">
          <Text className="type-label text-soft">{t('storeSettings.menuMode')}</Text>
          <Segmented<NavMode>
            options={[
              { value: 'sale', label: t('storeSettings.sales') },
              { value: 'rent', label: t('storeSettings.rental') },
            ]}
            value={storeMode.navMode}
            onChange={(mode) => void storeMode.setNavMode(mode)}
            variant="sunken"
          />
        </View>
      ) : null}
      {/* Any employee: debts belong to the store */}
      {admin ? null : <ListCard
        leading={
          <View className="w-11 h-11 rounded-[14px] bg-err-bg items-center justify-center">
            <HandCoins size={20} color={colors.errFg} strokeWidth={2} />
          </View>
        }
        title={t('debtors.title')}
        subtitle={debtors.data ? t('debtors.entrySubtitle', { count: debtors.data.summary.customers }) : undefined}
        amount={debtors.data?.summary.total}
        amountTone="err"
        onPress={() => router.push('/(tabs)/(profile)/debtors')}
      />}
      <SettingItems />
      <View className="flex-1 justify-end gap-3 pt-3">
        <LogoutButton onLogOutPress={logout} />
        <Pressable
          accessibilityRole="link"
          onPress={() => void openBrowserAsync(privacyPolicyUrl)}
          className="self-center py-1"
        >
          <Text className="font-onest text-xs text-muted text-center underline">{t('app.privacyPolicy')}</Text>
        </Pressable>
        {version ? (
          <Text className="font-onest text-xs text-muted text-center">STHM · {t('app.version', { version })}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default MobileProfilePage;
