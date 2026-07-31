import { VStack } from "@/components/ui/vstack";
import { SelectLanguage } from "./SelectLanguage";
import { SelectTheme } from "./SelectTheme";

const SettingItems = () => {
    return (
        <VStack space="md">
            <SelectLanguage />
            <SelectTheme />
        </VStack>
    );
};

export default SettingItems