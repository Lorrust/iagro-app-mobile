import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'; // ou ajuste conforme seu roteamento

const axiosInstance = axios.create({
  baseURL: 'http://10.0.2.2:3000', // ajuste conforme seu back-end
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Intercepta respostas para tratar erro 401 ou 400
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && (error.response.status === 401 || error.response.status === 400)) {
      // Remove dados do AsyncStorage
      await AsyncStorage.removeItem('user');

      // Redireciona para tela de login
      router.replace('/Auth/LoginSys'); // use 'replace' para não voltar ao Home
    }
    return Promise.reject(error);
  }
);

// Funções utilitárias
const get = (url, params = {}, config = {}) => {
  return requisition(url, 'get', null, params, config);
};

const post = (url, data, config = {}) => {
  return requisition(url, 'post', data, {}, config);
};

const put = (url, data, config = {}) => {
  return requisition(url, 'put', data, {}, config);
};

const del = (url, data, config = {}) => {
  return requisition(url, 'delete', data, {}, config);
};


// Função principal para requisitar
const requisition = async (url, method, data = null, params = {}, config = {}) => {
  const userData = await AsyncStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const token = user ? user.token : null;
  const idCompany = await AsyncStorage.getItem('id-company');

  const headers = {
    ...(token && { token }),
    ...(idCompany && { 'id-company': idCompany }),
    "X-Requested-With": "XMLHttpRequest",
    ...config.headers, // ← importante: mesclar headers adicionais
  };

  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      headers,
      params,
      ...config, // ← passa o restante do config também, como timeout, etc
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export default { get, post, put, del };
