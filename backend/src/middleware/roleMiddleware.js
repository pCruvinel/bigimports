/**
 * Middleware de autorização baseado em roles
 * Verifica se o usuário autenticado possui uma das roles permitidas
 *
 * @param {Array<string>} allowedRoles - Array de roles permitidas (ex: ['admin'])
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Verificar se o usuário foi autenticado (authMiddleware deve vir antes)
      if (!req.user) {
        return res.status(401).json({
          error: {
            message: 'Usuário não autenticado',
            status: 401
          }
        });
      }

      // Verificar se a role do usuário está entre as permitidas
      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: {
            message: 'Acesso negado. Você não tem permissão para acessar este recurso.',
            status: 403,
            requiredRoles: allowedRoles,
            userRole: userRole
          }
        });
      }

      // Usuário autorizado, prosseguir
      next();
    } catch (error) {
      console.error('Erro no middleware de autorização:', error);
      return res.status(500).json({
        error: {
          message: 'Erro ao verificar permissões',
          status: 500
        }
      });
    }
  };
};

module.exports = roleMiddleware;
