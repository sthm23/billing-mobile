import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddIcon } from '@/components/ui/icon';
import { Text } from "@/components/ui/text";
import { useProductById } from "@/services/product/product.queries";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ProductGetByIdLayout() {
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
                    <Button
                        onPress={() => {
                            handleCloseCashbox()
                        }}
                    >
                        <ButtonIcon as={AddIcon} />
                        <ButtonText>{t('product.create')}</ButtonText>
                    </Button>
                )
            }
        })

    }, [navigation, count]);

    const { data: product, isLoading, isError } = useProductById(id);

    if (isError) {
        return (
            <Text>Ошибка загрузки продукта</Text>
        )
    }
    if (isLoading) {
        return (
            <Text>Загрузка...</Text>
        )
    }

    if (!product) {
        return (
            <Text>Продукт не найден</Text>
        )
    }

    return (
        <Card>
            <Text>Name: {product.name}</Text>
            <Text>variant: {product.variants.length > 0 ? product.variants[0].price : 'No variants'}</Text>
        </Card>
    )
}