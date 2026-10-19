import { ComingSoonScreen } from "@/components/common";
import { UserRoundPlus } from "lucide-react-native";
import { useTranslation } from "react-i18next";

/**
 * Staff creation (OWNER only) arrives in redesign stage 4.
 */
export default function CreateStaffScreen() {
    const { t } = useTranslation();

    return <ComingSoonScreen title={t('user.createTitle')} icon={UserRoundPlus} />;
}
