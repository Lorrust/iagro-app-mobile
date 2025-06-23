//React e React Native imports
import React, { createContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme, View, StyleSheet } from 'react-native';

// Interface do tema
interface ThemeContextData {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

// Cria o contexto com valor padrão e a tipagem da interface
export const ThemeContext = createContext<ThemeContextData>({
  isDarkTheme: false,
  toggleTheme: () => {},
});

// Provider do tema
export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkTheme, setIsDarkTheme] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDarkTheme(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  // Função para alternar entre temas
  const toggleTheme = () => setIsDarkTheme(prev => !prev);

  //useMemo para otimizar o valor do contexto
  const contextValue = useMemo(
    () => ({
      isDarkTheme,
      toggleTheme,
    }),
    [isDarkTheme]
  );

  // Retorna o provedor com o valor do contexto
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
