import { BottomSheet, Column, ScrollView, Text } from "@expo/ui";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";


export interface FilterSheetProps {
    isOpen: boolean;
    isClose: () => void;
}

export function FilterSheet({ isOpen, isClose }: FilterSheetProps) {

    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const ink = { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' };
    return (
        <BottomSheet
            isPresented={isOpen}
            onDismiss={isClose}
            snapPoints={['half', 'full']}
        >
            <ScrollView>
                <Column spacing={12}>
                    <Text textStyle={{ ...ink, fontSize: 20, fontWeight: '700' }}>Filter sheet</Text>
                    <Text textStyle={ink}>
                        {t('payment.info')}
                    </Text>
                </Column>
            </ScrollView>
        </BottomSheet>
    );
}