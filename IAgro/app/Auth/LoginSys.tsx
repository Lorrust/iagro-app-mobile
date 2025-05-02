import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import LogoCopagro from '../components/LogoCopagro';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosService from '../../services/axiosService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import {ButtonCopagro} from '../components/Button';
import {TextInputCopagro} from '../components/ButtonTxt';


const screenHeight = Dimensions.get('window').height;

export default function SettingsScreen() {
  // Estados para a tela de Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loginPressed, setLoginPressed] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Estados para a tela de Cadastro
  const [registerVisible, setRegisterVisible] = useState(false);
  const [corporateName, setcorporateName] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState(''); 
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Variável de animação
  const translateY = useRef(new Animated.Value(0)).current;

  // Função para formatar CPF (definida na tela, não no componente Input)
  const formatCpf = (text: string): string => {
    // Remove all non-digit characters
    const cleanedText = text.replace(/\D/g, '');

    // Limit to 11 digits
    const limitedDigits = cleanedText.substring(0, 11);

    // Apply formatting: xxx.xxx.xxx-xx
    let formattedText = '';
    for (let i = 0; i < limitedDigits.length; i++) {
      formattedText += limitedDigits[i];
      if (i === 2 || i === 5) {
        formattedText += '.';
      } else if (i === 8) {
        formattedText += '-';
      }
    }

    return formattedText;
  };

   // Handler específico para o input do CPF
  const handleCpfChange = (newText: string) => {
    const formattedValue = formatCpf(newText);
    setCpf(formattedValue); // Atualiza o estado com o valor formatado
  };


  // Efeito para lidar com o Login
  useEffect(() => {
    const authenticate = async () => {
      if (!loginPressed) return;

      setLoadingLogin(true);
      setLoginError('');

      try {
        const response = await axiosService.post('/auth/login', {
          email: email,
          password: senha,
        });

        console.log('Login realizado com sucesso!', response.data);
        alert('Login realizado com sucesso!');

        if (response.data && response.data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
        if (response.data && response.data.token) {
          await AsyncStorage.setItem('token', response.data.token);
        }

        if (response.data?.user?.companyId) {
          await AsyncStorage.setItem('id-company', response.data.user.companyId.toString());
        } else if (response.data?.companyId) {
          await AsyncStorage.setItem('id-company', response.data.companyId.toString());
        }

        router.push('/Screens/Home');

      } catch (error) {
        console.error('Erro no login:', error);
        if (axios.isAxiosError(error)) {
          console.error('Axios Error Details:', {
            data: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            message: error.message,
          });

          if (error.response) {
            const errorMessage = error.response.data?.message || 'Erro ao realizar login. Verifique suas credenciais.';
            setLoginError(`Erro: ${errorMessage}`);
            alert(`Erro ao realizar login: ${errorMessage}`);
          } else if (error.request) {
            setLoginError('Erro de rede. Verifique sua conexão.');
            alert('Erro de rede. Verifique sua conexão.');
          } else {
            setLoginError(`Erro na requisição: ${error.message}`);
            alert(`Erro na requisição: ${error.message}`);
          }
        } else {
          console.error('Unknown Error:', error);
          setLoginError('Ocorreu um erro inesperado.');
          alert('Ocorreu um erro inesperado.');
        }

      } finally {
        setLoadingLogin(false);
        setLoginPressed(false);
      }
    };

    authenticate();
  }, [loginPressed, email, senha]);

  // Função para lidar com o Cadastro
  const handleRegister = async () => {
    setLoadingRegister(true);
    setRegisterError('');

    // Para enviar para a API, limpe o CPF formatado
    const cleanedCpfForApi = cpf.replace(/\D/g, '');

    // Validação: Use o CPF limpo para verificar se está completo
    if (!corporateName || !fullName || !cleanedCpfForApi || !registerEmail || !registerPassword || !confirmPassword) {
      setRegisterError('Por favor, preencha todos os campos.');
      setLoadingRegister(false);
      return;
    }

    // Valida o tamanho dos dígitos limpos (deve ser 11 para um CPF válido)
    if (cleanedCpfForApi.length !== 11) {
      setRegisterError('CPF inválido. Use 11 números.');
      setLoadingRegister(false);
      return;
    }

    if (registerPassword !== confirmPassword) {
      setRegisterError('As senhas não coincidem.');
      setLoadingRegister(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setRegisterError('Por favor, insira um email válido.');
      setLoadingRegister(false);
      return;
    }

    const registerData = {
      corporateName: corporateName,
      fullName: fullName,
      email: registerEmail,
      cpf: cleanedCpfForApi,
      password: registerPassword,
      confirmPassword: confirmPassword,
    };

    console.log('Dados de cadastro a serem enviados:', registerData);

    try {
      const response = await axiosService.post('/users/register', registerData);

      console.log('Usuário cadastrado com sucesso!', response.data);
      alert('Cadastro realizado com sucesso! Agora você pode fazer login.');

      setcorporateName('');
      setFullName('');
      setCpf(''); 
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setRegisterError('');

      animateDown();

    } catch (error) {
      console.error('Erro no cadastro:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          data: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          message: error.message,
        });

        if (error.response) {
          const errorMessage = error.response.data?.message || 'Erro ao realizar cadastro.';
          setRegisterError(`Erro: ${errorMessage}`);
        } else if (error.request) {
          setRegisterError('Erro de rede. Verifique sua conexão.');
        } else {
          setRegisterError(`Erro na requisição: ${error.message}`);
        }
      } else {
        console.error('Unknown Error:', error);
        setRegisterError('Ocorreu um erro inesperado.');
      }
    } finally {
      setLoadingRegister(false);
    }
  };


  // Animação para subir (mostrar cadastro)
  const animateUp = () => {
    setRegisterError('');
    setcorporateName('');
    setFullName('');
    setCpf(''); // Limpa o CPF ao abrir o cadastro
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');

    setRegisterVisible(true);
    Animated.timing(translateY, {
      toValue: -screenHeight,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Animação para descer (voltar para login)
  const animateDown = () => {
    setRegisterError('');
    setcorporateName('');
    setFullName('');
    setCpf(''); // Limpa o CPF ao voltar para o login
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');

    Animated.timing(translateY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setRegisterVisible(false));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TELA DE LOGIN */}
      <Animated.View style={[styles.containerLogin, { transform: [{ translateY }] }]}>
        <LogoCopagro />

        <View style={styles.centeredContent}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            Faça o login para realizar suas consultas...
          </Text>

          {/* Usando TextInputCopagro para o Email de Login */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email:</Text>
            <TextInputCopagro
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loadingLogin}
            />
          </View>

          {/* Usando TextInputCopagro para a Senha de Login */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha:</Text>
            <TextInputCopagro
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!loadingLogin}
            />
          </View>

          {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

          <TouchableOpacity onPress={() => router.push('/Auth/ForgotPsswrd')}>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <ButtonCopagro
            onPress={() => setLoginPressed(true)}
            label={loadingLogin ? 'Entrando...' : 'Entrar'}
            disabled={loadingLogin}
          />
          {loadingLogin && <ActivityIndicator size="small" color="#028C48" style={{ marginTop: 10 }} />}
        </View>

        <TouchableOpacity
          style={[styles.registerButtonLoginScreen, { flexDirection: 'column' }]}
          onPress={animateUp}
        >
          <MaterialCommunityIcons name="chevron-up" size={40} color="#fff" />
          <Text style={styles.registerText}>Cadastre-se</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* TELA DE CADASTRO */}
      {registerVisible && (
        <Animated.View
          style={[
            styles.registerScreen,
            { transform: [{ translateY }] },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <LogoCopagro />

            <Text style={styles.title}>Cadastro</Text>
            <Text style={styles.subtitle}>Conte-nos um pouco sobre você...</Text>

             {/* Usando TextInputCopagro para Razão Social */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Razão social:</Text>
              <TextInputCopagro
                placeholder="Razão social"
                value={corporateName}
                onChangeText={setcorporateName}
                editable={!loadingRegister}
              />
            </View>

            {/* Usando TextInputCopagro para Nome completo */}
             <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome completo:</Text>
              <TextInputCopagro
                placeholder="Nome completo"
                value={fullName}
                onChangeText={setFullName}
                editable={!loadingRegister}
              />
            </View>


            {/* Usando TextInputCopagro para o CPF com formatação automática (agora feita aqui) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF:</Text>
              <TextInputCopagro
                placeholder="000.000.000-00" // Placeholder mais descritivo
                value={cpf} // O estado `cpf` guarda o valor FORMATADO
                onChangeText={handleCpfChange} // <-- Usando o handler local
                keyboardType="number-pad" // <-- Definido aqui (melhor para CPF/telefone)
                maxLength={14} // <-- Definido aqui (11 dígitos + 3 formatadores)
                editable={!loadingRegister}
                // Não precisamos de 'isCPF' no componente TextInputCopagro
              />
            </View>

            {/* Usando TextInputCopagro para Email de Cadastro */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email:</Text>
              <TextInputCopagro
                placeholder="Email"
                value={registerEmail}
                onChangeText={setRegisterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loadingRegister}
              />
            </View>

            {/* Usando TextInputCopagro para Senha de Cadastro */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha:</Text>
              <TextInputCopagro
                placeholder="Senha"
                value={registerPassword}
                onChangeText={setRegisterPassword}
                secureTextEntry
                editable={!loadingRegister}
              />
            </View>

            {/* Usando TextInputCopagro para Confirmar Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar senha:</Text>
              <TextInputCopagro
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loadingRegister}
              />
            </View>

            {registerError ? <Text style={styles.errorText}>{registerError}</Text> : null}

            <ButtonCopagro
              onPress={handleRegister}
              label={loadingRegister ? 'Cadastrando...' : 'Concluir cadastro'}
              disabled={loadingRegister}
            />
            {loadingRegister && <ActivityIndicator size="small" color="#028C48" style={{ marginTop: 10 }} />}

            <TouchableOpacity onPress={animateDown} disabled={loadingRegister}>
              <Text style={[styles.forgotText, { textAlign: 'center', marginTop: 20, marginRight: 0 }]}>
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
  containerLogin: {
    height: '100%',
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#028C48',
    marginTop: 120,
    marginBottom: 10,
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
    width: '100%',
  },
  inputGroup: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 10,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  forgotText: {
    color: '#444',
    marginBottom: 20,
    textDecorationLine: 'underline',
    alignSelf: 'flex-end',
    marginRight: 0,
  },
  registerButtonLoginScreen: {
    backgroundColor: '#028C48',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
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