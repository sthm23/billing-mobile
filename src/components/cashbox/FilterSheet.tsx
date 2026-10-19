import { Text } from "@/components/base";
import { EmptyState } from "@/components/common";
import { BottomSheet } from "@expo/ui";
import { SlidersHorizontal } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export interface FilterSheetProps {
    isOpen: boolean;
    isClose: () => void;
}

/**
 * Cashbox filters (by date and warehouse) — not available yet.
 */
export function FilterSheet({ isOpen, isClose }: FilterSheetProps) {
    const { t } = useTranslation();

    return (
        <BottomSheet
            isPresented={isOpen}
            onDismiss={isClose}
            snapPoints={['half']}
        >
            <View className="flex-1 bg-card px-4 pt-2">
                <Text className="type-subhead text-ink">{t('common.filter')}</Text>
                <EmptyState icon={SlidersHorizontal} message={t('common.comingSoon')} />
            </View>
        </BottomSheet>
    );
}
