const DeleteConfirmModal = ({ user, onConfirm, onCancel }) => {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ margin: 0, color: '#dc3545' }}>Confirmar Exclusão</h2>
        </div>

        <div style={modalBodyStyle}>
          <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
            Tem certeza que deseja excluir o usuário abaixo?
          </p>

          <div style={userInfoStyle}>
            <p style={{ margin: '5px 0' }}>
              <strong>Nome:</strong> {user.name}
            </p>
            <p style={{ margin: '5px 0' }}>
              <strong>Email:</strong> {user.email}
            </p>
            {user.whatsapp_phone && (
              <p style={{ margin: '5px 0' }}>
                <strong>WhatsApp:</strong> {user.whatsapp_phone}
              </p>
            )}
          </div>

          <div style={warningStyle}>
            ⚠️ Esta ação não pode ser desfeita. Todos os dados relacionados ao usuário serão permanentemente removidos.
          </div>
        </div>

        <div style={modalFooterStyle}>
          <button
            onClick={onCancel}
            style={cancelButtonStyle}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={deleteButtonStyle}
          >
            Excluir Usuário
          </button>
        </div>
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
  maxWidth: '500px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
};

const modalHeaderStyle = {
  padding: '20px',
  borderBottom: '1px solid #dee2e6'
};

const modalBodyStyle = {
  padding: '20px'
};

const userInfoStyle = {
  background: '#f8f9fa',
  padding: '15px',
  borderRadius: '4px',
  marginBottom: '15px',
  fontSize: '14px'
};

const warningStyle = {
  padding: '12px',
  background: '#fff3cd',
  color: '#856404',
  borderRadius: '4px',
  fontSize: '14px',
  border: '1px solid #ffeaa7'
};

const modalFooterStyle = {
  padding: '20px',
  borderTop: '1px solid #dee2e6',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px'
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

const deleteButtonStyle = {
  padding: '10px 20px',
  background: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600'
};

export default DeleteConfirmModal;
