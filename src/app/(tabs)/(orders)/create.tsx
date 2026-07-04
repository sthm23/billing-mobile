import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SafeAreaView, } from "react-native-safe-area-context";

export default function CreateOrderLayout() {
    
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-background">
            <ThemedView type='surface' className="flex-row items-center justify-center p-4 rounded-lg">
                <ThemedText type='title'>{('order.noFound')}</ThemedText>
            </ThemedView>
        </SafeAreaView>
    )
}