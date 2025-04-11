import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

type ButtonCopagroProps = {
  text: string;
  onPress?: () => void;
};

export const ButtonCopagro: React.FC<ButtonCopagroProps> = ({
  text,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#028C48',
    justifyContent: 'center',
    borderRadius: 16,
    alignSelf: 'center',
    width: 249,
    height: 47,
    alignItems: 'center',
    marginTop: ~'bottom',
    overflow: 'hidden',
  },
  buttonText: {
    width: '20%',
    height: '160%',
    fontSize: 45,
    fontWeight: 'bold',
    color: 'white',
  },
});
