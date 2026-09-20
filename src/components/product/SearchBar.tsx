import { SearchIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <Input className="flex-1">
      <InputField
        placeholder={t('product.search')}
        value={value}
        onChangeText={onChangeText}
      />
      <InputSlot>
        <InputIcon as={SearchIcon} />
      </InputSlot>
    </Input>
  );
}
