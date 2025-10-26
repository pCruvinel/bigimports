import { useState } from 'react';
import * as userService from '../services/userService';
import '../styles/NotConnected.css';

/**
 * Componente para quando não há conexão ativa
 */
const NotConnected = ({ onStatusChange }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    const result = await userService.connect();

    if (result.success) {
      // Atualizar status para ver o QR Code
      onStatusChange();
    } else {
      setError(result.message);
    }

    setConnecting(false);
  };

  return (
    <div className="connection-status not-connected">
      <div className="status-header">
        <div className="status-icon warning">!</div>
        <h2>Conexão Inativa</h2>
      </div>

      <div className="status-message">
        <p>Conecte sua conta do WhatsApp para começar a usar o sistema.</p>
        <p className="hint">Você precisará escanear um QR Code com seu WhatsApp.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={connecting}
        className="connect-button"
      >
        {connecting ? 'Conectando...' : 'Conectar ao WhatsApp'}
      </button>
    </div>
  );
};

export default NotConnected;
