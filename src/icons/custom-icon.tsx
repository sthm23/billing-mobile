import { useTheme } from '@/hooks/use-theme';
import Default from '@expo/material-symbols/10k.xml';
import Plus from '@expo/material-symbols/add.xml';
import Dashboard from '@expo/material-symbols/apps.xml';
import ArrowDown from '@expo/material-symbols/arrow_downward.xml';
import ArrowLeft from '@expo/material-symbols/arrow_left.xml';
import ArrowRight from '@expo/material-symbols/arrow_right.xml';
import ArrowUp from '@expo/material-symbols/arrow_upward.xml';
import Money from '@expo/material-symbols/attach_money.xml';
import Box from '@expo/material-symbols/box.xml';
import Cart from '@expo/material-symbols/card_travel.xml';
import Success from '@expo/material-symbols/check_circle.xml';
import Close from '@expo/material-symbols/close.xml';
import Trash from '@expo/material-symbols/delete.xml';
import Pencil from '@expo/material-symbols/edit.xml';
import Users from '@expo/material-symbols/group.xml';
import Language from '@expo/material-symbols/language.xml';
import Login from '@expo/material-symbols/login.xml';
import Logout from '@expo/material-symbols/logout.xml';
import Phone from '@expo/material-symbols/mobile.xml';
import Moon from '@expo/material-symbols/moon_stars.xml';
import UserMinus from '@expo/material-symbols/person_remove.xml';
import Minus from '@expo/material-symbols/remove.xml';
import Report from '@expo/material-symbols/report.xml';
import Sun from '@expo/material-symbols/sunny.xml';
import { Host, Icon } from '@expo/ui';
import { SFSymbol } from 'expo-symbols';
import { IconNames, IconProps } from './icon.type';

function getIconNameIOS(name: IconNames):SFSymbol {
  switch (name) {
    case IconNames.MOON:
      return 'moon.fill';
    case IconNames.SUN:
      return 'sun.max.fill';
    case IconNames.ARROW_DOWN:
      return 'arrow.down';
    case IconNames.ARROW_LEFT:
      return 'arrow.left';
    case IconNames.ARROW_RIGHT:
      return 'arrow.right';
    case IconNames.ARROW_UP:
      return 'arrow.up';
    case IconNames.BOX:
      return 'box.truck.fill';
    case IconNames.CART:
      return 'cart.fill';
    case IconNames.CLOSE:
      return 'x.circle';
    case IconNames.DASHBOARD:
      return 'app.fill';
    case IconNames.IMAGE:
      return 'photo.fill';
    case IconNames.LANGUAGE:
      return 'globe';
    case IconNames.LOGIN:
      return 'lock.open';
    case IconNames.LOGOUT:
      return 'lock';
    case IconNames.MINUS:
      return 'minus.circle';
    case IconNames.PLUS:
      return 'plus.circle';
    case IconNames.MONEY:
      return 'dollarsign.circle';
          case IconNames.PENCIL:
      return 'pencil.circle';
          case IconNames.PHONE:
      return 'phone';
        case IconNames.REPORT:
      return 'exclamationmark.bubble.fill';
          case IconNames.SUCCESS:
      return 'checkmark.circle.fill';
          case IconNames.TRASH:
      return 'trash.circle.fill';
          case IconNames.USERS:
      return 'person.2.fill';
          case IconNames.USER_MINUS:
      return 'person.crop.circle.badge.minus';
    default:
      return '0.circle.fill';
  }
}

function getIconNameAndroid(name: IconNames):any {
  switch (name) {
    case IconNames.MOON:
      return Moon;
    case IconNames.SUN:
      return Sun;
    case IconNames.ARROW_DOWN:
      return ArrowDown;
    case IconNames.ARROW_LEFT:
      return ArrowLeft;
    case IconNames.ARROW_RIGHT:
      return ArrowRight;
    case IconNames.ARROW_UP:
      return ArrowUp;
    case IconNames.BOX:
      return Box;
    case IconNames.CART:
      return Cart;
    case IconNames.CLOSE:
      return Close;
    case IconNames.DASHBOARD:
      return Dashboard;
    case IconNames.IMAGE:
      return Image;
    case IconNames.LANGUAGE:
      return Language;
    case IconNames.LOGIN:
      return Login;
    case IconNames.LOGOUT:
      return Logout;
    case IconNames.MINUS:
      return Minus;
    case IconNames.PLUS:
      return Plus;
    case IconNames.MONEY:
      return Money;
          case IconNames.PENCIL:
      return Pencil;
          case IconNames.PHONE:
      return Phone;
        case IconNames.REPORT:
      return Report;
          case IconNames.SUCCESS:
      return Success;
          case IconNames.TRASH:
      return Trash;
          case IconNames.USERS:
      return Users;
          case IconNames.USER_MINUS:
      return UserMinus;
    default:
      return Default
  }
}

export default function CustomIcon(props:IconProps) {
  const colors = useTheme()
  const { size = 24, color = colors.text, name } = props;
  
  const iconName = Icon.select({
    ios: getIconNameIOS(name),
    android: getIconNameAndroid(name),
  })
  return (
    <Host matchContents>
      <Icon
        name={iconName}
        size={size}
        color={color}
      />
    </Host>
  );
}