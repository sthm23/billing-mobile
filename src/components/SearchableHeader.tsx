import { Box, Button, HStack, Input, Pressable, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { Search, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { LayoutAnimation, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface SearchableHeaderProps {
    title: string;
    onSearchChange: (text: string) => void;
    actionLabel?: string;
    onAction?: () => void;
}

export function SearchableHeader({
    title,
    onSearchChange,
    actionLabel,
    onAction,
}: SearchableHeaderProps) {
    const { t } = useTranslation();
    const [isSearching, setIsSearching] = useState(false);
    const [searchText, setSearchText] = useState('');
    const inputRef = useRef<TextInput>(null);
    const colors = useTheme();

    const handleFocus = () => {
        inputRef.current?.focus();
    };

    const handleBlur = () => {
        inputRef.current?.blur();
    };

    const openSearch = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSearching(true);
        // focus после того как layout обновится
        setTimeout(() => handleFocus(), 50);
    };

    const closeSearch = () => {
        handleBlur();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSearching(false);
        setSearchText('');
        onSearchChange('');
    };

    const handleTextChange = (text: string) => {
        setSearchText(text);
        onSearchChange(text);
    };

    if (isSearching) {
        return (
            <HStack className="items-center px-3 py-2 gap-2 bg-background">
                <Box className="flex-1 relative">
                    <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
                        <Search size={20} color={colors.mutedForeground} />
                    </View>
                    <Input
                        ref={inputRef}
                        placeholder={t('common.searchPlaceholder')}
                        value={searchText}
                        onChangeText={handleTextChange}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                        className="pl-10"
                    />
                </Box>
                <Pressable onPress={closeSearch} className="p-2">
                    <X size={24} color={colors.foreground} />
                </Pressable>
            </HStack>
        );
    }

    return (
        <HStack className="items-center justify-between px-4 py-2 bg-background">
            <Text className="text-2xl font-bold">{title}</Text>
            <HStack className="items-center gap-2">
                <Pressable onPress={openSearch} className="p-2">
                    <Search size={24} color={colors.foreground} />
                </Pressable>
                {actionLabel && onAction && (
                    <Button onPress={onAction}>
                        {actionLabel}
                    </Button>
                )}
            </HStack>
        </HStack>
    );
}
