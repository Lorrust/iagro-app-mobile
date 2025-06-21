import { TextInput, TextInputProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import React from 'react';

interface TextInputCopagroProps extends Omit<TextInputProps, 'style' | 'theme' | 'mode'> {
  darkMode?: boolean;
}

export const TextInputCopagro: React.FC<TextInputCopagroProps> = ({
  darkMode = false,
  ...rest
}) => {
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
          backgroundColor: darkMode ? '#1E1E1E' : '#FFF',
          color: darkMode ? '#FFF' : '#000',
        },
      ]}
      theme={customInputTheme}
      outlineColor={darkMode ? '#555' : '#ccc'}
      activeOutlineColor="#0B845C"
      {...rest}
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