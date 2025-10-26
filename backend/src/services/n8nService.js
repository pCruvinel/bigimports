const axios = require('axios');
const { supabaseAdmin } = require('../config/database');

/**
 * Serviço para interagir com os webhooks do n8n
 */

/**
 * Obter configuração do banco de dados
 * @param {string} key - Chave da configuração
 * @returns {Promise<string>} Valor da configuração
 */
const getConfig = async (key) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('config_value')
      .eq('config_key', key)
      .single();

    if (error || !data) {
      // Fallback para .env se não encontrar no banco
      console.warn(`Configuração ${key} não encontrada no banco, usando .env`);
      return process.env[key];
    }

    return data.config_value || process.env[key];
  } catch (error) {
    console.error(`Erro ao buscar configuração ${key}:`, error.message);
    return process.env[key]; // Fallback para .env em caso de erro
  }
};

/**
 * Criar instância no n8n
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Resposta do n8n com QR Code
 */
const createInstance = async (userId) => {
  try {
    const webhookUrl = await getConfig('N8N_WEBHOOK_CREATE_INSTANCE');

    if (!webhookUrl) {
      throw new Error('Webhook de criação de instância não configurado');
    }

    const response = await axios.post(
      webhookUrl,
      { id: userId },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao criar instância no n8n:', error.message);

    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || error.response.data || 'Erro ao criar instância',
        status: error.response.status
      };
    }

    return {
      success: false,
      error: 'Erro ao comunicar com o servidor de automação',
      status: 500
    };
  }
};

/**
 * Regenerar QR Code no n8n
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Resposta do n8n com novo QR Code
 */
const regenerateQRCode = async (userId) => {
  try {
    const webhookUrl = await getConfig('N8N_WEBHOOK_REGENERATE_QR');

    if (!webhookUrl) {
      throw new Error('Webhook de regeneração de QR Code não configurado');
    }

    const response = await axios.post(
      webhookUrl,
      { id: userId },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao regenerar QR Code no n8n:', error.message);

    if (error.response) {
      // Erro 429 = Too Many Requests (rate limit)
      if (error.response.status === 429) {
        return {
          success: false,
          error: error.response.data?.message || 'Aguarde 40 segundos antes de gerar um novo QR Code',
          status: 429,
          remainingTime: error.response.data?.remainingTime
        };
      }

      return {
        success: false,
        error: error.response.data?.message || error.response.data || 'Erro ao regenerar QR Code',
        status: error.response.status
      };
    }

    return {
      success: false,
      error: 'Erro ao comunicar com o servidor de automação',
      status: 500
    };
  }
};

/**
 * Desconectar instância no n8n
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Resposta do n8n
 */
const disconnectInstance = async (userId) => {
  try {
    const webhookUrl = await getConfig('N8N_WEBHOOK_DISCONNECT_INSTANCE');

    if (!webhookUrl) {
      throw new Error('Webhook de desconexão de instância não configurado');
    }

    const response = await axios.post(
      webhookUrl,
      { id: userId },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao desconectar instância no n8n:', error.message);

    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || error.response.data || 'Erro ao desconectar instância',
        status: error.response.status
      };
    }

    return {
      success: false,
      error: 'Erro ao comunicar com o servidor de automação',
      status: 500
    };
  }
};

module.exports = {
  createInstance,
  regenerateQRCode,
  disconnectInstance
};
