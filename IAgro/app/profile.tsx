import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Perfil</Text>
      <Text>Nome: João da Silva</Text>
      <Text>Email: joao@email.com</Text>
      <Button title="Voltar para Home" onPress={() => router.push("../")} />
    </View>
  );
}
