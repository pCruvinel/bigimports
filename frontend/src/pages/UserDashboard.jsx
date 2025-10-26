import { useAuth } from '../contexts/AuthContext';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';
import ConnectionStatus from '../components/ConnectionStatus';
import NotConnected from '../components/NotConnected';
import PendingConnection from '../components/PendingConnection';
import '../styles/UserDashboard.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { status, loading, error, refreshStatus } = useWhatsAppStatus();

  const handleLogout = async () => {
    await logout();
  };

  // Renderizar conteúdo baseado no status da conexão
  const renderConnectionContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner large"></div>
          <p>Carregando...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <div className="error-icon">✕</div>
          <h3>Erro ao carregar status</h3>
          <p>{error}</p>
          <button onClick={refreshStatus} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      );
    }

    // Renderização condicional baseada no instance_status
    switch (status?.status) {
      case 'connected':
        return <ConnectionStatus status={status} onStatusChange={refreshStatus} />;

      case 'pending_connection':
        return <PendingConnection status={status} onStatusChange={refreshStatus} />;

      case 'not_connected':
      case 'disconnected':
      case 'error':
      default:
        return <NotConnected onStatusChange={refreshStatus} />;
    }
  };

  return (
    <div className="user-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Meu Painel</h1>
            <p className="welcome-text">Bem-vindo, {user?.name}!</p>
          </div>
          <div className="header-right">
            <button onClick={handleLogout} className="logout-button">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="dashboard-container">
          {/* User Info Card */}
          <div className="user-info-card">
            <h3>Informações da Conta</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Nome:</label>
                <span>{user?.name}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{user?.email}</span>
              </div>
              <div className="info-item">
                <label>Plano:</label>
                <span className="badge">{user?.plan}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Connection Card */}
          <div className="whatsapp-connection-card">
            <h3>Conexão WhatsApp</h3>
            {renderConnectionContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
