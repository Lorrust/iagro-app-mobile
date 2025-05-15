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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import LogoCopagro from '../components/LogoCopagro';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosService from '../../services/axiosService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { ButtonCopagro } from '../components/Button';
import TextInputCopagro from '../components/ButtonTxt';

const screenHeight = Dimensions.get('window').height;

export default function SettingsScreen() {
  // Estados para a tela de Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loginPressed, setLoginPressed] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState(''); // Já existe para avisos de erro

  // Estados para a tela de Cadastro
  const [registerVisible, setRegisterVisible] = useState(false);
  const [corporateName, setCorporateName] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [cnpj, setCnpj] = useState('');

  // Variável de animação
  const translateY = useRef(new Animated.Value(0)).current;

  const showErrorFromResponse = (
    response: any,
    setError: (msg: string) => void,
    title: string
  ) => {
    const message = response?.data?.message || 'Erro inesperado.';
    setError(message);
    Alert.alert(title, message);
  };

  // Handler para corporateName field para alternar os campos CPF/CNPJ
  const onCorporateNameChange = (text: string) => {
    setCorporateName(text);
    if (text === '') {
      // Se Razão Social for limpa, limpa também qualquer valor de CNPJ e volta para o campo CPF
      setCnpj('');
    }
  };

  // Handler para o campo CNPJ com formatação automática
  const onCnpjChange = (text: string) => {
    // Permite apenas dígitos e limita a 14 dígitos
    const numeric = text.replace(/\D/g, '').slice(0, 14);
    // Formata a string numérica como CNPJ: 00.000.000/0000-00
    let formatted = '';
    if (numeric.length > 0) {
      const part1 = numeric.slice(0, 2);
      const part2 = numeric.slice(2, 5);
      const part3 = numeric.slice(5, 8);
      const part4 = numeric.slice(8, 12);
      const part5 = numeric.slice(12, 14);
      if (part1) formatted += part1;
      if (part2) formatted += '.' + part2;
      if (part3) formatted += '.' + part3;
      if (part4) formatted += '/' + part4;
      if (part5) formatted += '-' + part5;
    }
    setCnpj(formatted);
  };

  // Função para formatar CPF (definida na tela, não no componente Input)
  const formatCpf = (text: string): string => {
    const cleanedText = text.replace(/\D/g, '');
    const limitedDigits = cleanedText.substring(0, 11);

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
    setCpf(formattedValue);
  };


  // Efeito para lidar com o Login
  useEffect(() => {
    const authenticate = async () => {
      if (!loginPressed) return;

      setLoadingLogin(true);
      setLoginError(''); // Limpa erros anteriores antes de tentar logar

      // --- VALIDAÇÃO DE EMAIL E SENHA NO LADO DO CLIENTE (Adicionado/Ajustado) ---
      if (!email || !senha) {
        setLoginError('Por favor, preencha email e senha.');
        setLoadingLogin(false);
        setLoginPressed(false); // Resetar o estado do clique
        return; // Interrompe a execução se campos vazios
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setLoginError('Por favor, insira um email válido.');
        setLoadingLogin(false);
        setLoginPressed(false); // Resetar o estado do clique
        return; // Interrompe a execução se email inválido
      }

      if (senha.length <= 8) {
        setLoginError('A senha deve ter pelo menos 8 caracteres.');
        setLoadingLogin(false);
        setLoginPressed(false); // Resetar o estado do clique
        return; // Interrompe a execução se senha inválida
      }
      // --- Fim da Validação ---


      try {
        const response = await axiosService.post('/auth/login', {
          email: email,
          password: senha,
        });

        console.log('Login realizado com sucesso!', response.data);
        // Remover o alert aqui se o sucesso for apenas navegação e feedback visual
        // alert('Login realizado com sucesso!');

        // Salva o usuário, token e AGORA O UID, ajustando para a estrutura real da sua API
        if (response.data) {
          if (response.data.user) {
            if (response.data.user.uid) {
              await AsyncStorage.setItem('user-uid', response.data.user.uid.toString());
            } else if (response.data.user.id) {
              await AsyncStorage.setItem('user-uid', response.data.user.id.toString());
            }
          }
          if (response.data.token) { // Assumindo que o token vem no campo 'token'
            await AsyncStorage.setItem('token', response.data.token);
          }
          // Exemplo: salvando companyId se estiver na resposta
          if (response.data.companyId) {
            await AsyncStorage.setItem('id-company', response.data.companyId.toString());
          } else if (response.data.user?.companyId) { // Se estiver dentro de user
            await AsyncStorage.setItem('id-company', response.data.user.companyId.toString());
          }
        }


        // Navega para Home
        router.push('/Screens/Home');

      } catch (error) {
        console.log('Erro no login:', error);

        if (axios.isAxiosError(error)) {
          console.log('Axios Error Details:', {
            data: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            message: error.message,
          });

          if (error.response) {
            const status =  error.response.status;

            if (axios.isAxiosError(error) && error.response) {
              showErrorFromResponse(error.response, setLoginError, 'Erro no Login');
            }
          } else if (error.request) {
            const message = 'Erro de rede. Verifique sua conexão.';
            setRegisterError(message);
            Alert.alert('Erro de Rede', message);
          } else {
            const message = `Ocorreu um erro: ${error.message}`;
            setRegisterError(message);
            Alert.alert('Erro', message);
          }
        } else {
          const message = 'Ocorreu um erro inesperado.';
          console.log('Unknown Error:', error);
          setRegisterError(message);
          Alert.alert('Erro', message);
        }
      } finally {
        setLoadingLogin(false);
        setLoginPressed(false); // Garante que o estado é resetado mesmo em caso de erro
      }
    };

    // Este efeito roda quando loginPressed, email ou senha mudam.
    // loginPressed=true dispara a tentativa. Mudar email/senha enquanto loading=true
    // não fará nada até que loading volte para false e o botão seja pressionado novamente.
    authenticate();
  }, [loginPressed, email, senha]); // Dependências ajustadas


  // Função para lidar com o Cadastro
  const handleRegister = async () => {
    setLoadingRegister(true);
    setRegisterError('');

    const cleanedCpfForApi = cpf.replace(/\D/g, '');

    if (!corporateName || !fullName || !cleanedCpfForApi || !registerEmail || !registerPassword || !confirmPassword) {
      setRegisterError('Por favor, preencha todos os campos.');
      setLoadingRegister(false);
      return;
    }

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

      setCorporateName('');
      setFullName('');
      setCpf('');
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setRegisterError('');

      animateDown();

    } catch (error) {
      console.log('Erro no cadastro:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios Error Details:', {
          data: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          message: error.message,
        });

        if (axios.isAxiosError(error) && error.response) {
          showErrorFromResponse(error.response, setRegisterError, 'Erro no Cadastro');
        } else if (error.request) {
          setRegisterError('Erro de rede. Verifique sua conexão.');
        } else {
          setRegisterError(`Ocorreu um erro: ${error.message}`);
        }
      } else {
        console.log('Unknown Error:', error);
        setRegisterError('Ocorreu um erro inesperado.');
      }
    } finally {
      setLoadingRegister(false);
    }
  };


  // Animação para subir (mostrar cadastro)
  const animateUp = () => {
    setRegisterError(''); // Limpa erros de cadastro
    setCorporateName('');
    setFullName('');
    setCpf('');
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');
    // Limpa erros de login também ao mudar de tela
    setLoginError('');
    setEmail('');
    setSenha('');


    setRegisterVisible(true);
    Animated.timing(translateY, {
      toValue: -screenHeight,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Animação para descer (voltar para login)
  const animateDown = () => {
    setRegisterError(''); // Limpa erros de cadastro
    setCorporateName('');
    setFullName('');
    setCpf('');
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');
    // Limpa erros de login também ao voltar
    setLoginError('');
    setEmail('');
    setSenha('');

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

          {/* Exibe o aviso de erro de login */}
          {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

          <TouchableOpacity onPress={() => router.push('/Auth/ForgotPsswrd')}>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <ButtonCopagro
            onPress={() => setLoginPressed(true)}
            label={loadingLogin ? 'Entrando...' : 'Entrar'}
            disabled={loadingLogin}
          />
          {/* Indicador de carregamento do login */}
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
                label="Razão Social"
                placeholder="Razão social"
                value={corporateName}
                onChangeText={onCorporateNameChange}
                editable={!loadingRegister}
              />
            </View>

            {corporateName.length > 0 ? (
              // Se Razão Social estiver preenchida, mostra o campo CNPJ e a nota
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CNPJ:</Text>
                  <TextInputCopagro
                    label="CNPJ"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChangeText={onCnpjChange}
                    maxLength={18} // 14 dígitos + 4 caracteres de formatação = 18
                    keyboardType="number-pad"
                    editable={!loadingRegister}
                  />
                </View>
                <Text style={styles.noteText}>
                  Ao preencher a Razão Social, o documento esperado passa a ser CNPJ (14 dígitos).
                </Text>
              </>
            ) : (
              // Se Razão Social estiver vazia, mostra o campo CPF
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CPF:</Text>
                <TextInputCopagro
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChangeText={handleCpfChange} // CPF usa o handler com formatação
                  maxLength={14}
                  keyboardType="number-pad"
                  editable={!loadingRegister}
                />
              </View>
            )}

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

            {/* Exibe o aviso de erro de cadastro */}
            {registerError ? <Text style={styles.errorText}>{registerError}</Text> : null}

            <ButtonCopagro
              onPress={handleRegister}
              label={loadingRegister ? 'Cadastrando...' : 'Concluir cadastro'}
              disabled={loadingRegister}
            />
            {/* Indicador de carregamento do cadastro */}
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
  noteText: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
    maxWidth: 350,
  },
});