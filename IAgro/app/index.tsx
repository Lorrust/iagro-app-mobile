import React, { useLayoutEffect } from 'react';
import { ImageBackground, StyleSheet, View, Text } from 'react-native';
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

      {/* Logo no topo */}
      <View>
        <LogoCopagro />
      </View>

      {/* Texto e botão embaixo */}
      <View style={styles.bottomContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>Bem-vindo a IAgro</Text>
          <Text style={styles.descriptionText}>
            Faça suas consultas e encontre a solução de seus problemas agro!
          </Text>
        </View>

        <ButtonCopagro
          text="→"
          onPress={() => navigation.navigate('LoginSys')}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  bottomContainer: {
    alignItems: 'center',
    width: '100%',
  },
  textContainer: {
    backgroundColor: 'rgba(92, 92, 92, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});
