import { VStack } from "@/components/base";
import { SelectLanguage } from "./SelectLanguage";
import { SelectTheme } from "./SelectTheme";

const SettingItems = () => {
    return (
        <VStack className="gap-4">
            <SelectLanguage />
            <SelectTheme />
        </VStack>
    );
};

export default SettingItems