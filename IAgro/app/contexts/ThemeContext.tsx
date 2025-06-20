import React, { createContext, useState, useMemo } from 'react';

// 1. Tipagem para o valor do nosso contexto
interface ThemeContextData {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

// 2. Criando o contexto com um valor padrão
export const ThemeContext = createContext<ThemeContextData>({
  isDarkTheme: false,
  toggleTheme: () => {}, // função vazia como padrão
});

// 3. Criando o nosso "Provedor" de Tema
export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // A função que vai alternar o booleano
  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  // Usamos useMemo para garantir que o objeto de contexto não seja recriado a cada renderização
  const contextValue = useMemo(
    () => ({
      isDarkTheme,
      toggleTheme,
    }),
    [isDarkTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};