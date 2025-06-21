import React, { useState, useContext } from 'react'; // Adicionado useState
import { ImageBackground, StyleSheet, View, Text, ActivityIndicator } from 'react-native'; // Adicionado ActivityIndicator
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LogoCopagro } from '../components/LogoCopagro';
import { ButtonCopagro } from '../components/Button';
import { TextInputCopagro } from '../components/ButtonTxt';
import axiosService from '../../services/axiosService';
import axios, { AxiosError } from 'axios'; 
import { ThemeContext } from '../contexts/ThemeContext'; 

export default function ForgotPassword() {
  const [email, setEmail] = useState(''); // Usando useState em vez de React.useState
  const [loading, setLoading] = useState(false); // Estado para carregamento
  const [error, setError] = useState(''); // Estado para mensagens de erro
  const [successMessage, setSuccessMessage] = useState(''); // Estado para mensagem de sucesso
  const { isDarkTheme } = useContext(ThemeContext);

  // Função para lidar com o envio do email de recuperação
  const handleSendEmail = async () => {
    setLoading(true); // Inicia o carregamento
    setError(''); // Limpa erros anteriores
    setSuccessMessage(''); // Limpa mensagem de sucesso anterior

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido.');
      setLoading(false);
      return;
    }

    try {
      // Endpoint para gerar o link de reset de senha
      const endpoint = '/auth/send-password-reset-email';
      const response = await axiosService.post(endpoint, { email });

      console.log('Link de recuperação gerado com sucesso!', response.data);
      setSuccessMessage('Link de recuperação enviado para o seu email!');
      // Opcional: Limpar o campo de email após sucesso
      // setEmail('');

      // Se a API retornar o código de verificação diretamente (não recomendado por segurança, mas possível)
      // Se a API apenas envia o email e a navegação para CodVer é automática após sucesso
      // router.push('/Auth/CodVer'); // Navega para a tela de código de verificação

      // Se a navegação para CodVer depende do sucesso do envio do email
       // Você pode passar o email para a próxima tela se necessário
      

    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          data: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          message: error.message,
        });

        if (error.response) {
          // O backend retornou um status code fora da faixa 2xx
          const errorMessage = error.response.data?.message || 'Erro ao enviar email de recuperação.';
          setError(`Erro: ${errorMessage}`);
          // alert(`Erro ao enviar email: ${errorMessage}`); // Opcional, se quiser um alerta
        } else if (error.request) {
          // A requisição foi feita mas nenhuma resposta foi recebida (ex: rede offline)
          setError('Erro de rede. Verifique sua conexão.');
          // alert('Erro de rede. Verifique sua conexão.'); // Opcional
        } else {
          // Algo aconteceu na configuração da requisição que disparou um erro
          setError(`Ocorreu um erro: ${error.message}`);
          // alert(`Ocorreu um erro: ${error.message}`); // Opcional
        }
      } else {
        // Manipula erros que não são do Axios
        console.error('Unknown Error:', error);
        setError('Ocorreu um erro inesperado.');
        // alert('Ocorreu um erro inesperado.'); // Opcional
      }
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  };


  return (
    <ImageBackground
      source={require('../../assets/images/celeiro.png')}
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
        <View
          style={[
            styles.textContainer,
            { backgroundColor: isDarkTheme ? '#1E1E1E' : '#FFF' }
          ]}
        >
          <Text
            style={[
              styles.EsqueceuSenha,
              { color: isDarkTheme ? '#FFF' : '#000' }
            ]}
          >
            Esqueceu a senha?
          </Text>

          {/* Input de Email usando TextInputCopagro */}
          <TextInputCopagro
            label={"Email"}
            placeholder="Digite seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            darkMode={isDarkTheme}
          />

          {/* Exibe mensagem de erro ou sucesso */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}


          {/* Botão para enviar email */}
          <ButtonCopagro
            label={loading ? 'Enviando...' : 'Enviar email'} // Altera o label durante o carregamento
            onPress={handleSendEmail} // Chama a função handleSendEmail
            disabled={loading} // Desabilita o botão durante o carregamento
          />

          {/* Indicador de carregamento */}
          {loading && <ActivityIndicator size="small" color="#0B845C" style={{ marginTop: 10 }} />}

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
  // Removido styles.input, pois o estilo está no TextInputCopagro
  // input: {
  //   width: '100%',
  //   backgroundColor: 'white',
  //   borderRadius: 36,
  // },
  errorText: { // Estilo para mensagens de erro
    color: 'red',
    fontSize: 13,
    textAlign: 'center',
    marginTop: -10, // Ajuste para ficar mais próximo do input
    marginBottom: 10,
  },
   successText: { // Estilo para mensagens de sucesso
       color: 'green',
       fontSize: 13,
       textAlign: 'center',
       marginTop: -10,
       marginBottom: 10,
   },
   forgotText: { // Estilo para o link "Voltar para Login"
       color: '#444',
       marginBottom: 0, // Ajuste a margem conforme necessário
       textDecorationLine: 'underline',
       // alignSelf: 'center', // Já está centralizado pelo textContainer
   }
});