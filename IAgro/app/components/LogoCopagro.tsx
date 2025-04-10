import React from 'react';
import { Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

type LogoSistemaProps = {
  width?: number;
  height?: number;
  style?: ImageStyle | (ImageStyle & ViewStyle);
};

export const LogoCopagro: React.FC<LogoSistemaProps> = ({
  width = 400,
  height = 400,
  style,
}) => {
  return (
    <Image
      source={require('../../assets/images/copagro.png')}
      style={[
        styles.logo,
        { width, height },
        style, // aplica o estilo passado como prop
      ]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',    
    marginTop: -100,      
    position: 'absolute', 
  },
});
