import { useState } from 'react';
import * as userService from '../services/userService';
import '../styles/ConnectionStatus.css';

/**
 * Componente para exibir status de conexão ativa
 */
const ConnectionStatus = ({ status, onStatusChange }) => {
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar?')) {
      return;
    }

    setDisconnecting(true);
    setError('');

    const result = await userService.disconnect();

    if (result.success) {
      onStatusChange();
    } else {
      setError(result.message);
    }

    setDisconnecting(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="connection-status connected">
      <div className="status-header">
        <div className="status-icon success">✓</div>
        <h2>Conexão Ativa</h2>
      </div>

      <div className="status-info">
        {status.profilePic && (
          <div className="profile-pic-container">
            <img
              src={status.profilePic}
              alt="Foto de perfil WhatsApp"
              className="profile-pic"
            />
          </div>
        )}

        <div className="info-group">
          <label>Nome:</label>
          <span>{status.name || 'N/A'}</span>
        </div>

        <div className="info-group">
          <label>WhatsApp:</label>
          <span>{status.whatsappPhone || 'N/A'}</span>
        </div>

        <div className="info-group">
          <label>Conectado em:</label>
          <span>{formatDate(status.connectedAt)}</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        onClick={handleDisconnect}
        disabled={disconnecting}
        className="disconnect-button"
      >
        {disconnecting ? 'Desconectando...' : 'Desconectar Instância'}
      </button>
    </div>
  );
};

export default ConnectionStatus;
