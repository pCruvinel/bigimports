import { useState, useEffect } from 'react';
import api from '../services/api';

function PriceAnalysisByCategory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/price-analysis-by-category');
      setData(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar análise de preços:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>💰 Análise de Preços por Categoria</h3>
        <div style={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>💰 Análise de Preços por Categoria</h3>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>💰 Análise de Preços por Categoria</h3>
      <p style={styles.subtitle}>Estatísticas de preços médios, mínimos e máximos</p>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Categoria</th>
              <th style={{...styles.th, textAlign: 'center'}}>Produtos</th>
              <th style={{...styles.th, textAlign: 'right'}}>Preço Médio</th>
              <th style={{...styles.th, textAlign: 'right'}}>Mediana</th>
              <th style={{...styles.th, textAlign: 'right'}}>Mínimo</th>
              <th style={{...styles.th, textAlign: 'right'}}>Máximo</th>
              <th style={{...styles.th, textAlign: 'center'}}>Variação</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const variation = ((item.max_price - item.min_price) / item.min_price * 100).toFixed(0);

              return (
                <tr key={index} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{item.category}</strong>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={styles.badge}>{item.product_count.toLocaleString()}</span>
                  </td>
                  <td style={{...styles.td, textAlign: 'right', fontWeight: '600', color: '#059669'}}>
                    R$ {item.avg_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{...styles.td, textAlign: 'right'}}>
                    R$ {item.median_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{...styles.td, textAlign: 'right', color: '#3b82f6'}}>
                    R$ {item.min_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{...styles.td, textAlign: 'right', color: '#ef4444'}}>
                    R$ {item.max_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      ...styles.variationBadge,
                      backgroundColor: variation > 100 ? '#fee2e2' : '#dbeafe',
                      color: variation > 100 ? '#991b1b' : '#1e40af'
                    }}>
                      {variation}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div style={styles.noData}>Nenhum dado de preço disponível</div>
      )}

      <div style={styles.footer}>
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <span style={{...styles.legendDot, backgroundColor: '#3b82f6'}} />
            <span style={styles.legendText}>Mínimo</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{...styles.legendDot, backgroundColor: '#059669'}} />
            <span style={styles.legendText}>Médio</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{...styles.legendDot, backgroundColor: '#ef4444'}} />
            <span style={styles.legendText}>Máximo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#333'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#ef4444'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#f9fafb'
  },
  tr: {
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f3f4f6',
    color: '#1f2937'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600'
  },
  variationBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
    fontSize: '14px'
  },
  footer: {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #e5e7eb'
  },
  legend: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  legendText: {
    fontSize: '13px',
    color: '#6b7280'
  }
};

export default PriceAnalysisByCategory;
