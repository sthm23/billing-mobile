import SelectLanguage from "@/components/SelectLanguage";
import { SelectTheme } from "@/components/SelectTheme";
import { VStack } from "@/components/ui/vstack";

const SettingItems = () => {
    return (
        <VStack space="md">
            <SelectLanguage />
            <SelectTheme />
        </VStack>
    );
};

export default SettingItems