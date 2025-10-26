import { useState, useEffect } from 'react';
import api from '../services/api';

function ProductsTimelineChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/products-timeline?days=${days}`);
      setData(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar timeline:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>📈 Produtos Adicionados por Dia</h3>
        <div style={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>📈 Produtos Adicionados por Dia</h3>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const totalProducts = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerDay = (totalProducts / data.length).toFixed(0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>📈 Produtos Adicionados por Dia</h3>
          <p style={styles.subtitle}>
            {totalProducts.toLocaleString()} produtos · Média: {avgPerDay}/dia
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={styles.select}
        >
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="60">Últimos 60 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="180">Últimos 6 meses</option>
          <option value="365">Último ano</option>
          <option value="730">Últimos 2 anos</option>
          <option value="0">Todo o período</option>
        </select>
      </div>

      <div style={styles.chartContainer}>
        {data.map((item, index) => {
          const date = new Date(item.date);
          const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
          });

          return (
            <div key={index} style={styles.barWrapper}>
              <div style={styles.barColumn}>
                <div
                  style={{
                    ...styles.bar,
                    height: `${(item.count / maxCount) * 120}px`,
                    backgroundColor: item.count > avgPerDay ? '#10b981' : '#3b82f6'
                  }}
                  title={`${formattedDate}: ${item.count} produtos`}
                >
                  <span style={styles.barLabel}>{item.count}</span>
                </div>
              </div>
              <div style={styles.dateLabel}>{formattedDate}</div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div style={styles.noData}>
          <p>📅 Nenhum produto encontrado neste período</p>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#9ca3af' }}>
            Tente selecionar um intervalo maior ou verifique se há produtos cadastrados no sistema
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px'
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
    margin: 0
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
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
    gap: '8px',
    alignItems: 'flex-end',
    overflowX: 'auto',
    paddingBottom: '10px',
    minHeight: '180px'
  },
  barWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    minWidth: '40px'
  },
  barColumn: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '140px'
  },
  bar: {
    width: '32px',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '4px'
  },
  barLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  dateLabel: {
    fontSize: '11px',
    color: '#6b7280',
    transform: 'rotate(-45deg)',
    transformOrigin: 'top left',
    whiteSpace: 'nowrap',
    marginLeft: '10px'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
    fontSize: '14px'
  }
};

export default ProductsTimelineChart;
