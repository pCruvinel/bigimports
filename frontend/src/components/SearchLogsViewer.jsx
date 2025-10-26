import { useState, useEffect } from 'react';
import api from '../services/api';

const SearchLogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filtros
  const [filters, setFilters] = useState({
    user_phone: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir query params
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });

      if (filters.user_phone) params.append('user_phone', filters.user_phone);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await api.get(`/admin/logs/searches?${params}`);
      setLogs(response.data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (err) {
      console.error('Erro ao carregar logs de pesquisa:', err);
      setError('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      user_phone: '',
      start_date: '',
      end_date: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(fetchLogs, 0);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Logs de Pesquisa</h2>

      {/* Filtros */}
      <div style={filtersContainerStyle}>
        <div style={filterGroupStyle}>
          <label style={labelStyle}>Telefone do Usuário</label>
          <input
            type="text"
            name="user_phone"
            value={filters.user_phone}
            onChange={handleFilterChange}
            style={inputStyle}
            placeholder="5511999999999"
          />
        </div>

        <div style={filterGroupStyle}>
          <label style={labelStyle}>Data Inicial</label>
          <input
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleFilterChange}
            style={inputStyle}
          />
        </div>

        <div style={filterGroupStyle}>
          <label style={labelStyle}>Data Final</label>
          <input
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleFilterChange}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <button onClick={handleApplyFilters} style={primaryButtonStyle}>
            Aplicar Filtros
          </button>
          <button onClick={handleClearFilters} style={secondaryButtonStyle}>
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela de Logs */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          Carregando logs...
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
          {error}
          <br />
          <button onClick={fetchLogs} style={{ marginTop: '10px' }}>
            Tentar novamente
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
          Nenhum log encontrado
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={tableHeaderStyle}>Data/Hora</th>
                  <th style={tableHeaderStyle}>Telefone</th>
                  <th style={tableHeaderStyle}>Instância</th>
                  <th style={tableHeaderStyle}>Query Original</th>
                  <th style={tableHeaderStyle}>Query Normalizada</th>
                  <th style={tableHeaderStyle}>Resultados</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={tableCellStyle}>{formatDate(log.search_timestamp)}</td>
                    <td style={tableCellStyle}>{log.user_phone || '-'}</td>
                    <td style={tableCellStyle}>{log.instance_id || '-'}</td>
                    <td style={tableCellStyle}>{log.original_query || '-'}</td>
                    <td style={tableCellStyle}>{log.normalized_query || '-'}</td>
                    <td style={tableCellStyle}>{log.results_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div style={paginationContainerStyle}>
            <div style={{ color: '#6c757d', fontSize: '14px' }}>
              Mostrando {logs.length} de {pagination.total} registros
            </div>
            <div style={paginationButtonsStyle}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={paginationButtonStyle}
              >
                ← Anterior
              </button>
              <span style={{ padding: '0 15px', fontSize: '14px' }}>
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={paginationButtonStyle}
              >
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Estilos
const filtersContainerStyle = {
  display: 'flex',
  gap: '15px',
  marginBottom: '20px',
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '8px',
  flexWrap: 'wrap'
};

const filterGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: '200px'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '5px',
  color: '#495057'
};

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #ced4da',
  borderRadius: '4px',
  fontSize: '14px'
};

const primaryButtonStyle = {
  padding: '8px 16px',
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600'
};

const secondaryButtonStyle = {
  padding: '8px 16px',
  background: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  background: 'white',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

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

const paginationContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '20px',
  padding: '15px',
  background: '#f8f9fa',
  borderRadius: '8px'
};

const paginationButtonsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const paginationButtonStyle = {
  padding: '8px 16px',
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600'
};

export default SearchLogsViewer;
