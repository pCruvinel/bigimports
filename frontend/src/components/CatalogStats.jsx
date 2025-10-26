import { useState, useEffect } from 'react';
import api from '../services/api';

function CatalogStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/catalog-stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas do catálogo:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Carregando estatísticas...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error || 'Dados não disponíveis'}</div>
      </div>
    );
  }

  const statCards = [
    {
      icon: '📦',
      label: 'Total de Produtos',
      value: stats.total_products.toLocaleString(),
      color: '#3b82f6',
      bg: '#eff6ff'
    },
    {
      icon: '💵',
      label: 'Produtos com Preço',
      value: stats.products_with_price.toLocaleString(),
      subtitle: `${stats.price_coverage}% do catálogo`,
      color: '#10b981',
      bg: '#f0fdf4'
    },
    {
      icon: '🏪',
      label: 'Fornecedores Únicos',
      value: stats.unique_suppliers.toLocaleString(),
      color: '#f59e0b',
      bg: '#fffbeb'
    },
    {
      icon: '📂',
      label: 'Categorias',
      value: stats.unique_categories.toLocaleString(),
      color: '#8b5cf6',
      bg: '#f5f3ff'
    },
    {
      icon: '💰',
      label: 'Preço Médio',
      value: `R$ ${stats.avg_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: '#ec4899',
      bg: '#fdf2f8'
    },
    {
      icon: '📊',
      label: 'Cobertura de Preços',
      value: `${stats.price_coverage}%`,
      subtitle: `${stats.products_with_price.toLocaleString()} / ${stats.total_products.toLocaleString()}`,
      color: '#06b6d4',
      bg: '#ecfeff'
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📊 Estatísticas do Catálogo</h3>
        <button onClick={fetchStats} style={styles.refreshButton}>
          🔄 Atualizar
        </button>
      </div>

      <div style={styles.grid}>
        {statCards.map((card, index) => (
          <div key={index} style={{...styles.card, backgroundColor: card.bg}}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>{card.icon}</span>
              <span style={styles.cardLabel}>{card.label}</span>
            </div>
            <div style={{...styles.cardValue, color: card.color}}>
              {card.value}
            </div>
            {card.subtitle && (
              <div style={styles.cardSubtitle}>{card.subtitle}</div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.infoPanel}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>📈 Taxa de Produtos com Preço:</span>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${stats.price_coverage}%`,
                backgroundColor: stats.price_coverage > 75 ? '#10b981' : stats.price_coverage > 50 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
          <span style={styles.progressValue}>{stats.price_coverage}%</span>
        </div>

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>🏪 Média de Produtos por Fornecedor:</span>
          <span style={styles.infoValue}>
            {(stats.total_products / stats.unique_suppliers).toFixed(0)} produtos
          </span>
        </div>

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>📂 Média de Produtos por Categoria:</span>
          <span style={styles.infoValue}>
            {(stats.total_products / stats.unique_categories).toFixed(0)} produtos
          </span>
        </div>
      </div>
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
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '25px'
  },
  card: {
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(0,0,0,0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px'
  },
  cardIcon: {
    fontSize: '24px'
  },
  cardLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500'
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  cardSubtitle: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  infoPanel: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  infoLabel: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
    minWidth: '250px'
  },
  infoValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600'
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '4px'
  },
  progressValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    minWidth: '50px',
    textAlign: 'right'
  }
};

export default CatalogStats;
