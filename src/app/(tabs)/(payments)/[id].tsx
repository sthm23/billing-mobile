import Card from "@/components/card";
import Carousel from "@/components/carusel";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import CustomIcon from "@/icons/custom-icon";
import { IconNames } from "@/icons/icon.type";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function CreatePaymentLayout() {
    const colors=useTheme()
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [count, setCount] = useState(0);

    const handleCloseCashbox = () => {
        setCount(count + 1);
    }

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => {
                return (
                    <Button variant='error'
                    onPress={() => {
                        handleCloseCashbox()
                    }}
                    >
                       <View className="flex-row gap-2 items-center justify-center">
                        <CustomIcon name={IconNames.LOCK} color={colors.white} />
                        <Text className="text-white">{t('payment.closeCashbox')}</Text>
                    </View> 
                        </Button>
                )
            }
        })
        
    }, [navigation, count]);

    const paymentMethods = [
        { id: '1', name: 'Naqt', amount: 150000000 },
        { id: '2', name: 'Karta', amount: 5000000 },
        { id: '3', name: 'Click', amount: 150000000 },
        { id: '4', name: 'Otkazma', amount: 150000000 },
    ];
     
    return (
        <ThemedView type='surface' className="w-full h-full flex-col gap-4 p-4">
            <View className="w-full flex-row items-center justify-between">
                <ThemedView className="border border-border dark:border-border-dark rounded-2xl px-4 py-2">
                    <ThemedView className="flex-row items-center gap-2">
                        <View className="border border-error dark:border-error-dark rounded-full">
                            <CustomIcon name={IconNames.ARROW_UP} color={colors.error}/>
                        </View>
                        <ThemedText>Xarajat</ThemedText>
                    </ThemedView>
                    <ThemedText>10.000.000 uzs</ThemedText>
                </ThemedView>
                <ThemedView className="border border-border dark:border-border-dark rounded-2xl px-4 py-2">
                    <ThemedView className="flex-row items-center gap-2">
                        <View className="border border-success dark:border-success-dark rounded-full">
                            <CustomIcon name={IconNames.ARROW_DOWN} color={colors.success} />
                        </View>
                        <ThemedText>Kirim</ThemedText>
                    </ThemedView>
                    <ThemedText>10.000.000 uzs</ThemedText>
                </ThemedView>
            </View>
            <Card className="w-full items-start p-4 flex-col gap-4">
                <ThemedView>
                    <ThemedText type='subtitle'>Total Balance</ThemedText>
                    <ThemedText type='title'>20.000.000 UZS</ThemedText>
                </ThemedView>
                <Carousel>
                    {paymentMethods.map((method) => (
                        <View key={method.id} className='w-50 flex-row gap-2 border border-border dark:border-border-dark rounded-lg p-2 mr-2'>
                            <View className='items-center justify-center'>
                                    <CustomIcon name={
                                        method.id === '1' ? 
                                        IconNames.MONEY : 
                                        method.id === '2' ? 
                                        IconNames.CREDIT_CARD : 
                                        method.id === '3' ? 
                                        IconNames.ONLINE_PAYMENT : 
                                        IconNames.TRANSFER} />
                                </View>
                            <View className='flex-col '>
                                <ThemedText>{method.name}</ThemedText>
                            <ThemedText>{method.amount.toLocaleString()} UZS</ThemedText>
                            </View>
                        </View>
                    ))}
                </Carousel>
            </Card>
                    <ThemedText type='subtitle' className="mt-4">{t('payment.transactions')}</ThemedText>
            <View className="w-full flex-row items-center justify-between gap-4">
                <Button variant='error' className="w-1/3" onPress={() => {}}>
                    <View className="flex-row gap-2 items-center justify-center">
                        <CustomIcon name={IconNames.ARROW_UP} color={colors.white} />
                        <Text className="text-white dark:text-white-dark">{t('payment.createOutgo')}</Text>
                    </View>
                </Button>

                <Button  className="w-1/3" onPress={() => {}}>
                    <View className="flex-row gap-2 items-center justify-center">
                        <CustomIcon name={IconNames.ARROW_DOWN} color={colors.white} />
                        <Text className="text-white dark:text-white-dark">{t('payment.type.INCOME')}</Text>
                    </View>
                </Button>

            </View>
        </ThemedView>
    )
}