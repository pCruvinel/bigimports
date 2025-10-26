import { useState } from 'react';
import SearchLogsViewer from './SearchLogsViewer';
import ConnectionLogsViewer from './ConnectionLogsViewer';

const LogsSection = () => {
  const [activeLogTab, setActiveLogTab] = useState('searches');

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Visualizador de Logs</h2>

      {/* Sub-tabs para tipos de logs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '2px solid #dee2e6'
      }}>
        <button
          onClick={() => setActiveLogTab('searches')}
          style={{
            ...subTabButtonStyle,
            borderBottom: activeLogTab === 'searches' ? '3px solid #17a2b8' : 'none',
            color: activeLogTab === 'searches' ? '#17a2b8' : '#6c757d'
          }}
        >
          📋 Logs de Pesquisa
        </button>
        <button
          onClick={() => setActiveLogTab('connections')}
          style={{
            ...subTabButtonStyle,
            borderBottom: activeLogTab === 'connections' ? '3px solid #17a2b8' : 'none',
            color: activeLogTab === 'connections' ? '#17a2b8' : '#6c757d'
          }}
        >
          🔌 Logs de Conexão
        </button>
      </div>

      {/* Conteúdo das sub-tabs */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        {activeLogTab === 'searches' && <SearchLogsViewer />}
        {activeLogTab === 'connections' && <ConnectionLogsViewer />}
      </div>
    </div>
  );
};

const subTabButtonStyle = {
  padding: '12px 20px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: '600',
  transition: 'all 0.2s',
  marginBottom: '-2px'
};

export default LogsSection;
