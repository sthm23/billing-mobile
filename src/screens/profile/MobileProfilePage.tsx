import { ListCard, Text } from "@/components/base";
import { EmptyState } from "@/components/common";
import { useBottomNavInset } from "@/components/navigation/BottomNav";
import { useTheme } from "@/hooks/use-theme";
import { UserRole } from "@/models/user.model";
import { useAuth } from "@/provider/AuthProvider";
import Constants from "expo-constants";
import { router } from "expo-router";
import { UserRoundX, UsersRound } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import LogoutButton from "./LogoutButton";
import ProfileCard from "./ProfileCard";
import SettingItems from "./SettingItems";

const MobileProfilePage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const colors = useTheme();
  const bottomInset = useBottomNavInset();
  const version = Constants.expoConfig?.version ?? '';

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
      {user.role === UserRole.OWNER ? (
        <ListCard
          leading={
            <View className="w-11 h-11 rounded-full bg-sunken items-center justify-center">
              <UsersRound size={20} color={colors.ink} strokeWidth={2} />
            </View>
          }
          title={t('staffCreate.entryTitle')}
          subtitle={t('staffCreate.entrySubtitle')}
          onPress={() => router.push('/(tabs)/(profile)/create')}
        />
      ) : null}
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
