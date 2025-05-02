// ESTE CODIGO NAO ESTA SENDO UTILIZADO, APENAS PARA REFERENCIA CASO UM DIA QUEIRAMOS VOLTAR A USAR O CODIGO DE VERIFICACAO


import React from 'react';
import { ImageBackground, StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LogoCopagro } from '../components/LogoCopagro';
import { ButtonCopagro } from '../components/Button';
import { TextInputCopagro } from '../components/ButtonTxt';

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
          <Text style={styles.EsqueceuSenha}>
            Verifique seu e-mail
          </Text>
          <Text style={styles.VerEmail}>
            Um e-mail foi enviado para você com o código de verificação.
          </Text>

          <TextInputCopagro
            placeholder="Codigo de verificação"
          />

          <ButtonCopagro
            label="Redefinir senha"
            onPress={() => router.push('/Auth/NewPsswrd')}
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
  VerEmail: {
        color: 'black',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 36,
  },
});
