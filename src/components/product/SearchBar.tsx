import { SearchField } from '@/components/base';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <SearchField
      value={value}
      onChangeText={onChangeText}
      placeholder={t('product.search')}
      className="flex-1"
    />
  );
}
