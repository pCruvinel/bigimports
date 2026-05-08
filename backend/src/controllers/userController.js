const { supabaseAdmin } = require('../config/database');
const n8nService = require('../services/n8nService');

/**
 * Obter status do usuário
 * GET /api/user/status
 */
const getStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar dados do usuário (profile_pic não existe na view, vem da tabela users)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, instance_status, qr_generated_at, profile_pic, connected_at, qr_code_data, whatsapp_phone')
      .eq('id', userId)
      .maybeSingle();



    if (error) {
      console.error('[getStatus] Erro ao buscar usuário:', error.message);
      return res.status(500).json({
        error: {
          message: `Erro ao buscar usuário: ${error.message}`,
          status: 500
        }
      });
    }

    if (!user) {

      return res.status(404).json({
        error: {
          message: 'Usuário não encontrado',
          status: 404
        }
      });
    }

    // Verificar se pode regenerar QR Code (40 segundos)
    let canRegenerate = false;
    if (user.qr_generated_at && user.instance_status === 'pending_connection') {
      const qrGeneratedTime = new Date(user.qr_generated_at).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = (now - qrGeneratedTime) / 1000;
      canRegenerate = elapsedSeconds >= 40;
    }

    return res.status(200).json({
      status: user.instance_status,
      qrGeneratedAt: user.qr_generated_at,
      profilePic: user.profile_pic,
      connectedAt: user.connected_at,
      qrCodeData: user.qr_code_data,
      whatsappPhone: user.whatsapp_phone,
      name: user.name,
      canRegenerate
    });

  } catch (error) {
    console.error('Erro ao buscar status do usuário:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar status',
        status: 500
      }
    });
  }
};

/**
 * Conectar instância WhatsApp
 * POST /api/user/connect
 */
const connect = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar status atual do usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('instance_status, status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: {
          message: 'Usuário não encontrado',
          status: 404
        }
      });
    }

    // Verificar se usuário está ativo
    if (user.status !== 'active') {
      return res.status(403).json({
        error: {
          message: 'Usuário inativo. Entre em contato com o administrador.',
          status: 403
        }
      });
    }

    // Verificar se já está conectado ou pendente
    if (user.instance_status === 'connected') {
      return res.status(400).json({
        error: {
          message: 'Já existe uma conexão ativa',
          status: 400
        }
      });
    }

    if (user.instance_status === 'pending_connection') {
      return res.status(400).json({
        error: {
          message: 'Já existe uma tentativa de conexão em andamento',
          status: 400
        }
      });
    }

    // Chamar webhook n8n para criar instância
    const result = await n8nService.createInstance(userId);

    if (!result.success) {
      return res.status(result.status || 500).json({
        error: {
          message: result.error,
          status: result.status || 500
        }
      });
    }

    // Retornar sucesso com dados do QR Code
    return res.status(200).json({
      message: 'Instância criada com sucesso',
      qrCode: result.data.qrCode || result.data.qr_code,
      instanceId: result.data.instanceId || result.data.instance_id
    });

  } catch (error) {
    console.error('Erro ao conectar instância:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao processar conexão',
        status: 500
      }
    });
  }
};

/**
 * Regenerar QR Code
 * POST /api/user/regenerate-qr
 */
const regenerateQR = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar status atual do usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('instance_status, qr_generated_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: {
          message: 'Usuário não encontrado',
          status: 404
        }
      });
    }

    // Verificar se está em pending_connection
    if (user.instance_status !== 'pending_connection') {
      return res.status(400).json({
        error: {
          message: 'Não há conexão pendente para regenerar QR Code',
          status: 400
        }
      });
    }

    // Verificar se passaram 40 segundos (validação no frontend também)
    if (user.qr_generated_at) {
      const qrGeneratedTime = new Date(user.qr_generated_at).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = (now - qrGeneratedTime) / 1000;

      if (elapsedSeconds < 40) {
        const remainingTime = Math.ceil(40 - elapsedSeconds);
        return res.status(429).json({
          error: {
            message: `Aguarde ${remainingTime} segundos antes de gerar um novo QR Code`,
            status: 429,
            remainingTime
          }
        });
      }
    }

    // Chamar webhook n8n para regenerar QR Code
    const result = await n8nService.regenerateQRCode(userId);

    if (!result.success) {
      return res.status(result.status || 500).json({
        error: {
          message: result.error,
          status: result.status || 500,
          remainingTime: result.remainingTime
        }
      });
    }

    // Retornar sucesso com novo QR Code
    return res.status(200).json({
      message: 'QR Code regenerado com sucesso',
      qrCode: result.data.qrCode || result.data.qr_code,
      instanceId: result.data.instanceId || result.data.instance_id
    });

  } catch (error) {
    console.error('Erro ao regenerar QR Code:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao regenerar QR Code',
        status: 500
      }
    });
  }
};

/**
 * Desconectar instância
 * POST /api/user/disconnect
 */
const disconnect = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar se está conectado
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('instance_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: {
          message: 'Usuário não encontrado',
          status: 404
        }
      });
    }

    if (user.instance_status !== 'connected') {
      return res.status(400).json({
        error: {
          message: 'Não há conexão ativa para desconectar',
          status: 400
        }
      });
    }

    // Chamar webhook n8n para desconectar
    const result = await n8nService.disconnectInstance(userId);

    if (!result.success) {
      return res.status(result.status || 500).json({
        error: {
          message: result.error,
          status: result.status || 500
        }
      });
    }

    return res.status(200).json({
      message: 'Instância desconectada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desconectar instância:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao desconectar instância',
        status: 500
      }
    });
  }
};

module.exports = {
  getStatus,
  connect,
  regenerateQR,
  disconnect
};
