import { useState, useEffect, useCallback, useRef } from 'react';
import * as userService from '../services/userService';

/**
 * Hook customizado para gerenciar status da conexão WhatsApp
 * Inclui polling automático quando status é 'pending_connection'
 * com backoff em caso de erros e Page Visibility awareness
 */
export const useWhatsAppStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingInterval = useRef(null);
  const errorCount = useRef(0);
  const maxPollingDuration = useRef(null); // Timeout máximo para polling

  const POLLING_INTERVAL_MS = 4000;
  const MAX_POLLING_DURATION_MS = 5 * 60 * 1000; // 5 minutos máximo de polling
  const MAX_ERROR_BACKOFF_MS = 30000; // 30 segundos máximo de backoff

  // Função para buscar status
  const fetchStatus = useCallback(async () => {
    const result = await userService.getStatus();

    if (result.success) {
      setStatus(result.data);
      setError(null);
      errorCount.current = 0; // Reset error count on success
    } else {
      errorCount.current += 1;
      setError(result.message);
    }

    setLoading(false);
  }, []);

  // Calcular intervalo com backoff em caso de erros
  const getPollingInterval = useCallback(() => {
    if (errorCount.current === 0) return POLLING_INTERVAL_MS;
    // Exponential backoff: 4s -> 8s -> 16s -> 30s (cap)
    const backoff = Math.min(
      POLLING_INTERVAL_MS * Math.pow(2, errorCount.current),
      MAX_ERROR_BACKOFF_MS
    );
    return backoff;
  }, []);

  // Iniciar polling
  const startPolling = useCallback(() => {
    // Limpar polling existente
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Definir timeout máximo para polling
    maxPollingDuration.current = setTimeout(() => {
      stopPolling();
      setError('Tempo limite de conexão atingido. Clique em "Gerar Novo QR Code" para tentar novamente.');
    }, MAX_POLLING_DURATION_MS);

    // Iniciar novo polling
    const scheduleNext = () => {
      pollingInterval.current = setTimeout(async () => {
        await fetchStatus();
        // Continuar polling se ainda estiver pending
        scheduleNext();
      }, getPollingInterval());
    };

    scheduleNext();
  }, [fetchStatus, getPollingInterval]);

  // Parar polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearTimeout(pollingInterval.current);
      pollingInterval.current = null;
    }
    if (maxPollingDuration.current) {
      clearTimeout(maxPollingDuration.current);
      maxPollingDuration.current = null;
    }
  }, []);

  // Page Visibility: pausar polling quando tab está em background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (status?.status === 'pending_connection') {
        fetchStatus(); // Buscar status atualizado imediatamente
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status?.status, startPolling, stopPolling, fetchStatus]);

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
    errorCount.current = 0; // Reset error count
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
