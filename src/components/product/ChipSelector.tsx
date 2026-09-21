import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { ScrollView } from 'react-native';

interface ChipSelectorProps {
  values: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}

export function ChipSelector({ values, selected, onSelect }: ChipSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {values.map((value) => {
        const isActive = value === selected;
        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            className={`px-3 py-1.5 rounded-md border ${
              isActive
                ? 'bg-primary border-primary'
                : 'bg-background border-border'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isActive ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              {value}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
