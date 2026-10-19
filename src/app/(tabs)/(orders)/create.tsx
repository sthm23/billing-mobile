import { ComingSoonScreen } from "@/components/common";
import { ScanBarcode } from "lucide-react-native";
import { useTranslation } from "react-i18next";

/**
 * New sale — target of the BottomNav scan button.
 * Order creation with barcode scanning arrives in redesign stage 5.
 */
export default function CreateOrderScreen() {
    const { t } = useTranslation();

    return <ComingSoonScreen title={t('navigation.newSale')} icon={ScanBarcode} />;
}
