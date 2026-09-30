import { Box, Pressable, Text } from "@/components/base";
import { Image } from "react-native";
import { Product } from "@/models/product.model";

type ProductCardProps = {
    product: Product;
    onPress: (product: Product) => void;
    t: (key: string) => string;
};

export const ProductCard = ({ product, onPress, t }: ProductCardProps) => (
    <Pressable className="flex-row items-center p-4 border border-border rounded-lg bg-card" key={product.id} onPress={() => onPress(product)}>
        {product.images && product.images.length > 0 ? (
            <Image
                source={{ uri: product.images[0].url }}
                className="w-15 h-15 rounded-lg border-2 border-border"
            />
        ) : (
            <Box className="w-15 h-15 rounded-lg border-2 border-border bg-muted items-center justify-center">
                <Text className="text-muted-foreground">📷</Text>
            </Box>
        )}
        <Box className="flex-1 ml-4">
            <Text className="text-sm text-muted-foreground">Category: {t(`category.${product.category}`)}</Text>
            <Text className="text-lg font-bold text-foreground">{product.name}</Text>
            <Text className="text-sm text-foreground">Quantity: {product.variants.reduce((total, variant) => total + variant.quantity, 0)}</Text>
            <Text className="text-sm text-foreground">Price: {product.priceRange?.min ?? 0} - {product.priceRange?.max ?? 0}</Text>
        </Box>
        <Text className="text-muted-foreground text-xl">›</Text>
    </Pressable>
)