import { useState, useEffect, useCallback, useRef } from 'react';
import * as userService from '../services/userService';

/**
 * Hook customizado para gerenciar status da conexão WhatsApp
 * Inclui polling automático quando status é 'pending_connection'
 */
export const useWhatsAppStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingInterval = useRef(null);

  // Função para buscar status
  const fetchStatus = useCallback(async () => {
    const result = await userService.getStatus();

    if (result.success) {
      setStatus(result.data);
      setError(null);
    } else {
      setError(result.message);
    }

    setLoading(false);
  }, []);

  // Iniciar polling
  const startPolling = useCallback(() => {
    // Limpar polling existente
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Iniciar novo polling a cada 4 segundos
    pollingInterval.current = setInterval(() => {
      fetchStatus();
    }, 4000);
  }, [fetchStatus]);

  // Parar polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Efeito para controlar polling baseado no status
  useEffect(() => {
    if (status?.status === 'pending_connection') {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup ao desmontar componente
    return () => stopPolling();
  }, [status?.status, startPolling, stopPolling]);

  // Buscar status inicial
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Função para atualizar status manualmente (após connect, regenerate, etc)
  const refreshStatus = useCallback(() => {
    setLoading(true);
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refreshStatus
  };
};
