const { supabaseAdmin } = require('../config/database');

/**
 * Controller para gerenciar configurações do sistema
 */

/**
 * Obter todas as configurações
 */
const getAllConfigs = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('id, config_key, config_value, config_type, description, updated_at')
      .order('config_key');

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar configurações'
      });
    }

    // Mascarar valores de senha
    const maskedData = data.map(config => ({
      ...config,
      config_value: config.config_type === 'password' && config.config_value
        ? '••••••••'
        : config.config_value
    }));

    res.json({
      success: true,
      data: maskedData
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obter configuração por chave
 */
const getConfigByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .eq('config_key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Configuração não encontrada'
        });
      }
      console.error('Erro ao buscar configuração:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar configuração'
      });
    }

    // Mascarar senha
    if (data.config_type === 'password' && data.config_value) {
      data.config_value = '••••••••';
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualizar configuração
 */
const updateConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { config_value } = req.body;

    if (config_value === undefined || config_value === null) {
      return res.status(400).json({
        success: false,
        message: 'Valor da configuração é obrigatório'
      });
    }

    // Verificar se a configuração existe
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('system_config')
      .select('id, config_type')
      .eq('config_key', key)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    // Não atualizar se o valor for a máscara de senha
    if (existing.config_type === 'password' && config_value === '••••••••') {
      return res.status(400).json({
        success: false,
        message: 'Forneça um novo valor para a senha'
      });
    }

    // Atualizar configuração
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .update({
        config_value,
        updated_by: req.user.id // ID do admin que está atualizando
      })
      .eq('config_key', key)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuração:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configuração'
      });
    }

    // Mascarar senha na resposta
    if (data.config_type === 'password' && data.config_value) {
      data.config_value = '••••••••';
    }

    res.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualizar múltiplas configurações de uma vez
 */
const updateMultipleConfigs = async (req, res) => {
  try {
    const { configs } = req.body; // Array de { config_key, config_value }

    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Forneça um array de configurações para atualizar'
      });
    }

    const results = [];
    const errors = [];

    for (const config of configs) {
      const { config_key, config_value } = config;

      // Pular valores mascarados de senha
      const { data: existing } = await supabaseAdmin
        .from('system_config')
        .select('config_type')
        .eq('config_key', config_key)
        .single();

      if (existing?.config_type === 'password' && config_value === '••••••••') {
        continue; // Não atualizar senhas mascaradas
      }

      const { data, error } = await supabaseAdmin
        .from('system_config')
        .update({
          config_value,
          updated_by: req.user.id
        })
        .eq('config_key', config_key)
        .select()
        .single();

      if (error) {
        errors.push({ config_key, error: error.message });
      } else {
        results.push(data);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Algumas configurações falharam ao atualizar',
        errors
      });
    }

    res.json({
      success: true,
      message: `${results.length} configurações atualizadas com sucesso`,
      data: results
    });
  } catch (error) {
    console.error('Erro ao atualizar múltiplas configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Testar conexão com Supabase usando credenciais fornecidas
 */
const testSupabaseConnection = async (req, res) => {
  try {
    const { supabase_url, supabase_service_key } = req.body;

    if (!supabase_url || !supabase_service_key) {
      return res.status(400).json({
        success: false,
        message: 'URL e Service Key do Supabase são obrigatórios'
      });
    }

    // Tentar criar cliente temporário
    const { createClient } = require('@supabase/supabase-js');
    const testClient = createClient(supabase_url, supabase_service_key);

    // Testar conexão
    const { data, error } = await testClient
      .from('roles')
      .select('id, name')
      .limit(1);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Falha ao conectar: ' + error.message
      });
    }

    res.json({
      success: true,
      message: 'Conexão com Supabase estabelecida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao testar conexão Supabase:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao testar conexão: ' + error.message
    });
  }
};

module.exports = {
  getAllConfigs,
  getConfigByKey,
  updateConfig,
  updateMultipleConfigs,
  testSupabaseConnection
};
