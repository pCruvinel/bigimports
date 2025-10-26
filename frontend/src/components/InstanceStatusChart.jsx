import { useState, useEffect } from 'react';
import api from '../services/api';

const InstanceStatusChart = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/dashboard/kpis');
      setData(response.data.instanceStatusDistribution || {});
    } catch (err) {
      console.error('Erro ao carregar status das instâncias:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Carregando gráfico...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#dc3545', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  // Preparar dados para o gráfico
  const statusConfig = {
    connected: { label: 'Conectadas', color: '#28a745' },
    pending_connection: { label: 'Aguardando Conexão', color: '#ffc107' },
    not_connected: { label: 'Não Conectadas', color: '#6c757d' },
    disconnected: { label: 'Desconectadas', color: '#17a2b8' },
    error: { label: 'Com Erro', color: '#dc3545' }
  };

  const statusData = Object.entries(data)
    .map(([status, count]) => ({
      status,
      count,
      label: statusConfig[status]?.label || status,
      color: statusConfig[status]?.color || '#6c757d'
    }))
    .filter(item => item.count > 0);

  const total = statusData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Status das Instâncias</h3>

      {total === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          Nenhuma instância registrada
        </div>
      ) : (
        <div style={containerStyle}>
          {/* Gráfico de pizza (simulado com flexbox e cores) */}
          <div style={pieChartContainerStyle}>
            <div style={pieChartStyle}>
              {statusData.map((item, index) => {
                const percentage = (item.count / total) * 100;

                return (
                  <div
                    key={index}
                    style={{
                      ...pieSliceStyle,
                      background: item.color,
                      flex: item.count
                    }}
                    title={`${item.label}: ${item.count} (${percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          <div style={legendContainerStyle}>
            {statusData.map((item, index) => {
              const percentage = (item.count / total) * 100;

              return (
                <div key={index} style={legendItemStyle}>
                  <div
                    style={{
                      ...legendColorBoxStyle,
                      background: item.color
                    }}
                  />
                  <div style={legendTextStyle}>
                    <div style={legendLabelStyle}>{item.label}</div>
                    <div style={legendValueStyle}>
                      {item.count} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos
const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px',
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '8px'
};

const pieChartContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const pieChartStyle = {
  display: 'flex',
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const pieSliceStyle = {
  minWidth: '10px'
};

const legendContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const legendItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'white',
  padding: '10px',
  borderRadius: '6px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const legendColorBoxStyle = {
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  flexShrink: 0
};

const legendTextStyle = {
  flex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const legendLabelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#212529'
};

const legendValueStyle = {
  fontSize: '14px',
  color: '#6c757d',
  fontWeight: '500'
};

export default InstanceStatusChart;
