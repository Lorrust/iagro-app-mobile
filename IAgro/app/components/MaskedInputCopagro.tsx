import React from 'react';
import { StyleSheet } from 'react-native';
import MaskInput from 'react-native-mask-input';
import { TextInput, TextInputProps } from 'react-native-paper';

interface MaskedInputCopagroProps extends Omit<TextInputProps, 'style' | 'theme' | 'mode' | 'onChangeText' | 'render'> {
  type: 'cpf' | 'cnpj';
  onChangeText?: (masked: string, unmasked: string) => void;
  darkMode?: boolean;
}

export const MaskedInputCopagro: React.FC<MaskedInputCopagroProps> = ({
  type,
  onChangeText,
  label,
  placeholder,
  value,
  editable = true,
  darkMode = false,
  ...rest
}) => {
  // Masks for CPF and CNPJ
  const cpfMask = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/];
  const cnpjMask = [/\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/];

  // Default placeholders
  const defaultPlaceholders = {
    cpf: '000.000.000-00',
    cnpj: '00.000.000/0000-00',
  };

  // Define internal theme for roundness using react-native-paper's theme structure
  const customInputTheme = {
    roundness: 33,
    colors: {
      background: darkMode ? '#1E1E1E' : 'white',
      text: darkMode ? '#FFF' : '#000',
      placeholder: darkMode ? '#AAA' : '#666',
      primary: '#0B845C',
    },
  };

  return (
    <TextInput
      mode="outlined"
      label={label}
      placeholder={placeholder || defaultPlaceholders[type]}
      value={value}
      editable={editable}
      theme={customInputTheme}
      outlineColor={darkMode ? '#555' : '#ccc'}
      activeOutlineColor="#0B845C"
      style={[
        styles.input,
        { backgroundColor: darkMode ? '#1E1E1E' : '#FFF' },
        !editable && styles.inputDisabledBackground,
      ]}
      render={(props) => (
        <MaskInput
          {...props}
          value={props.value}
          onChangeText={onChangeText}
          mask={type === 'cpf' ? cpfMask : cnpjMask}
          keyboardType="number-pad"
          maxLength={type === 'cpf' ? 14 : 18}
          placeholderTextColor={darkMode ? '#AAA' : '#999'}
          style={[
            props.style,
            { color: darkMode ? '#FFF' : '#000' },
            !editable && styles.inputTextDisabled,
          ]}
        />
      )}
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
  inputDisabledBackground: {
    backgroundColor: '#f5f5f5',
  },
  inputTextDisabled: {
    color: '#999',
  },
});

export default MaskedInputCopagro;