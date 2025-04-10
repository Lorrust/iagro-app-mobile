import React, { useLayoutEffect } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LogoCopagro } from './components/LogoCopagro';
import { ButtonCopagro } from './components/Buttom';
import { StackNavigationProp } from '@react-navigation/stack';

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../assets/images/colheitadeira.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      <LogoCopagro />
      <ButtonCopagro
        text="→"
        onPress={() => navigation.navigate('LoginSys')}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});
