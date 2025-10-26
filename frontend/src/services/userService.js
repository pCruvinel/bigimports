import api from './api';

/**
 * Serviço para gerenciar conexão WhatsApp do usuário
 */

/**
 * Obter status da conexão
 */
export const getStatus = async () => {
  try {
    const response = await api.get('/user/status');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erro ao buscar status'
    };
  }
};

/**
 * Conectar instância WhatsApp
 */
export const connect = async () => {
  try {
    const response = await api.post('/user/connect');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erro ao conectar'
    };
  }
};

/**
 * Regenerar QR Code
 */
export const regenerateQR = async () => {
  try {
    const response = await api.post('/user/regenerate-qr');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erro ao regenerar QR Code',
      remainingTime: error.data?.error?.remainingTime
    };
  }
};

/**
 * Desconectar instância
 */
export const disconnect = async () => {
  try {
    const response = await api.post('/user/disconnect');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erro ao desconectar'
    };
  }
};
