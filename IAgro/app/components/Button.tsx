import React from 'react';
import { Button, IconButton } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ButtonCopagroProps {
  icon?: string;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  textColor?: string;
}

export const ButtonCopagro: React.FC<ButtonCopagroProps> = ({ icon, onPress, label, textColor }) => {
  
  return (
    <>
      {label ? (
        <Button
          mode="contained"
          onPress={onPress}
          style={styles.button}
          contentStyle={styles.content}
          labelStyle={[styles.label, { color: textColor ?? '#FFF' }]}
          disabled={false}
        >
          {label}
        </Button>
      ) : (
        <IconButton
          mode="contained"
          icon={icon ?? 'arrow-right'}
          iconColor='#f5f5f5'
          onPress={onPress}
          style={styles.button} />
      )}
    </>
  );
};

export default ButtonCopagro;

const styles = StyleSheet.create({
  button: {
    borderRadius: 34,
    width: '60%',
    alignSelf: 'center', 
    backgroundColor: '#028C48', // Green color
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 3, 
  },
  label: {
    fontSize: 20,
    width: '100%',
    textAlign: 'center',
  },
  icon: {
    alignSelf: 'center',
  },
});

interface ButtonCopagroTextProps {
  onPress: () => void;
  label: string;
}
