import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="Auth/LoginSys" options={{ title: "Login" }} />
        <Stack.Screen name="Auth/ForgotPsswrd" options={{ title: "Modificar Senha" }} />
        <Stack.Screen name="Screens/Home" options={{ headerShown: false }} />
        <Stack.Screen name="Screens/Chats" options={{ title: "Voltar" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
