import { Pressable, Text } from '@/components/base';
import type { ButtonIconComponent } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { StaffRole } from '@/models/user.model';
import { ASSIGNABLE_STAFF_ROLES, type AssignableStaffRole } from '@/services/store';
import { Briefcase, ShoppingBag, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const ROLE_ICON: Record<AssignableStaffRole, ButtonIconComponent> = {
  [StaffRole.MANAGER]: Briefcase,
  [StaffRole.SELLER]: ShoppingBag,
  [StaffRole.CASHIER]: Wallet,
};

interface StaffRolePickerProps {
  value: AssignableStaffRole;
  onChange: (role: AssignableStaffRole) => void;
}

/** Role tiles Менеджер / Продавец / Кассир (new employee and edit forms). */
export function StaffRolePicker({ value, onChange }: StaffRolePickerProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <View className="flex-row gap-2" accessibilityRole="radiogroup">
      {ASSIGNABLE_STAFF_ROLES.map((role) => {
        const selected = value === role;
        const Icon = ROLE_ICON[role];

        return (
          <Pressable
            key={role}
            onPress={() => onChange(role)}
            className={cn('flex-1 min-h-24 rounded-[18px] p-3 gap-1.5', selected ? 'bg-primary' : 'bg-sunken')}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
          >
            <Icon size={22} color={selected ? colors.onPrimary : colors.ink} strokeWidth={2} />
            <Text className={cn('font-onest-bold text-[15px]', selected ? 'text-on-primary' : 'text-ink')}>
              {t(`user.staff.${role.toLowerCase()}`)}
            </Text>
            <Text className={cn('font-onest text-xs leading-4', selected ? 'text-on-primary opacity-70' : 'text-muted')}>
              {t(`staffCreate.roleDesc${role}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
