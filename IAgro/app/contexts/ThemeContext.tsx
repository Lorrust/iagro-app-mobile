import React, { createContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme, View, StyleSheet } from 'react-native';

// 1. Tipagem para o valor do nosso contexto
interface ThemeContextData {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

// 2. Criando o contexto com um valor padrão
export const ThemeContext = createContext<ThemeContextData>({
  isDarkTheme: false,
  toggleTheme: () => {},
});

// 3. Criando o nosso "Provedor" de Tema
export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme(); // 'dark' | 'light' | null
  const [isDarkTheme, setIsDarkTheme] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDarkTheme(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  // Função para alternar entre temas
  const toggleTheme = () => setIsDarkTheme(prev => !prev);

  // 4. Usando useMemo para otimizar o valor do contexto
  const contextValue = useMemo(
    () => ({
      isDarkTheme,
      toggleTheme,
    }),
    [isDarkTheme]
  );

  // 5. Retornando o provedor com o valor do contexto
  return (
    <ThemeContext.Provider value={contextValue}>
      <View
        style={[
          styles.container,
          { backgroundColor: isDarkTheme ? '#121212' : '#f0f0f0' },
        ]}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

// Estilo básico para o container
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
