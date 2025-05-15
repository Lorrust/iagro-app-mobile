import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'; // ou ajuste conforme seu roteamento

const axiosInstance = axios.create({
  baseURL: 'http://192.168.56.1:3000', // ajuste conforme seu back-end
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
      await AsyncStorage.removeItem('id-company');

      // Redireciona para tela de login
      router.replace('/Auth/LoginSys'); // use 'replace' para não voltar ao Home
    }
    return Promise.reject(error);
  }
);

// Funções utilitárias
const get = (url, params = {}) => {
  return requisition(url, 'get', null, params);
};

const post = (url, data) => {
  return requisition(url, 'post', data);
};

const put = (url, data) => {
  return requisition(url, 'put', data);
};

const del = (url, data) => {
  return requisition(url, 'delete', data);
};

// Função principal para requisitar
const requisition = async (url, method, data = null, params = {}) => {
  // Obtém o token e id-company do AsyncStorage
  const userData = await AsyncStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const token = user ? user.token : null;
  const idCompany = await AsyncStorage.getItem('id-company');

  const headers = {
    ...(token && { token }),
    ...(idCompany && { 'id-company': idCompany }),
    "X-Requested-With": "XMLHttpRequest",
  };

  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      headers,
      params,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export default { get, post, put, del };
