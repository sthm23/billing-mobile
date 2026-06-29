import { Text, View } from "react-native";

const tokens = {
  container: "flex-1 items-center justify-center bg-white",
  text: "text-lg font-bold",
}

export default function Index() {
  return (
    <View className={tokens.container}>
      <Text className={tokens.text}>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}


