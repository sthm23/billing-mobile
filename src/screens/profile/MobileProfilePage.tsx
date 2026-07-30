import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/provider/AuthProvider";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import LogoutButton from "./LogoutButton";
import ProfileCard from "./ProfileCard";
import SettingItems from "./SettingItems";

const MobileProfilePage = ({ isActive }: any) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { logout } = useAuth();
  // const router = useRouter();

  const handleLogout = () => {
    logout();
  }

  if (!user) {
    return (
      <Box className="flex-1 flex items-center justify-center">
        <Text>{t('profile.noUser')}</Text>
      </Box>
    )
  }

  return (
    <ScrollView
      style={{ display: isActive ? "flex" : "none", height: '100%', width: '100%' }}
      contentContainerStyle={{ justifyContent: "space-between", height: '100%', width: '100%' }}
    >
      <Box className="flex h-full px-5 py-4">
        <Box className="flex flex-col gap-4">
          <Heading className="mb-1" size="2xl">{t('profile.title')}</Heading>
          <ProfileCard user={user} />
          <Divider className="my-2" />
          <SettingItems />
        </Box>
        <Box className="flex-1 flex flex-col items-center justify-center gap-2">
          <LogoutButton
            onLogOutPress={handleLogout}
          />
          <Text>V 1.0.0</Text>
        </Box>
      </Box>
    </ScrollView>
  );
};

export default MobileProfilePage;