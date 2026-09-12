import { useTheme } from '@/hooks/use-theme';
import Default from '@expo/material-symbols/10k.xml';
import Plus from '@expo/material-symbols/add.xml';
import Dashboard from '@expo/material-symbols/apps.xml';
import ArrowDown from '@expo/material-symbols/arrow_downward.xml';
import ArrowLeft from '@expo/material-symbols/arrow_left.xml';
import ArrowRight from '@expo/material-symbols/arrow_right.xml';
import ArrowUp from '@expo/material-symbols/arrow_upward.xml';
import Box from '@expo/material-symbols/box.xml';
import Cart from '@expo/material-symbols/card_travel.xml';
import Success from '@expo/material-symbols/check_circle.xml';
import Close from '@expo/material-symbols/close.xml';
import CreditCard from '@expo/material-symbols/credit_card.xml';
import Trash from '@expo/material-symbols/delete.xml';
import Pencil from '@expo/material-symbols/edit.xml';
import Filter from '@expo/material-symbols/filter_list.xml';
import Users from '@expo/material-symbols/group.xml';
import Language from '@expo/material-symbols/language.xml';
import Login from '@expo/material-symbols/login.xml';
import Logout from '@expo/material-symbols/logout.xml';
import Phone from '@expo/material-symbols/mobile.xml';
import Moon from '@expo/material-symbols/moon_stars.xml';
import Person from '@expo/material-symbols/person.xml';
import BarcodeScanner from '@expo/material-symbols/qr_code_scanner.xml';
import Search from '@expo/material-symbols/search.xml';
import Setting from '@expo/material-symbols/settings.xml';
// import Dollar from '@expo/material-symbols/paid.xml';
import LockIcon from '@expo/material-symbols/lock.xml';
import Transfer from '@expo/material-symbols/payment_arrow_down.xml';
import Money from '@expo/material-symbols/payments.xml';
import UserMinus from '@expo/material-symbols/person_remove.xml';
import OnlinePayment from '@expo/material-symbols/price_change.xml';
import Minus from '@expo/material-symbols/remove.xml';
import Report from '@expo/material-symbols/report.xml';
import Sun from '@expo/material-symbols/sunny.xml';

import { Host, Icon } from '@expo/ui';
import { SFSymbol } from 'expo-symbols';
import { IconNames, IconProps } from './icon.type';

function getIconNameIOS(name: IconNames): SFSymbol {
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
    case IconNames.CREDIT_CARD:
      return 'creditcard.fill';
    case IconNames.ONLINE_PAYMENT:
      return 'creditcard.and.numbers';
    case IconNames.TRANSFER:
      return 'arrow.up.arrow.down.circle';
    case IconNames.LOCK:
      return 'lock.fill';
    case IconNames.PERSON:
      return 'person.fill';
    case IconNames.SETTING:
      return 'gearshape.fill';
    case IconNames.SEARCH:
      return 'magnifyingglass';
    case IconNames.BARCODE_SCANNER:
      return 'barcode.viewfinder';
    case IconNames.FILTER:
      return 'line.horizontal.3.decrease.circle';
    default:
      return '0.circle.fill';
  }
}

function getIconNameAndroid(name: IconNames): any {
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
    case IconNames.CREDIT_CARD:
      return CreditCard;
    case IconNames.ONLINE_PAYMENT:
      return OnlinePayment;
    case IconNames.TRANSFER:
      return Transfer;
    case IconNames.LOCK:
      return LockIcon;
    case IconNames.PERSON:
      return Person;
    case IconNames.SETTING:
      return Setting;
    case IconNames.SEARCH:
      return Search;
    case IconNames.BARCODE_SCANNER:
      return BarcodeScanner;
    case IconNames.FILTER:
      return Filter;
    default:
      return Default
  }
}

export default function CustomIcon(props: IconProps) {
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