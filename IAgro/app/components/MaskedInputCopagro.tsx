import React from 'react';
import { StyleSheet } from 'react-native';
import MaskInput from 'react-native-mask-input';
import { TextInput, TextInputProps } from 'react-native-paper';

// Interface que define as propriedades do componente
// Herda do TextInput mas remove algumas props que serão customizadas
interface MaskedInputCopagroProps extends Omit<TextInputProps, 'style' | 'theme' | 'mode' | 'onChangeText' | 'render'> {
  type: 'cpf' | 'cnpj';  // Tipo de máscara: CPF ou CNPJ
  onChangeText?: (masked: string, unmasked: string) => void; 
  darkMode?: boolean; 
}

// Componente de input com máscara para CPF ou CNPJ
export const MaskedInputCopagro: React.FC<MaskedInputCopagroProps> = ({
  type,           // Tipo da máscara (cpf ou cnpj)
  onChangeText,   
  label,          
  placeholder,    
  value,          
  editable = true,    
  darkMode = false,   
  ...rest         
}) => {
  // Definição das máscaras para CPF e CNPJ
  // CPF: 000.000.000-00 (11 dígitos + pontos e hífen)
  const cpfMask = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/];
  
  // CNPJ: 00.000.000/0000-00 (14 dígitos + pontos, barra e hífen)
  const cnpjMask = [/\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/];

  // Placeholders padrão para cada tipo
  const defaultPlaceholders = {
    cpf: '000.000.000-00',
    cnpj: '00.000.000/0000-00',
  };

  // Configuração do tema personalizado
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
        { backgroundColor: darkMode ? '#1E1E1E' : '#FFF' }, // Fundo dinâmico
        !editable && styles.inputDisabledBackground,
      ]}
      
      // Renderiza o componente MaskInput dentro do TextInput
      render={(props) => (
        <MaskInput
          {...props}
          value={props.value}
          onChangeText={onChangeText}                    
          mask={type === 'cpf' ? cpfMask : cnpjMask}     // Escolhe a máscara baseada no tipo
          keyboardType="number-pad"                      // Teclado numérico
          maxLength={type === 'cpf' ? 14 : 18}           // Limite de caracteres (CPF: 14, CNPJ: 18)
          placeholderTextColor={darkMode ? '#AAA' : '#999'} 
          style={[
            props.style,
            { color: darkMode ? '#FFF' : '#000' },       
            !editable && styles.inputTextDisabled,       
          ]}
        />
      )}
      {...rest} // Passa outras props
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