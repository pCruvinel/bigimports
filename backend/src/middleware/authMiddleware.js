const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido e adiciona os dados do usuário ao request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obter token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: {
          message: 'Token não fornecido',
          status: 401
        }
      });
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({
        error: {
          message: 'Formato de token inválido',
          status: 401
        }
      });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({
        error: {
          message: 'Token mal formatado',
          status: 401
        }
      });
    }

    // Verificar e decodificar o token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: {
            message: 'Token inválido ou expirado',
            status: 401
          }
        });
      }

      // Adicionar informações do usuário ao request
      req.user = {
        id: decoded.userId,
        role: decoded.role,
        instanceId: decoded.instanceId
      };

      return next();
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao validar token',
        status: 500
      }
    });
  }
};

module.exports = authMiddleware;
