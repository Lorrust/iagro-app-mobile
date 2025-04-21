import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index"/>
      <Stack.Screen name="LoginSys" options={{ title: "Login" }} />
      <Stack.Screen name="SignInSys" options={{ title: "Cadastre-se" }} />
    </Stack>
  );
}
