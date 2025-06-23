//React imports
import React, { useState, useContext } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";

//Expo imports
import { BlurView } from "expo-blur";

//Components imports
import { LogoCopagro } from "../components/LogoCopagro";
import { ButtonCopagro } from "../components/Button";
import { TextInputCopagro } from "../components/ButtonTxt";

//Axios imports
import axiosService from "../../services/axiosService";
import axios, { AxiosError } from "axios";

//Contexts imports
import { ThemeContext } from "../contexts/ThemeContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(""); 
  const [successMessage, setSuccessMessage] = useState("");
  const { isDarkTheme } = useContext(ThemeContext);

  // Função para lidar com o envio do email de recuperação
  const handleSendEmail = async () => {
    setLoading(true); // Inicia o carregamento
    setError(""); // Limpa erros anteriores
    setSuccessMessage(""); // Limpa mensagem de sucesso anterior

    // Regex para validação de email 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, insira um email válido.");
      setLoading(false);
      return;
    }

    try {

      // Endpoint para gerar o link de reset de senha
      const endpoint = "/auth/send-password-reset-email";
      const response = await axiosService.post(endpoint, { email });

      console.log("Link de recuperação gerado com sucesso!", response.data);
      setSuccessMessage("Link de recuperação enviado para o seu email!");
      
    } catch (error) {
      console.error("Erro ao enviar email de recuperação:", error);

      // Verifica se o erro é do tipo AxiosError
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", {
          data: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          message: error.message,
        });

        // Exibe mensagem de erro apropriada
        // Se a resposta do servidor contiver uma mensagem de erro específica
        if (error.response) {
          const errorMessage =
            error.response.data?.message ||
            "Erro ao enviar email de recuperação.";
          setError(`Erro: ${errorMessage}`);
        } else if (error.request) {
          setError("Erro de rede. Verifique sua conexão.");
        } else {
          setError(`Ocorreu um erro: ${error.message}`);
        }
      } else {

        console.error("Unknown Error:", error);
        setError("Ocorreu um erro inesperado.");
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/celeiro.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Blur apenas no fundo */}
      <BlurView intensity={50} tint="default" style={StyleSheet.absoluteFill} />

      {/* Logo no topo */}
      <View style={styles.logoContainer}>
        <LogoCopagro />
      </View>

      {/* Card central */}
      <View style={styles.bottomContainer}>
        <View
          style={[
            styles.textContainer,
            { backgroundColor: isDarkTheme ? "#1E1E1E" : "#FFF" },
          ]}
        >
          <Text
            style={[
              styles.EsqueceuSenha,
              { color: isDarkTheme ? "#FFF" : "#000" },
            ]}
          >
            Esqueceu a senha?
          </Text>

          {/* Input de Email */}
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
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}

          {/* Botão para enviar email */}
          <ButtonCopagro
            label={loading ? "Enviando..." : "Enviar email"}
            onPress={handleSendEmail}
            disabled={loading}
          />

          {/* Indicador de carregamento */}
          {loading && (
            <ActivityIndicator
              size="small"
              color="#0B845C"
              style={{ marginTop: 10 }}
            />
          )}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  bottomContainer: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 30,
  },
  textContainer: {
    borderRadius: 34,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  EsqueceuSenha: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  errorText: {
    color: "red",
    fontSize: 13,
    textAlign: "center",
    marginTop: -10,
    marginBottom: 10,
  },
  successText: {
    color: "green",
    fontSize: 13,
    textAlign: "center",
    marginTop: -10,
    marginBottom: 10,
  },
  forgotText: {
    color: "#444",
    marginBottom: 0,
    textDecorationLine: "underline",
  },
});
