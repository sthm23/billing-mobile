import { Box, Text } from "@/components/base";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateOrderLayout() {
    const { t } = useTranslation();

    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-background">
            <Box className="flex-row items-center justify-center p-4 rounded-lg">
                <Text size="2xl" variant='bold'>{t('order.noFound')}</Text>
            </Box>
        </SafeAreaView>
    )
}