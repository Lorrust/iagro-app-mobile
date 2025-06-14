import React, { useLayoutEffect } from 'react';
import { ImageBackground, StyleSheet, View, Text, Button } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LogoCopagro } from './components/LogoCopagro';
import { ButtonCopagro } from './components/Button';

export default function HomeScreen() {
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
          icon='arrow-right'
          onPress={() => router.push('/Auth/LoginSys')}
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
