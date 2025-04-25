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
          <Text style={styles.RedefinirSenha}>
            Sua nova senha deve conter no mínimo 8 caracteres, incluindo letras e números.
          </Text>
          <TextInput
            mode="outlined"
            label="Nova senha"
            placeholder="8 caracteres com letras e números"
            style={styles.input}
            outlineColor="#ccc"
            activeOutlineColor="#0B845C"
          />
          <TextInput
            mode="outlined"
            label="Confirme sua nova senha"
            placeholder="Deve ser igual a senha anterior"
            style={styles.input}
            outlineColor="#ccc"
            activeOutlineColor="#0B845C"
          />
          <ButtonCopagroText
            label="Confirmar"
            onPress={() => router.push('/Auth/SignInSys')}
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
  RedefinirSenha: {
    color: 'black',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 36,
  },
});
