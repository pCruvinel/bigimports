import { useState, useEffect } from 'react';
import api from '../services/api';

const UserForm = ({ user, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp_phone: '',
    plan: 'free',
    max_searches_per_day: 100,
    role_name: 'user', // Mudado de role_id para role_name
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preencher formulário se for edição
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Senha vazia para edição
        whatsapp_phone: user.whatsapp_phone || '',
        plan: user.plan || 'free',
        max_searches_per_day: user.max_searches_per_day || 100,
        role_name: user.role_name || 'user', // Usar role_name ao invés de role_id
        role_id: user.role_id, // Manter role_id para edição
        status: user.status || 'active'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (!formData.name || !formData.email || !formData.whatsapp_phone) {
        setError('Nome, email e telefone WhatsApp são obrigatórios');
        setLoading(false);
        return;
      }

      if (!user && !formData.password) {
        setError('Senha é obrigatória para criar novo usuário');
        setLoading(false);
        return;
      }

      // Preparar dados para envio
      const dataToSend = { ...formData };

      // Se for edição e senha estiver vazia, remover do payload
      if (user && !formData.password) {
        delete dataToSend.password;
      }

      // Criar ou atualizar
      if (user) {
        await api.put(`/admin/users/${user.id}`, dataToSend);
      } else {
        await api.post('/admin/users', dataToSend);
      }

      onSaved();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.response?.data?.error?.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ margin: 0 }}>{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Nome *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Senha {user ? '(deixe em branco para não alterar)' : '*'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              required={!user}
              disabled={loading}
              placeholder={user ? 'Digite nova senha se desejar alterar' : ''}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Telefone WhatsApp *
            </label>
            <input
              type="text"
              name="whatsapp_phone"
              value={formData.whatsapp_phone}
              onChange={handleChange}
              style={inputStyle}
              required
              disabled={loading}
              placeholder="5511999999999"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>
                Plano
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                style={inputStyle}
                disabled={loading}
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>
                Pesquisas/Dia
              </label>
              <input
                type="number"
                name="max_searches_per_day"
                value={formData.max_searches_per_day}
                onChange={handleChange}
                style={inputStyle}
                min="1"
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>
                Role
              </label>
              <select
                name="role_name"
                value={formData.role_name}
                onChange={handleChange}
                style={inputStyle}
                disabled={loading}
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={inputStyle}
                disabled={loading}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={cancelButtonStyle}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={submitButtonStyle}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (user ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Estilos
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  background: 'white',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  borderBottom: '1px solid #dee2e6'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#6c757d',
  padding: '0',
  width: '30px',
  height: '30px'
};

const formStyle = {
  padding: '20px'
};

const formGroupStyle = {
  marginBottom: '15px'
};

const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: '600',
  fontSize: '14px',
  color: '#495057'
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ced4da',
  borderRadius: '4px',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const errorStyle = {
  padding: '12px',
  background: '#f8d7da',
  color: '#721c24',
  borderRadius: '4px',
  marginBottom: '15px',
  fontSize: '14px'
};

const cancelButtonStyle = {
  padding: '10px 20px',
  background: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600'
};

const submitButtonStyle = {
  padding: '10px 20px',
  background: 'var(--primary-color)',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'all 0.2s'
};

export default UserForm;
