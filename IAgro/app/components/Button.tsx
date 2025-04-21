import React from 'react';
import { Button } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ButtonCopagroProps {
  icon?: string;
  onPress: () => void;
  label?: string;
}

export const ButtonCopagro: React.FC<ButtonCopagroProps> = ({ icon, onPress, label = '' }) => {
  return (
    <Button
      mode="contained"
      icon={icon}
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

const styles = StyleSheet.create({
  button: {
    borderRadius: 34,
    width: '60%',
    alignSelf: 'center', 
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '110%',
    paddingVertical: 3, 
  },
  label: {
    fontSize: 30,
  },
  icon: {
    alignSelf: 'center',
  },
});

interface ButtonCopagroTextProps {
  onPress: () => void;
  label: string;
}
