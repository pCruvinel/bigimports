import { useState, useEffect } from 'react';
import api from '../services/api';
import UserForm from './UserForm';
import DeleteConfirmModal from './DeleteConfirmModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  // Carregar usuários
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Abrir formulário para criar novo usuário
  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  // Abrir formulário para editar usuário
  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  // Fechar formulário
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  // Callback quando usuário é salvo
  const handleUserSaved = () => {
    handleCloseForm();
    fetchUsers();
  };

  // Abrir modal de confirmação de exclusão
  const handleDeleteClick = (user) => {
    setDeleteUser(user);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!deleteUser) return;

    try {
      await api.delete(`/admin/users/${deleteUser.id}`);
      setDeleteUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
      alert('Erro ao deletar usuário');
    }
  };

  // Cancelar exclusão
  const handleCancelDelete = () => {
    setDeleteUser(null);
  };

  // Função para obter cor do status da instância
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'var(--success-color)';
      case 'pending_connection':
        return 'var(--primary-color)';
      case 'not_connected':
      case 'disconnected':
        return '#6c757d';
      case 'error':
        return 'var(--danger-color)';
      default:
        return '#6c757d';
    }
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Carregando usuários...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#dc3545' }}>
        {error}
        <button onClick={fetchUsers} style={{ marginLeft: '10px' }}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>Gerenciamento de Usuários</h2>
        <button
          onClick={handleCreate}
          style={{
            padding: '10px 20px',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          + Novo Usuário
        </button>
      </div>

      {users.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          Nenhum usuário cadastrado
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={tableHeaderStyle}>Nome</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>WhatsApp</th>
                <th style={tableHeaderStyle}>Status Instância</th>
                <th style={tableHeaderStyle}>Plano</th>
                <th style={tableHeaderStyle}>Criado em</th>
                <th style={tableHeaderStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={tableCellStyle}>{user.name}</td>
                  <td style={tableCellStyle}>{user.email}</td>
                  <td style={tableCellStyle}>{user.whatsapp_phone || '-'}</td>
                  <td style={tableCellStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white',
                      background: getStatusColor(user.instance_status)
                    }}>
                      {user.instance_status || 'not_connected'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{user.plan || 'free'}</td>
                  <td style={tableCellStyle}>{formatDate(user.created_at)}</td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        padding: '6px 12px',
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px',
                        fontSize: '12px'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulário de criação/edição */}
      {showForm && (
        <UserForm
          user={editingUser}
          onClose={handleCloseForm}
          onSaved={handleUserSaved}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

// Estilos para a tabela
const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '14px',
  color: '#495057'
};

const tableCellStyle = {
  padding: '12px',
  fontSize: '14px',
  color: '#212529'
};

export default UserManagement;
