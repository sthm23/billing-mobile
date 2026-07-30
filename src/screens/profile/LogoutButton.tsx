import { Button, ButtonText } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import CustomIcon from "@/icons/custom-icon";
import { IconNames } from "@/icons/icon.type";

type LogoutButtonProps = {
    onLogOutPress: () => void;
};


const LogoutButton = ({ onLogOutPress }: LogoutButtonProps) => {
    const color = useTheme()
    return (
        <Button
            variant="secondary"
            className="w-full bg-red-100 rounded-2xl h-15 border-[#e7000b] dark:border-[#ff6467]"
            onPress={onLogOutPress}
        >
            <CustomIcon name={IconNames.LOGOUT} color={color.destructive} />
            <ButtonText className="text-[#e7000b] dark:text-[#ff6467] text-lg">Log out</ButtonText>
        </Button>
    );
};

export default LogoutButton;