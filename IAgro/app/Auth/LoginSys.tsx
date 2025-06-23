//React imports
import React, { useState, useRef, useEffect, useContext } from 'react';
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
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

//expo imports
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

//Axios imports
import axios, { AxiosError } from 'axios';
import axiosService from '../../services/axiosService';

//Components imports
import LogoCopagro from '../components/LogoCopagro';
import { ButtonCopagro } from '../components/Button';
import TextInputCopagro from '../components/ButtonTxt';
import DialogCopagro from '../components/Dialog';

//Contexts imports
import { ThemeContext } from '../contexts/ThemeContext'; 

const screenHeight = Dimensions.get('window').height;

export default function SettingsScreen() {
  // Estados para a tela de Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loginPressed, setLoginPressed] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  // Contexto para o tema
  const { isDarkTheme } = useContext(ThemeContext);

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

  useEffect(() => {
  const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
    setKeyboardVisible(true);
  });
  const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardVisible(false);
  });

  return () => {
    showSubscription.remove();
    hideSubscription.remove();
  };
}, []);

  // Efeito para lidar com o Login
  useEffect(() => {
    const authenticate = async () => {
      if (!loginPressed) return;

      setLoadingLogin(true);
      setLoginError(''); // Limpa erros anteriores antes de tentar logar

      // Validação de email e senha
      if (!email || !senha) {
        setLoginError('Por favor, preencha email e senha.');
        setLoadingLogin(false);
        setLoginPressed(false); 
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setLoginError('Por favor, insira um email válido.');
        setLoadingLogin(false);
        setLoginPressed(false);
        return; 
      }

      if (senha.length < 8) {
        setLoginError('A senha deve ter pelo menos 8 caracteres.');
        setLoadingLogin(false);
        setLoginPressed(false);
        return;
      }


      try {
        //tenta chamar o endpoint de login da api
        const response = await axiosService.post('/auth/login', {
          email: email,
          password: senha,
        });

        console.log('Login realizado com sucesso!', response.data);
        
        //Variavel  para salvar o UID do usuário se sucesso do login
        let savedUid = null;
        if (response.data.user?.uid) {
          savedUid = response.data.user.uid.toString();
        } else if (response.data.user?.id) {
          savedUid = response.data.user.id.toString();
        } else if (response.data.uid) {
          savedUid = response.data.uid.toString();
        }

        if (savedUid) {
          await AsyncStorage.setItem('uid', savedUid);
          console.log('User UID salvo com sucesso:', savedUid);
        } else {
          console.warn('User UID não encontrado. Usuário não logado?');
        }
        

        //Salva o token para permitir entrada de usuário nas rotas privadas
        //Salva também o conteúdo do usuário para exibição em perfil
        if (response.data.idToken) {
          await AsyncStorage.setItem('idToken', response.data.idToken);
          await AsyncStorage.setItem('user', response.data.user ? JSON.stringify(response.data.user) : '');
          console.log('idToken salvo com sucesso!');
        } else {
          console.warn('idToken não encontrado na resposta do login');
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
            const status = error.response.status;

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
        setLoginPressed(false);
      }
    };

    authenticate();
  }, [loginPressed, email, senha]); // Dependências ajustadas


  // Função para o Cadastro
  const handleRegister = async () => {
    setLoadingRegister(true);
    setRegisterError('');

    const cleanedCpfForApi = cpf.replace(/\D/g, '');
    const cleanedCnpjForApi = cnpj.replace(/\D/g, '');

    const isCpfFilled = cleanedCpfForApi.length === 11;
    const isCorporateNameFilled = corporateName.length > 0;
    const isCnpjFilled = cleanedCnpjForApi.length === 14;

    if (!fullName || !registerEmail || !registerPassword || !confirmPassword) {
      setRegisterError('Por favor, preencha nome completo, email e senhas.');
      setLoadingRegister(false);
      return;
    }

    if (!isCpfFilled && !isCorporateNameFilled) {
      setRegisterError('Por favor, preencha o CPF (se pessoa física) ou a Razão Social (se pessoa jurídica).');
      setLoadingRegister(false);
      return;
    }

    if (isCorporateNameFilled && !isCnpjFilled) {
      setRegisterError('Por favor, preencha o CNPJ.');
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

    const registerData: any = {
      fullName: fullName,
      email: registerEmail,
      password: registerPassword,
      confirmPassword: confirmPassword,
    };

    if (isCorporateNameFilled && isCnpjFilled) {
      registerData.corporateName = corporateName;
      registerData.cnpj = cleanedCnpjForApi;
      // Não envia CPF se a Razão Social/CNPJ foi preenchida
    } else if (isCpfFilled) {
      registerData.cpf = cleanedCpfForApi;
      // Não envia CNPJ se o CPF foi preenchido
    }

    console.log('Dados de cadastro a serem enviados:', registerData);

    try {
      const response = await axiosService.post('/users/register', registerData);

      console.log('Usuário cadastrado com sucesso!', response.data);
      setDialogVisible(true);
      <DialogCopagro title="Sucesso" content="Cadastro realizado com sucesso! Agora você pode fazer login." visible={dialogVisible} hideDialog={() => setDialogVisible(false)} />

      setCorporateName('');
      setFullName('');
      setCpf('');
      setCnpj('');
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setRegisterError('');

      // animateDown();

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
  
  const handleDialogClose = () => {
    setDialogVisible(false);
    animateDown();
  };

  // Animação para subir (mostrar cadastro)
  const animateUp = () => {
    setRegisterError(''); 
    setCorporateName('');
    setFullName('');
    setCpf('');
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');
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
    setRegisterError('');
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkTheme ? '#121212' : '#fff' }]}>
      {/* TELA DE LOGIN */}
      <Animated.View style={[styles.containerLogin, { transform: [{ translateY }] }]}>
        <LogoCopagro />

        <View style={styles.centeredContent}>
          <Text style={styles.title}>Login</Text>
          <Text style={[styles.subtitle, { color: isDarkTheme ? '#CCC' : '#444' }]}>
            Faça o login para realizar suas consultas...
          </Text>

          {/* Campo de email */}
          <View style={styles.inputGroup}>
            <TextInputCopagro
              label={"Email"}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loadingLogin}
              darkMode={isDarkTheme}
            />
          </View>

          {/* Campo de senha */}
          <View style={styles.inputGroup}>
            <TextInputCopagro
              label={"Senha"}
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!loadingLogin}
              darkMode={isDarkTheme}
            />
          </View>

          {/* Exibe o aviso de erro de login */}
          {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

          <TouchableOpacity onPress={() => router.push('/Auth/ForgotPsswrd')}>
          <Text style={[styles.forgotText, { color: isDarkTheme ? '#DDD' : '#444' }]}>Esqueceu a senha?</Text>         
          </TouchableOpacity>

          <ButtonCopagro
            onPress={() => setLoginPressed(true)}
            label={loadingLogin ? 'Entrando...' : 'Entrar'}
            disabled={loadingLogin}
            textColor={isDarkTheme ? '#FFF' : '#FFF'} 
          />
          {/* Indicador de carregamento do login */}
          {loadingLogin && <ActivityIndicator size="small" color="#028C48" style={{ marginTop: 10 }} />}
        </View>

        {!registerVisible && (
          <View style={styles.fixedRegisterButton}>
            <TouchableOpacity
              style={[styles.registerButtonLoginScreen, { flexDirection: 'column' }]}
              onPress={animateUp}
            >
              <MaterialCommunityIcons name="chevron-up" size={40} color="#fff" />
              <Text style={styles.registerText}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        )}

      </Animated.View>

      {/* TELA DE CADASTRO */}
      {registerVisible && (
        <Animated.View
          style={[
            styles.registerScreen,
            { 
              transform: [{ translateY }],
              backgroundColor: isDarkTheme ? '#121212' : '#fff'
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <LogoCopagro />

            <Text style={styles.title}>Cadastro</Text>
            <Text
              style={[
                styles.subtitle,
                { color: isDarkTheme ? '#FFF' : '#000' } // cor branca no modo escuro, preta no claro
              ]}
            >
              Conte-nos um pouco sobre você...
            </Text>

            {/* Usando TextInputCopagro para Razão Social */}
            <View style={styles.inputGroup}>
              <TextInputCopagro
                label={"Razão social - Necessário para CNPJ"}
                placeholder="Razão social"
                value={corporateName}
                onChangeText={onCorporateNameChange}
                editable={!loadingRegister}
                darkMode={isDarkTheme}
              />
            </View>

            {corporateName.length > 0 ? (
              // Se Razão Social estiver preenchida, mostra o campo CNPJ e a nota
              <>
                <View style={styles.inputGroup}>
                  <TextInputCopagro
                    label="CNPJ"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChangeText={onCnpjChange}
                    maxLength={18} // 14 dígitos + 4 caracteres de formatação = 18
                    keyboardType="number-pad"
                    editable={!loadingRegister}
                    darkMode={isDarkTheme}
                  />
                </View>
              </>
            ) : (
              // Se Razão Social estiver vazia, mostra o campo CPF
              <View style={styles.inputGroup}>
                <TextInputCopagro
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChangeText={handleCpfChange} // CPF usa o handler com formatação
                  maxLength={14}
                  keyboardType="number-pad"
                  editable={!loadingRegister}
                  darkMode={isDarkTheme}
                />
              </View>
            )}

            {/* Usando TextInputCopagro para Nome completo */}
            <View style={styles.inputGroup}>
              <TextInputCopagro
                label={"Nome completo"}
                placeholder="Nome completo"
                value={fullName}
                onChangeText={setFullName}
                editable={!loadingRegister}
                darkMode={isDarkTheme}
              />
            </View>

            {/* Usando TextInputCopagro para Email de Cadastro */}
            <View style={styles.inputGroup}>
              <TextInputCopagro
                label={"Email"}
                placeholder="Email"
                value={registerEmail}
                onChangeText={setRegisterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loadingRegister}
                darkMode={isDarkTheme}
              />
            </View>

            {/* Usando TextInputCopagro para Senha de Cadastro */}
            <View style={styles.inputGroup}>
              <TextInputCopagro
                label={"Senha"}
                placeholder="A senha deve ter pelo menos 8 caracteres"
                value={registerPassword}
                onChangeText={setRegisterPassword}
                secureTextEntry
                editable={!loadingRegister}
                darkMode={isDarkTheme}
              />
            </View>

            {/* Usando TextInputCopagro para Confirmar Senha */}
            <View style={styles.inputGroup}>
              <TextInputCopagro
                label={"Confirmar senha"}
                placeholder="Digite novamente a senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loadingRegister}
                darkMode={isDarkTheme}
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
              <Text
                style={[
                  styles.forgotText,
                  {
                    textAlign: 'center',
                    marginTop: 20,
                    marginRight: 0,
                    color: isDarkTheme ? '#DDD' : '#444'
                  },
                ]}
              >
                Voltar ao login
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}
      <DialogCopagro 
        title="Sucesso" 
        content="Cadastro realizado com sucesso! Agora você pode fazer login." 
        visible={dialogVisible} 
        hideDialog={handleDialogClose} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixedRegisterButton: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 10,
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
    paddingVertical: 5,
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