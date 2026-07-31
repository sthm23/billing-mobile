import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useProducts } from "@/services/product/product.queries";
import { Product, ProductParams } from "@/services/product/product.type";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { ProductCard } from "./ProductCard";


export default function ProductPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [page, setPage] = useState(1)
    const [products, setProducts] = useState<Product[]>([])
    const pageSize = 10

    const listParams = useMemo<ProductParams>(
        () => ({
            currentPage: page,
            pageSize: pageSize,
            search: undefined,
            fromDate: undefined,
            toDate: undefined,
        }),
        [
            page,
            pageSize,
        ]
    )

    const { data, isLoading, isFetching, isError } = useProducts(listParams);

    useEffect(() => {
        if (!data?.data) {
            return
        }

        if (page === 1) {
            setProducts(data.data)
            return
        }

        setProducts((prev) => {
            const knownIds = new Set(prev.map((item) => item.id))
            const nextPageItems = data.data.filter((item) => !knownIds.has(item.id))
            return [...prev, ...nextPageItems]
        })
    }, [data, page])


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

    const hasMore = data ? data.currentPage * data.pageSize < data.total : false

    const handleLoadMore = () => {
        if (!hasMore || isFetching) {
            return
        }

        setPage((prev) => prev + 1)
    }

    const handleProductPress = (product: Product) => {
        router.push(`/(tabs)/(products)/${product.id}`);
    }

    return (
        <Box className="flex-1">
            <Box className="flex-row items-center justify-between px-4 py-2">
                <Text size="2xl" bold className="text-lg font-bold text-center">Продукты</Text>
                <Button onPress={() => console.log('Create button pressed')}>
                    <ButtonText>{t('order.create')}</ButtonText>
                </Button>
            </Box>
            <FlatList
                style={{ flex: 1 }}
                data={products}
                renderItem={({ item }) => <ProductCard product={item} onPress={handleProductPress} t={t} />}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, gap: 8 }}
                ListFooterComponent={
                    <Box>
                        {hasMore ? (
                            <Button onPress={handleLoadMore} disabled={isFetching}>
                                <ButtonText>{isFetching ? 'Загрузка...' : 'Выгрузить еще'}</ButtonText>
                            </Button>
                        ) : (
                            <Text className="text-center opacity-70">Больше продуктов нет</Text>
                        )}
                    </Box>
                }
            />
        </Box>
    )
}