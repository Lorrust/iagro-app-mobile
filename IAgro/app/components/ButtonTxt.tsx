import React from 'react';
import { Button } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ButtonCopagroTextProps {
  onPress: () => void;
  label?: string;
}
export const ButtonCopagroText: React.FC<ButtonCopagroTextProps> = ({ onPress, label }) => {
    return (
      <Button
        mode="contained"
        onPress={onPress}
        contentStyle={styles.content}
        labelStyle={styles.label}
        style={styles.button}
        buttonColor='#028C48' 
      >
        {label}
      </Button>
    );
  };

  export default ButtonCopagroText;
  
  const styles = StyleSheet.create({
    button: {
      borderRadius: 34,
      width: '60%',
      marginTop: 55,
      alignSelf: 'center', 
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
    },
    icon: {
      alignSelf: 'center',
    },
  });
  