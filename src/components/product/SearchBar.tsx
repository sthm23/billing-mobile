import { View } from 'react-native';
import { Search } from 'lucide-react-native';
import { Input } from '@/components/base';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 relative">
      <Input
        placeholder={t('product.search')}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 pr-10"
      />
      <View className="absolute right-3 top-0 bottom-0 justify-center">
        <Search size={20} color="#737373" />
      </View>
    </View>
  );
}
