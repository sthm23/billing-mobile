import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { SafeAreaView, } from "react-native-safe-area-context";

export default function CreateProfileLayout() {

    return (
        <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-background">
            <Box>
                <Text size="2xl" bold>Create Profile page</Text>
            </Box>
        </SafeAreaView>
    )
}