import React from 'react';
import { Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

type LogoUsersProps = {
    width?: number;
    height?: number;
    style?: ImageStyle | (ImageStyle & ViewStyle);
  };
  
  export const LogoCopagroUsers: React.FC<LogoUsersProps> = ({
    width = 300,
    height = 250,
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
  
  export default LogoCopagroUsers;
  
  const styles = StyleSheet.create({
    logo: {
      alignSelf: 'center',    
      marginTop: -155,      
      position: 'absolute', 
    },
  });
  