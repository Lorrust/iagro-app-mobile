import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LogoCopagro from './components/LogoCopagro';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ButtonCopagroText } from './components/ButtonTxt';

export default function SettingsScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LogoCopagro />

          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            Faça o login para realizar suas consultas...
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha:</Text>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <ButtonCopagroText
            onPress={() => console.log('Login pressed')}
            label="Entrar"
          />
        </ScrollView>

        <TouchableOpacity style={[styles.registerButton, { flexDirection: 'column' }]}>
          <MaterialCommunityIcons name="chevron-up" size={40} color="#fff" />
          <Text style={styles.registerText}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#black',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#028C48',
    marginTop: 150,
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    marginVertical: 8,
    textAlign: 'center',
  },
  inputGroup: {
    width: '70%',
    alignSelf: 'center',
  },
  label: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#028C48',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  forgotText: {
    color: '#444',
    marginTop: 10,
    textDecorationLine: 'underline',
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#028C48',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 1,
    paddingVertical: 16,
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  registerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
