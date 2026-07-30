import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { ChevronRightIcon, Icon, ImageIcon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { useProducts } from "@/services/product/product.queries";
import { Product, ProductParams } from "@/services/product/product.type";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";


export default function ProductPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const page = 1
    const pageSize = 10
    const debouncedSearch = ''

    const listParams = useMemo<ProductParams>(
        () => ({
            currentPage: page,
            pageSize,
            search: debouncedSearch || undefined,
            fromDate: undefined,
            toDate: undefined,
        }),
        [
            page,
            pageSize,
            debouncedSearch,
        ]
    )

    const { data, isLoading, isError } = useProducts(listParams);


    if (isError) {
        return (
            <Text size="2xl" bold>Ошибка загрузки продуктов</Text>
        )
    }

    if (isLoading) {
        return (
            <Text size="2xl" bold>Загрузка...</Text>
        )
    }

    const products = data?.data ?? []

    const handleProductPress = (product: Product) => {
        router.push(`/(tabs)/(products)/${product.id}`);
    }

    const productCard = ({ item: product }: { item: Product }) => (
        <Pressable className="flex-row items-center gap-4 p-4 border border-gray-300 rounded-lg bg-card" key={product.id} onPress={() => handleProductPress(product)}>
            {product.images && product.images.length > 0 ? (
                <Avatar className="border-2 border-gray-300 rounded-lg h-15 w-15">
                    <AvatarFallbackText>{product.name}</AvatarFallbackText>
                    <AvatarImage source={{ uri: product.images[0].url }} />
                </Avatar>
            ) : (
                <Avatar className="border-2 border-gray-300 rounded-lg h-15 w-15">
                    <Icon as={ImageIcon} size="xl" />
                </Avatar>
            )}
            <Box>
                <Text size="md">Category: {t(`category.${product.category}`)}</Text>
                <Text size="lg" bold>{product.name}</Text>
                <Text size="md">Quantity: {product.variants.reduce((total, variant) => total + variant.quantity, 0)}</Text>
                <Text size="md">Price: {product.priceRange.min} - {product.priceRange.max}</Text>
            </Box>
            <Box className="flex-1 items-end justify-end">
                <Icon as={ChevronRightIcon} size="xl" />
            </Box>
        </Pressable>
    )

    return (
        <>
            <Box className="flex-row items-center justify-between px-4 py-2">
                <Text size="2xl" bold className="text-lg font-bold text-center">Продукты</Text>
                <Button onPress={() => console.log('Create button pressed')}>
                    <ButtonText>{t('order.create')}</ButtonText>
                </Button>
            </Box>
            <FlatList
                data={products}
                renderItem={productCard}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, gap: 8 }}
            />
            <Box className="mb-10">
                <Text className="mb-5 flex">Some thing should be here</Text>
            </Box>
        </>
    )
}