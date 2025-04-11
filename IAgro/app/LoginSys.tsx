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

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerText}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#008000',
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
    borderColor: '#008000',
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
  button: {
    backgroundColor: '#008000',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 24,
    width: '60%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#007100',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  registerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
