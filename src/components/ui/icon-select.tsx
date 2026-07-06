import { useTheme } from '@/hooks/use-theme';
import CheckIcon from '@expo/material-symbols/check.xml';
import StarIcon from '@expo/material-symbols/star.xml';
import { Host, Icon } from '@expo/ui';
import { SFSymbol } from 'expo-symbols';


type IconSelectProps = {
  name: {
    ios: SFSymbol;
    android: 'check' | 'star';
  };
  size?: number;
  color?: string;
};
export default function IconSelect(props: IconSelectProps) {
    const { name, size, color } = props;
    const theme = useTheme();
    const iconName = Icon.select({
          ios: name.ios,
          android: name.android === 'check' ? CheckIcon : StarIcon,
        })
  return (
    <Host matchContents>
      <Icon
        name={iconName}
        size={size}
        color={color ?? theme.text}
      />
    </Host>
  );
}

IconSelect.displayName = 'IconSelect';