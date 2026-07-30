import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { ChevronRightIcon, Icon, ImageIcon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Product } from "@/models/product.model";

type ProductCardProps = {
    product: Product;
    onPress: (product: Product) => void;
    t: (key: string) => string;
};

export const ProductCard = ({ product, onPress, t }: ProductCardProps) => (
    <Pressable className="flex-row items-center gap-4 p-4 border border-gray-300 rounded-lg bg-card" key={product.id} onPress={() => onPress(product)}>
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