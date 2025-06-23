// React e  React Native imports
import React from 'react';
import { Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

// Interface para tipagem das propriedades do componente LogoCopagro
type LogoSistemaProps = {
  width?: number;
  height?: number;
  style?: ImageStyle | (ImageStyle & ViewStyle);
};

// Componente LogoCopagro que exibe o logo da Copagro
export const LogoCopagro: React.FC<LogoSistemaProps> = ({
  width = 400,
  height = 350,
  style,
}) => {
  return (
    <Image
      source={require('../../assets/images/copagro.png')}
      style={[
        styles.logo,
        { width, height },
        style,
      ]}
      resizeMode="contain"
    />
  );
};

export default LogoCopagro;

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',    
    marginTop: -100,      
    position: 'absolute', 
  },
});
