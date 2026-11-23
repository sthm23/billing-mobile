import { SafeAreaView } from '@/components/base/SafeAreaView';
import { VoiceReviewScreen } from '@/screens/order/voice/VoiceReviewScreen';

export default function VoiceReviewPage() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <VoiceReviewScreen />
    </SafeAreaView>
  );
}
