import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { CloseIcon, SearchIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useRef, useState } from 'react';
import { LayoutAnimation, TextInput, View } from 'react-native';

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
    const [isSearching, setIsSearching] = useState(false);
    const [searchText, setSearchText] = useState('');
    const inputRef = useRef<TextInput>(null);
    const colors = useTheme();

    const openSearch = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSearching(true);
        // focus после того как layout обновится
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const closeSearch = () => {
        inputRef.current?.blur();
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
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    gap: 8,
                    backgroundColor: colors.background,
                }}
            >
                <View style={{ flex: 1 }}>
                    <Input>
                        <InputSlot>
                            <InputIcon as={SearchIcon} />
                        </InputSlot>
                        <InputField
                            ref={inputRef as any}
                            placeholder="Поиск..."
                            value={searchText}
                            onChangeText={handleTextChange}
                            returnKeyType="search"
                            clearButtonMode="while-editing"
                        />
                    </Input>
                </View>
                <Button variant="link" onPress={closeSearch} style={{ paddingHorizontal: 4 }}>
                    <ButtonIcon as={CloseIcon} size='lg' />
                </Button>
            </View>
        );
    }

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: colors.background,
            }}
        >
            <Text size="2xl" bold>{title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Button variant="link" onPress={openSearch} style={{ paddingHorizontal: 4 }}>
                    <ButtonIcon as={SearchIcon} />
                </Button>
                {actionLabel && onAction && (
                    <Button onPress={onAction}>
                        <ButtonText>{actionLabel}</ButtonText>
                    </Button>
                )}
            </View>
        </View>
    );
}
