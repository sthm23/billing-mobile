import { CreateStaffScreen } from "@/screens/profile/CreateStaffScreen";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * New employee (OWNER only). Reached from Profile → Staff.
 */
export default function CreateStaffRoute() {
    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-bg">
            <CreateStaffScreen />
        </SafeAreaView>
    );
}
