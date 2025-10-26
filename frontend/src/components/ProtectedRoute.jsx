import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente para proteger rotas que requerem autenticação
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente filho a ser renderizado se autenticado
 * @param {string[]} props.allowedRoles - Array de roles permitidas (ex: ['admin'])
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se o usuário tem a role necessária
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirecionar para a página apropriada baseada na role do usuário
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Usuário autenticado e autorizado
  return children;
};

export default ProtectedRoute;
