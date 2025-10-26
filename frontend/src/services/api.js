import axios from 'axios';

// Configuração base da API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erro com resposta do servidor
      const { status, data } = error.response;

      if (status === 401) {
        // Token inválido ou expirado
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      // Retornar mensagem de erro customizada
      return Promise.reject({
        status,
        message: data.error?.message || data.message || 'Erro ao processar requisição',
        data: data,
      });
    } else if (error.request) {
      // Requisição feita mas sem resposta
      return Promise.reject({
        message: 'Servidor não está respondendo. Tente novamente mais tarde.',
      });
    } else {
      // Erro ao configurar requisição
      return Promise.reject({
        message: error.message || 'Erro desconhecido',
      });
    }
  }
);

export default api;
