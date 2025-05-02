import { TextInput, TextInputProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import React from 'react';

interface TextInputCopagroProps extends Omit<TextInputProps, 'style' | 'theme' | 'mode'> {
  // You can add custom props here if needed in the future
}

export const TextInputCopagro: React.FC<TextInputCopagroProps> = ({
  ...rest // Capture all other standard TextInputProps (value, onChangeText, placeholder, etc.)
}) => {
  // Define internal theme for roundness using react-native-paper's theme structure
  const customInputTheme = {
    roundness: 33
  };

  return (
    <TextInput
      mode="outlined"
      style={styles.input} 
      theme={customInputTheme}
      outlineColor="#ccc" 
      activeOutlineColor="#0B845C" 
      {...rest} // Spread the rest of the props to the TextInput component
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