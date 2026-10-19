import { Button } from "@/components/base";
import { LogOut } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type LogoutButtonProps = {
    onLogOutPress: () => void;
};

const LogoutButton = ({ onLogOutPress }: LogoutButtonProps) => {
    const { t } = useTranslation();

    return (
        <Button variant="danger" size="lg" full icon={LogOut} onPress={onLogOutPress}>
            {t('profile.logout')}
        </Button>
    );
};

export default LogoutButton;
