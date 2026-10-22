import { ComingSoonScreen } from "@/components/common";
import { Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { t } = useTranslation();

  // Theme and language live on the profile screen.
  return <ComingSoonScreen title={t('profile.settings')} icon={Settings} />;
}
