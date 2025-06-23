//React e React Native imports
import { TextInput, TextInputProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import React from 'react';

// Interface para tipagem das props do componente TextInputCopagro
// Herda todas as props do TextInput do React Native Paper, exceto 'style', 'theme' e 'mode'
interface TextInputCopagroProps extends Omit<TextInputProps, 'style' | 'theme' | 'mode'> {
  darkMode?: boolean; // Propriedade opcional para ativar modo escuro
}

// Componente personalizado de input de texto
export const TextInputCopagro: React.FC<TextInputCopagroProps> = ({
  darkMode = false, // Valor padrão: modo claro
  ...rest
}) => {

  // Configuração do tema personalizado para o input
  const customInputTheme = {
    roundness: 33,
    colors: {
      text: darkMode ? '#FFF' : '#000',
      placeholder: darkMode ? '#BBB' : '#666',
      primary: '#0B845C',
      background: darkMode ? '#1E1E1E' : '#FFF',
    },
  };

  return (
    <TextInput
      mode="outlined"
      style={[
        styles.input,
        {
          // Estilos dinâmicos baseados no modo escuro ou claro
          backgroundColor: darkMode ? '#1E1E1E' : '#FFF',
          color: darkMode ? '#FFF' : '#000',
        },
      ]}
      theme={customInputTheme}
      outlineColor={darkMode ? '#555' : '#ccc'}
      activeOutlineColor="#0B845C"
      {...rest} // Passa todas as outras props recebidas
    />
  );
};


const styles = StyleSheet.create({
  input: {
    width: '100%', 
    backgroundColor: 'white', 
    fontSize: 16, 
    color: '#000',
  },
});

export default TextInputCopagro;