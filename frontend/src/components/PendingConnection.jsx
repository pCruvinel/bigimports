import { useState, useEffect } from 'react';
import * as userService from '../services/userService';
import '../styles/PendingConnection.css';

/**
 * Componente para exibir QR Code quando conexão está pendente
 */
const PendingConnection = ({ status, onStatusChange }) => {
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(40);
  const [canRegenerate, setCanRegenerate] = useState(false);

  // Calcular tempo restante para poder regenerar
  useEffect(() => {
    if (!status.qrGeneratedAt) {
      setCanRegenerate(true);
      return;
    }

    const calculateCountdown = () => {
      const qrGeneratedTime = new Date(status.qrGeneratedAt).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - qrGeneratedTime) / 1000);
      const remaining = Math.max(0, 40 - elapsedSeconds);

      setCountdown(remaining);
      setCanRegenerate(remaining === 0);
    };

    calculateCountdown();

    // Atualizar countdown a cada segundo
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [status.qrGeneratedAt]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');

    const result = await userService.regenerateQR();

    if (result.success) {
      onStatusChange();
    } else {
      setError(result.message);
      if (result.remainingTime) {
        setCountdown(result.remainingTime);
      }
    }

    setRegenerating(false);
  };

  return (
    <div className="connection-status pending">
      <div className="status-header">
        <div className="status-icon pending-icon">
          <div className="spinner"></div>
        </div>
        <h2>Aguardando Conexão</h2>
      </div>

      <div className="qr-code-section">
        <p className="instruction">
          Escaneie o QR Code abaixo com seu WhatsApp:
        </p>

        {status.qrCodeData ? (
          <div className="qr-code-container">
            <img
              src={`data:image/png;base64,${status.qrCodeData}`}
              alt="QR Code WhatsApp"
              className="qr-code-image"
            />
          </div>
        ) : (
          <div className="qr-code-loading">
            <div className="spinner"></div>
            <p>Gerando QR Code...</p>
          </div>
        )}

        <div className="qr-instructions">
          <h4>Como conectar:</h4>
          <ol>
            <li>Abra o WhatsApp no seu celular</li>
            <li>Toque em <strong>Mais opções</strong> (⋮) ou <strong>Configurações</strong></li>
            <li>Selecione <strong>Dispositivos conectados</strong></li>
            <li>Toque em <strong>Conectar um dispositivo</strong></li>
            <li>Aponte seu celular para esta tela para escanear o QR Code</li>
          </ol>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="regenerate-section">
        <button
          onClick={handleRegenerate}
          disabled={!canRegenerate || regenerating}
          className="regenerate-button"
        >
          {regenerating
            ? 'Gerando...'
            : canRegenerate
            ? 'Gerar Novo QR Code'
            : `Aguarde ${countdown}s para gerar novo QR`}
        </button>

        {!canRegenerate && (
          <p className="countdown-hint">
            O QR Code expira após alguns minutos. Você poderá gerar um novo em {countdown} segundos.
          </p>
        )}
      </div>
    </div>
  );
};

export default PendingConnection;
