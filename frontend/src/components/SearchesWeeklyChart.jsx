import { useState, useEffect } from 'react';
import api from '../services/api';

const SearchesWeeklyChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/dashboard/searches-weekly');
      setData(response.data.weeklySearches || []);
    } catch (err) {
      console.error('Erro ao carregar pesquisas semanais:', err);
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

  // Encontrar o valor máximo para escalar as barras
  const maxValue = Math.max(...data.map(d => d.count), 1);

  // Formatar data para exibição
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Pesquisas nos Últimos 7 Dias</h3>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          Nenhuma pesquisa registrada nos últimos 7 dias
        </div>
      ) : (
        <div style={chartContainerStyle}>
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.count / maxValue) * 100 : 0;

            return (
              <div key={index} style={barContainerStyle}>
                <div style={barWrapperStyle}>
                  <div
                    style={{
                      ...barStyle,
                      height: `${barHeight}%`,
                      background: item.count > 0 ? '#007bff' : '#e9ecef'
                    }}
                  >
                    {item.count > 0 && (
                      <span style={barValueStyle}>{item.count}</span>
                    )}
                  </div>
                </div>
                <div style={barLabelStyle}>
                  {formatDate(item.date)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Estilos
const chartContainerStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '15px',
  height: '250px',
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '8px'
};

const barContainerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px'
};

const barWrapperStyle = {
  width: '100%',
  height: '200px',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center'
};

const barStyle = {
  width: '100%',
  minHeight: '5px',
  borderRadius: '4px 4px 0 0',
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '5px',
  transition: 'height 0.3s ease'
};

const barValueStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: 'white'
};

const barLabelStyle = {
  fontSize: '12px',
  color: '#6c757d',
  fontWeight: '500',
  textAlign: 'center'
};

export default SearchesWeeklyChart;
