import { useState, useEffect } from 'react';
import api from '../services/api';

const TopProductsChart = () => {
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
      const response = await api.get('/admin/dashboard/top-products');
      setData(response.data.topProducts || []);
    } catch (err) {
      console.error('Erro ao carregar top produtos:', err);
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
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.count), 1) : 1;

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Top 10 Produtos Mais Buscados</h3>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          Nenhuma pesquisa registrada ainda
        </div>
      ) : (
        <div style={listContainerStyle}>
          {data.map((item, index) => {
            const barWidth = (item.count / maxValue) * 100;

            return (
              <div key={index} style={itemContainerStyle}>
                <div style={itemRankStyle}>
                  #{index + 1}
                </div>
                <div style={itemContentStyle}>
                  <div style={itemHeaderStyle}>
                    <span style={itemNameStyle}>{item.query}</span>
                    <span style={itemCountStyle}>{item.count} buscas</span>
                  </div>
                  <div style={itemBarContainerStyle}>
                    <div
                      style={{
                        ...itemBarStyle,
                        width: `${barWidth}%`,
                        background: getColorByRank(index)
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Função para obter cor baseada no ranking
const getColorByRank = (index) => {
  const colors = [
    '#ffc107', // Ouro
    '#c0c0c0', // Prata
    '#cd7f32', // Bronze
    '#007bff',
    '#007bff',
    '#17a2b8',
    '#17a2b8',
    '#6c757d',
    '#6c757d',
    '#6c757d'
  ];
  return colors[index] || '#6c757d';
};

// Estilos
const listContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '8px'
};

const itemContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  background: 'white',
  padding: '12px',
  borderRadius: '6px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const itemRankStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#495057',
  minWidth: '35px',
  textAlign: 'center'
};

const itemContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const itemHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const itemNameStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#212529'
};

const itemCountStyle = {
  fontSize: '12px',
  color: '#6c757d',
  fontWeight: '500'
};

const itemBarContainerStyle = {
  width: '100%',
  height: '8px',
  background: '#e9ecef',
  borderRadius: '4px',
  overflow: 'hidden'
};

const itemBarStyle = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s ease'
};

export default TopProductsChart;
