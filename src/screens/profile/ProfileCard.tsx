import { Avatar, AvatarFallbackText, AvatarImage, Text } from "@/components/base";
import { CurrentUserType } from "@/models/auth.model";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type ProfileCardProps = {
  user: CurrentUserType;
}

const normalizePhoneNumber = (phone: string) => {
  // +998 90 123 4567
  return phone.slice(0, 4) + ' ' + phone.slice(4, 6) + ' ' + phone.slice(6, 9) + ' ' + phone.slice(9);
}

/**
 * Profile hero: avatar, name, phone, role and store.
 */
const ProfileCard = ({ user }: ProfileCardProps) => {
  const { t } = useTranslation();
  const roleLabel = t(`user.${user.type.toLocaleLowerCase()}.${user.role.toLocaleLowerCase()}`);
  const storeName = user.stores?.[0]?.name;

  return (
    <View className="bg-hero rounded-2xl p-5 gap-4">
      <View className="flex-row items-center gap-3.5">
        <Avatar tone="accent" size="lg">
          {user.image ? <AvatarImage source={{ uri: user.image }} alt={user.fullName} /> : null}
          {user.image ? null : <AvatarFallbackText>{user.fullName}</AvatarFallbackText>}
        </Avatar>
        <View className="flex-1 min-w-0 gap-0.5">
          <Text className="type-subhead text-hero-ink" numberOfLines={1}>{user.fullName}</Text>
          {user.phone ? (
            <Text className="font-onest text-sm text-hero-muted tabular-nums">{normalizePhoneNumber(user.phone)}</Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <View className="rounded-pill bg-accent px-3 py-1">
          <Text className="font-onest-semibold text-xs text-on-accent">{roleLabel}</Text>
        </View>
        {storeName ? (
          <View className="rounded-pill bg-hero-sub px-3 py-1">
            <Text className="font-onest-semibold text-xs text-hero-ink">{storeName}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default ProfileCard;
