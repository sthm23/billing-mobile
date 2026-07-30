import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { CurrentUserType } from "@/models/auth.model";
import { useTranslation } from "react-i18next";

type ProfileCardProps = {
  user: CurrentUserType;
}

const normalizePhoneNumber = (phone: string) => {
  // Remove all non-digit characters
  const digitsOnly = phone.slice(0, 4) + ' ' + phone.slice(4, 6) + ' ' + phone.slice(6, 9) + ' ' + phone.slice(9);
  return digitsOnly;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
  const { t } = useTranslation();
  return (
    <HStack className="flex flex-row justify-between items-center w-full">
      <Box className="flex-row items-center gap-4">
        <Avatar className="border border-gray-400 rounded-full" >
          {
            user.image ?
              ''
              : <AvatarFallbackText>{user.fullName}</AvatarFallbackText>
          }

        </Avatar>
        <VStack>
          <Heading size="lg">{user.fullName}</Heading>
          <Text size="sm">
            {normalizePhoneNumber(user.phone)}
          </Text>
          <Text>{t(`user.${user.type.toLocaleLowerCase()}.${user.role.toLocaleLowerCase()}`)}</Text>
        </VStack>
      </Box>
    </HStack>
  );
};

export default ProfileCard;