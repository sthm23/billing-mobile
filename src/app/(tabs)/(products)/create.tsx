import { ComingSoonScreen } from "@/components/common";
import { PackagePlus } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function CreateProductScreen() {
    const { t } = useTranslation();

    return <ComingSoonScreen title={t('product.createTitle')} icon={PackagePlus} />;
}
