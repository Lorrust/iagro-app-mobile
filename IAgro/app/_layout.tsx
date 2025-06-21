import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  PaperProvider,
  MD3LightTheme,
  MD3DarkTheme, // Importe o tema escuro
} from "react-native-paper";
import { useContext } from "react"; // Importe o useContext
import {
  CustomThemeProvider,
  ThemeContext,
} from "../app/contexts/ThemeContext"; // Importe nosso contexto

// Tema claro personalizado
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#028C48",
    accent: "#01592e",
    background: "#f2f3f4",
    surface: "#ffffff",
  },
};

// Tema escuro personalizado
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#028C48",
    accent: "#01592e",
    background: "#121212",
    surface: "#1e1e1e",
  },
};

// Componente interno para acessar o contexto
function RootLayout() {
  // Pega o estado do tema do nosso contexto
  const { isDarkTheme } = useContext(ThemeContext);

  // Escolhe o tema com base no booleano
  const theme = isDarkTheme ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.primary,
          }}
        >
          {/* Suas telas (Stack.Screen) continuam aqui... */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="Auth/LoginSys" options={{ title: "Login" }} />
          <Stack.Screen
            name="Auth/ForgotPsswrd"
            options={{ title: "Modificar Senha" }}
          />
          <Stack.Screen name="Screens/Home" options={{ headerShown: false }} />
          <Stack.Screen name="Screens/Chats" options={{ title: "Voltar" }} />
          <Stack.Screen
            name="Screens/UserProfile"
            options={{ title: "Perfil de Usuário" }}
          />
        </Stack>
      </GestureHandlerRootView>
    </PaperProvider>
  );
}

// Layout principal que agora usa o nosso provedor de tema
export default function Layout() {
  return (
    <CustomThemeProvider>
      <RootLayout />
    </CustomThemeProvider>
  );
}
