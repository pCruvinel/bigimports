import { useState, useEffect } from 'react';
import api from '../services/api';

function ProductsByCategoryChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/products-by-category');
      setData(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos por categoria:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>📊 Produtos por Categoria</h3>
        <div style={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>📊 Produtos por Categoria</h3>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📊 Produtos por Categoria</h3>
      <p style={styles.subtitle}>Distribuição de {data.reduce((sum, d) => sum + d.count, 0).toLocaleString()} produtos</p>

      <div style={styles.chartContainer}>
        {data.map((item, index) => (
          <div key={index} style={styles.barWrapper}>
            <div style={styles.labelRow}>
              <span style={styles.categoryLabel}>{item.category}</span>
              <span style={styles.count}>{item.count.toLocaleString()} ({item.percentage}%)</span>
            </div>
            <div style={styles.barBackground}>
              <div
                style={{
                  ...styles.bar,
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: getColor(index)
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const getColor = (index) => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
    '#06b6d4', '#a855f7', '#eab308'
  ];
  return colors[index % colors.length];
};

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
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  barWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px'
  },
  categoryLabel: {
    fontWeight: '500',
    color: '#374151'
  },
  count: {
    color: '#6b7280',
    fontSize: '13px'
  },
  barBackground: {
    width: '100%',
    height: '24px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  bar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  }
};

export default ProductsByCategoryChart;
