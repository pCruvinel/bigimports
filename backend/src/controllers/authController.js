const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');

/**
 * Login de usuário
 * Verifica credenciais via Supabase Auth e retorna token JWT
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email e senha são obrigatórios',
          status: 400
        }
      });
    }

    // Autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return res.status(401).json({
        error: {
          message: 'Credenciais inválidas',
          status: 401
        }
      });
    }

    // Buscar dados completos do usuário na view users_with_roles
    const { data: user, error: userError } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        error: {
          message: 'Usuário não encontrado',
          status: 401
        }
      });
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      return res.status(403).json({
        error: {
          message: 'Usuário inativo. Entre em contato com o administrador.',
          status: 403
        }
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role_name,
        instanceId: user.instance_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    // Retornar token e informações do usuário (sem a senha)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      instanceId: user.instance_id,
      instanceStatus: user.instance_status,
      whatsappPhone: user.whatsapp_phone,
      profilePic: user.profile_pic,
      plan: user.plan
    };

    return res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao processar login',
        status: 500
      }
    });
  }
};

/**
 * Obter dados do usuário autenticado
 * Requer autenticação (authMiddleware)
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar dados atualizados do usuário
    const { data: user, error } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: {
          message: 'Usuário não encontrado',
          status: 404
        }
      });
    }

    // Retornar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      instanceId: user.instance_id,
      instanceStatus: user.instance_status,
      whatsappPhone: user.whatsapp_phone,
      profilePic: user.profile_pic,
      plan: user.plan,
      qrGeneratedAt: user.qr_generated_at,
      connectedAt: user.connected_at,
      maxSearchesPerDay: user.max_searches_per_day,
      status: user.status
    };

    return res.status(200).json({
      user: userData
    });

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar dados do usuário',
        status: 500
      }
    });
  }
};

/**
 * Logout (invalidação do token será feita no frontend)
 */
const logout = async (req, res) => {
  try {
    // No caso de JWT, o logout é feito no frontend removendo o token
    // Aqui podemos apenas retornar sucesso
    return res.status(200).json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao processar logout',
        status: 500
      }
    });
  }
};

module.exports = {
  login,
  getMe,
  logout
};
