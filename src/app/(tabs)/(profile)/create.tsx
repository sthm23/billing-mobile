import { CreateStaffScreen } from "@/screens/profile/CreateStaffScreen";
import { SafeAreaView } from '@/components/base/SafeAreaView';

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
