import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
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
    <Input className="flex-1" variant="outline">
      <InputField
        placeholder={t('product.search')}
        value={value}
        onChangeText={onChangeText}
        editable={false}
      />
      <InputSlot className="pr-3">
        <InputIcon>
          <CustomIcon
            name={IconNames.SEARCH}
            size={20}
            color={colors.text}
          />
        </InputIcon>
      </InputSlot>
    </Input>
  );
}
