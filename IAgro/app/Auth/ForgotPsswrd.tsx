import React from 'react';
import { ImageBackground, StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LogoCopagro } from '../components/LogoCopagro';
import ButtonCopagroText from '../components/ButtonTxt';
import { TextInput } from 'react-native-paper';

export default function ForgotPassword() {
  return (
    <ImageBackground
      source={require('../../assets/images/plantacao.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Blur apenas no fundo */}
      <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />

      {/* Logo no topo */}
      <View style={styles.logoContainer}>
        <LogoCopagro />
      </View>

      {/* Card central */}
      <View style={styles.bottomContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.EsqueceuSenha}>Esqueceu a senha?</Text>

          <TextInput
            mode="outlined"
            label="Digite sua conta de email"
            placeholder="Digite seu email"
            style={styles.input}
            outlineColor="#ccc"
            activeOutlineColor="#0B845C"
          />

          <ButtonCopagroText
            label="Enviar email"
            onPress={() => router.push('/Auth/CodVer')}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 30,
  },
  textContainer: {
    backgroundColor: 'white',
    borderRadius: 34,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  EsqueceuSenha: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 36,
  },
});
