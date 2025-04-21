import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import LogoCopagro from './components/LogoCopagro';
import { ButtonCopagroText } from './components/ButtonTxt';

const screenHeight = Dimensions.get('window').height;

export default function SignInSys() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [registerVisible, setRegisterVisible] = useState(false);

  const translateY = useRef(new Animated.Value(0)).current;

  const animateUp = () => {
    setRegisterVisible(true);
    Animated.timing(translateY, {
      toValue: -screenHeight,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const animateDown = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setRegisterVisible(false));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
        {/* TELA DE LOGIN */}
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

        {/* BOTÃO CADASTRE-SE */}
        <TouchableOpacity style={styles.registerButton} onPress={animateUp}>
          <Text style={styles.registerText}>Cadastre-se</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* TELA DE CADASTRO */}
      {registerVisible && (
        <Animated.View style={[styles.registerScreen, { transform: [{ translateY }] }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <LogoCopagro />
            <Text style={styles.title}>Cadastro</Text>
            <Text style={styles.subtitle}>Conte-nos um pouco sobre você...</Text>

            {['Razão social', 'Nome completo', 'CPF', 'Email', 'Senha', 'Confirmar senha'].map((label, index) => (
              <View style={styles.inputGroup} key={index}>
                <Text style={styles.label}>{label}:</Text>
                <TextInput
                  style={styles.input}
                  placeholder={label}
                  secureTextEntry={label.toLowerCase().includes('senha')}
                  keyboardType={label === 'CPF' ? 'numeric' : 'default'}
                />
              </View>
            ))}

            <ButtonCopagroText
              onPress={() => console.log('Cadastro concluído')}
              label="Concluir cadastro"
            />

            <TouchableOpacity onPress={animateDown}>
              <Text style={[styles.forgotText, { textAlign: 'center', marginTop: 20 }]}>
                Voltar ao login
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    height: '100%',
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
  registerScreen: {
    position: 'absolute',
    top: screenHeight,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    height: '100%',
  },
});
