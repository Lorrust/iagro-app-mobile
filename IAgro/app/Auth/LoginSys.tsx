import React, { useState, useRef, useEffect } from 'react';
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
import { router } from 'expo-router';
import LogoCopagro from '../components/LogoCopagro';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ButtonCopagroText } from '../components/ButtonTxt';
import axiosService from '../../services/axiosService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenHeight = Dimensions.get('window').height;

export default function SettingsScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [registerVisible, setRegisterVisible] = useState(false);
  const [loginPressed, setLoginPressed] = useState(false);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const authenticate = async () => {
      if (!loginPressed) return;

      try {
        const response = await axiosService.post('/auth/login', {
          email: email,
          password: senha,
        });

        console.log('Login realizado com sucesso!', response);

        // Salva o usuário completo no AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(response));

        // Salva também id-company separadamente, se necessário
        if (response?.companyId) {
          await AsyncStorage.setItem('id-company', response.companyId.toString());
        }

        // Navega para Home
        router.push('/Screens/Home');

      } catch (error) {
        console.error('Erro no login:', error);
      } finally {
        setLoginPressed(false);
      }
    };

    authenticate();
  }, [loginPressed]);

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
        <LogoCopagro />

        <View style={styles.centeredContent}>
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
              autoCapitalize="none"
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
            onPress={() => setLoginPressed(true)}
            label="Entrar"
          />
        </View>

        {/* BOTÃO CADASTRE-SE */}
        <TouchableOpacity
          style={[styles.registerButton, { flexDirection: 'column' }]}
          onPress={animateUp}
        >
          <MaterialCommunityIcons name="chevron-up" size={40} color="#fff" />
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
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#028C48',
    marginTop: 180,
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    marginVertical: 8,
    textAlign: 'center',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },  
  inputGroup: {
    width: '100%',
    maxWidth: 350,
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
    marginBottom: 10,
    textDecorationLine: 'underline',
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  registerButton: {
    backgroundColor: '#028C48',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 0,
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
