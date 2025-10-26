import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdminSettings() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editedValues, setEditedValues] = useState({});
  const [showPasswords, setShowPasswords] = useState({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/config');

      if (response.data.success) {
        setConfigs(response.data.data);
        // Inicializar valores editados
        const initialValues = {};
        response.data.data.forEach(config => {
          initialValues[config.config_key] = config.config_value || '';
        });
        setEditedValues(initialValues);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({
        text: 'Erro ao carregar configurações',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePasswordVisibility = (key) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      // Preparar array de configs para atualizar
      const configsToUpdate = configs.map(config => ({
        config_key: config.config_key,
        config_value: editedValues[config.config_key]
      }));

      const response = await api.put('/admin/config', {
        configs: configsToUpdate
      });

      if (response.data.success) {
        setMessage({
          text: 'Configurações salvas com sucesso!',
          type: 'success'
        });
        // Recarregar configurações
        await fetchConfigs();
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({
        text: error.response?.data?.message || 'Erro ao salvar configurações',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSupabase = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const response = await api.post('/admin/config/test-supabase', {
        supabase_url: editedValues.SUPABASE_URL,
        supabase_service_key: editedValues.SUPABASE_SERVICE_KEY
      });

      if (response.data.success) {
        setMessage({
          text: 'Conexão com Supabase testada com sucesso! ✅',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setMessage({
        text: error.response?.data?.message || 'Falha ao conectar com Supabase',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (config) => {
    const isPassword = config.config_type === 'password';
    const showPassword = showPasswords[config.config_key];
    const value = editedValues[config.config_key] || '';

    return (
      <div key={config.config_key} style={styles.configItem}>
        <label style={styles.label}>
          <strong>{config.config_key}</strong>
          {config.description && (
            <span style={styles.description}>{config.description}</span>
          )}
        </label>

        <div style={styles.inputGroup}>
          <input
            type={isPassword && !showPassword ? 'password' : 'text'}
            value={value}
            onChange={(e) => handleInputChange(config.config_key, e.target.value)}
            placeholder={`Digite ${config.description || config.config_key}`}
            style={styles.input}
            disabled={saving}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => togglePasswordVisibility(config.config_key)}
              style={styles.toggleButton}
              disabled={saving}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={styles.title}>⚙️ Configurações do Sistema</h2>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={styles.backButton}
          >
            ← Voltar ao Dashboard
          </button>
        </div>
        <p style={styles.subtitle}>
          Gerencie credenciais do Supabase e webhooks do n8n
        </p>
      </div>

      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🗄️ Credenciais Supabase</h3>
        {configs
          .filter(c => c.config_key.startsWith('SUPABASE_'))
          .map(renderInput)}

        <button
          onClick={handleTestSupabase}
          disabled={saving || !editedValues.SUPABASE_URL || !editedValues.SUPABASE_SERVICE_KEY}
          style={styles.testButton}
        >
          {saving ? 'Testando...' : 'Testar Conexão Supabase'}
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🔗 Webhooks n8n</h3>
        {configs
          .filter(c => c.config_key.startsWith('N8N_'))
          .map(renderInput)}
      </div>

      <div style={styles.actions}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </button>
      </div>

      <div style={styles.info}>
        <p style={styles.infoText}>
          ℹ️ <strong>Importante:</strong> Após salvar as configurações do Supabase,
          será necessário reiniciar o servidor backend para que as mudanças tenham efeito.
        </p>
        <p style={styles.infoText}>
          🔒 As senhas são armazenadas com segurança e mascaradas quando exibidas.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    marginBottom: '30px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '15px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#333'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0'
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    padding: '50px',
    color: '#666'
  },
  message: {
    padding: '12px 20px',
    borderRadius: '5px',
    marginBottom: '20px',
    fontWeight: '500'
  },
  messageSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  messageError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  section: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e0e0e0'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#444'
  },
  configItem: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#333'
  },
  description: {
    display: 'block',
    fontSize: '13px',
    color: '#666',
    marginTop: '3px',
    fontWeight: 'normal'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'stretch'
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontFamily: 'monospace'
  },
  toggleButton: {
    padding: '10px 15px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s'
  },
  testButton: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  actions: {
    textAlign: 'center',
    marginTop: '30px',
    marginBottom: '20px'
  },
  saveButton: {
    padding: '15px 40px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  },
  info: {
    backgroundColor: '#e7f3ff',
    padding: '15px',
    borderRadius: '5px',
    border: '1px solid #b3d7ff'
  },
  infoText: {
    fontSize: '14px',
    color: '#004085',
    margin: '5px 0'
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  }
};

export default AdminSettings;
