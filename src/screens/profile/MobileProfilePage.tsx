import { Text } from "@/components/base";
import { EmptyState } from "@/components/common";
import { useBottomNavInset } from "@/components/navigation/BottomNav";
import { useAuth } from "@/provider/AuthProvider";
import Constants from "expo-constants";
import { UserRoundX } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import LogoutButton from "./LogoutButton";
import ProfileCard from "./ProfileCard";
import SettingItems from "./SettingItems";

const MobileProfilePage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const bottomInset = useBottomNavInset();
  const version = Constants.expoConfig?.version ?? '';

  if (!user) {
    return <EmptyState icon={UserRoundX} message={t('profile.noUser')} />;
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="px-4 pt-2 gap-3"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomInset }}
    >
      <Text className="type-title text-ink pb-1" accessibilityRole="header">{t('profile.title')}</Text>
      <ProfileCard user={user} />
      <SettingItems />
      <View className="flex-1 justify-end gap-3 pt-3">
        <LogoutButton onLogOutPress={logout} />
        {version ? (
          <Text className="font-onest text-xs text-muted text-center">STHM · {t('app.version', { version })}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default MobileProfilePage;
