import Carousel from "@/components/carusel";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, LockIcon } from '@/components/ui/icon';
import CustomIcon from "@/icons/custom-icon";
import { IconNames } from "@/icons/icon.type";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function CreatePaymentLayout() {
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
                    <Button variant='destructive'
                        onPress={() => {
                            handleCloseCashbox()
                        }}
                    >
                        <ButtonIcon as={LockIcon} />
                        <ButtonText>{t('payment.closeCashbox')}</ButtonText>
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
        <Box className="w-full h-full flex-col gap-4 p-4">
            <View className="w-full flex-row items-center justify-between">
                <Box className="border border-border rounded-2xl px-4 py-2">
                    <Box className="flex-row items-center gap-2">
                        <View className="border border-error rounded-full">
                            <CustomIcon name={IconNames.ARROW_UP} />
                        </View>
                        <Text>Xarajat</Text>
                    </Box>
                    <Text>10.000.000 uzs</Text>
                </Box>
                <Box className="border border-border rounded-2xl px-4 py-2">
                    <Box className="flex-row items-center gap-2">
                        <View className="border border-success rounded-full">
                            <CustomIcon name={IconNames.ARROW_DOWN} />
                        </View>
                        <Text>Kirim</Text>
                    </Box>
                    <Text>10.000.000 uzs</Text>
                </Box>
            </View>
            <Card className="w-full items-start p-4 flex-col gap-4">
                <Box>
                    <Text size="lg" bold>Total Balance</Text>
                    <Text size="2xl" bold>20.000.000 UZS</Text>
                </Box>
                <Carousel>
                    {paymentMethods.map((method) => (
                        <View key={method.id} className='w-50 flex-row gap-2 border border-border rounded-lg p-2 mr-2'>
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
                                <Text>{method.name}</Text>
                                <Text>{method.amount.toLocaleString()} UZS</Text>
                            </View>
                        </View>
                    ))}
                </Carousel>
            </Card>
            <Text size="lg" bold className="mt-4">{t('payment.transactions')}</Text>
            <View className="w-full flex-row items-center justify-between gap-4">
                <Button variant='destructive' className="w-1/3" onPress={() => { }}>
                    <ButtonIcon as={ArrowUpIcon} />
                    <ButtonText >{t('payment.createOutgo')}</ButtonText>
                </Button>

                <Button className="w-1/3" onPress={() => { }}>
                    <View className="flex-row gap-2 items-center justify-center">
                        <ButtonIcon as={ArrowDownIcon} />
                        <ButtonText >{t('payment.type.INCOME')}</ButtonText>
                    </View>
                </Button>

            </View>
        </Box>
    )
}