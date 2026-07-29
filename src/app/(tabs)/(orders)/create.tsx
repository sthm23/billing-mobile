import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { SafeAreaView, } from "react-native-safe-area-context";

export default function CreateOrderLayout() {

    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-background">
            <Box className="flex-row items-center justify-center p-4 rounded-lg">
                <Text size="2xl" bold>{('order.noFound')}</Text>
            </Box>
        </SafeAreaView>
    )
}