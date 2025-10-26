import { useState, useEffect } from 'react';
import api from '../services/api';

function TopSuppliersTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchData();
  }, [limit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/top-suppliers?limit=${limit}`);
      setData(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar top fornecedores:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🏆 Top Fornecedores</h3>
        <div style={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🏆 Top Fornecedores</h3>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>🏆 Top Fornecedores</h3>
          <p style={styles.subtitle}>Fornecedores com mais produtos catalogados</p>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
          style={styles.select}
        >
          <option value="5">Top 5</option>
          <option value="10">Top 10</option>
          <option value="20">Top 20</option>
          <option value="50">Top 50</option>
        </select>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th, textAlign: 'center', width: '60px'}}>#</th>
              <th style={styles.th}>Fornecedor</th>
              <th style={{...styles.th, textAlign: 'center', width: '150px'}}>WhatsApp</th>
              <th style={{...styles.th, textAlign: 'right'}}>Produtos</th>
              <th style={{...styles.th, textAlign: 'right', width: '150px'}}>Participação</th>
            </tr>
          </thead>
          <tbody>
            {data.map((supplier, index) => {
              const totalProducts = data.reduce((sum, s) => sum + s.product_count, 0);
              const percentage = ((supplier.product_count / totalProducts) * 100).toFixed(1);
              const whatsappNumber = supplier.telefone ? String(supplier.telefone).replace(/\D/g, '') : null;

              return (
                <tr key={index} style={styles.tr}>
                  <td style={{...styles.td, textAlign: 'center', fontWeight: 'bold', color: index < 3 ? '#f59e0b' : '#6b7280'}}>
                    {index + 1}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.supplierName}>
                      {supplier.supplier_name}
                    </div>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    {whatsappNumber ? (
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.whatsappLink}
                        title={`Conversar com ${supplier.supplier_name}`}
                      >
                        <span style={styles.whatsappIcon}>💬</span>
                        {whatsappNumber.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}
                      </a>
                    ) : (
                      <span style={styles.noPhone}>-</span>
                    )}
                  </td>
                  <td style={{...styles.td, textAlign: 'right', fontWeight: '600'}}>
                    {supplier.product_count.toLocaleString()}
                  </td>
                  <td style={{...styles.td, textAlign: 'right'}}>
                    <div style={styles.percentageBar}>
                      <div
                        style={{
                          ...styles.percentageFill,
                          width: `${percentage}%`,
                          backgroundColor: index < 3 ? '#3b82f6' : '#10b981'
                        }}
                      />
                      <span style={styles.percentageText}>{percentage}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div style={styles.noData}>Nenhum fornecedor encontrado</div>
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
    marginBottom: '20px'
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
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
    backgroundColor: '#f9fafb'
  },
  tr: {
    transition: 'background-color 0.2s',
    cursor: 'default'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#1f2937'
  },
  supplierName: {
    fontWeight: '500',
    color: '#111827'
  },
  percentageBar: {
    position: 'relative',
    width: '100%',
    height: '24px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  percentageFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '4px'
  },
  percentageText: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
    fontSize: '14px'
  },
  whatsappLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
    border: '1px solid #86efac'
  },
  whatsappIcon: {
    fontSize: '16px'
  },
  noPhone: {
    color: '#9ca3af',
    fontSize: '14px'
  }
};

export default TopSuppliersTable;
