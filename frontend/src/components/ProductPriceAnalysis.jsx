import { useState, useEffect } from 'react';
import api from '../services/api';

function ProductPriceAnalysis() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchProducts();
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const searchProducts = async () => {
    try {
      const response = await api.get(`/admin/analytics/products-search?search=${searchTerm}`);
      setSuggestions(response.data.data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  const selectProduct = async (productName) => {
    setSelectedProduct(productName);
    setSearchTerm('');
    setSuggestions([]);
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/admin/analytics/product-price-details?product_name=${encodeURIComponent(productName)}`);
      setProductDetails(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError('Erro ao carregar análise do produto');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setProductDetails(null);
    setError(null);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🔍 Análise de Preço por Produto</h3>
      <p style={styles.subtitle}>Busque um produto para ver análise detalhada de preços e fornecedores</p>

      {/* Busca */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite o nome do produto (ex: iPhone 13, Galaxy S22)..."
          style={styles.searchInput}
        />

        {suggestions.length > 0 && (
          <div style={styles.suggestions}>
            {suggestions.map((product, index) => (
              <div
                key={index}
                style={styles.suggestionItem}
                onClick={() => selectProduct(product)}
              >
                {product}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Produto Selecionado */}
      {selectedProduct && (
        <div style={styles.selectedProduct}>
          <span style={styles.selectedProductText}>📦 {selectedProduct}</span>
          <button onClick={clearSelection} style={styles.clearButton}>✕ Limpar</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={styles.loading}>Carregando análise...</div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {/* Detalhes do Produto */}
      {productDetails && !loading && (
        <>
          {/* Estatísticas Gerais */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Registros</div>
              <div style={styles.statValue}>{productDetails.statistics.total_entries}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Preço Médio</div>
              <div style={{...styles.statValue, color: '#10b981'}}>
                R$ {productDetails.statistics.avg_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Mínimo</div>
              <div style={{...styles.statValue, color: '#3b82f6'}}>
                R$ {productDetails.statistics.min_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Máximo</div>
              <div style={{...styles.statValue, color: '#ef4444'}}>
                R$ {productDetails.statistics.max_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Mediana</div>
              <div style={styles.statValue}>
                R$ {productDetails.statistics.median_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Variação</div>
              <div style={{...styles.statValue, color: productDetails.statistics.variation > 50 ? '#ef4444' : '#f59e0b'}}>
                {productDetails.statistics.variation}%
              </div>
            </div>
          </div>

          {/* Preços por Fornecedor */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>🏪 Preços por Fornecedor</h4>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{...styles.th, width: '40px'}}>#</th>
                    <th style={styles.th}>Fornecedor</th>
                    <th style={{...styles.th, textAlign: 'center'}}>WhatsApp</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Preço Médio</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Mín</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Máx</th>
                    <th style={{...styles.th, textAlign: 'center'}}>Ofertas</th>
                  </tr>
                </thead>
                <tbody>
                  {productDetails.by_supplier.map((supplier, index) => {
                    const whatsappNumber = supplier.telefone ? String(supplier.telefone).replace(/\D/g, '') : null;
                    const isLowestPrice = index === 0;

                    return (
                      <tr key={index} style={{...styles.tr, backgroundColor: isLowestPrice ? '#f0fdf4' : 'transparent'}}>
                        <td style={{...styles.td, textAlign: 'center', fontWeight: 'bold'}}>
                          {isLowestPrice && <span style={{color: '#10b981'}}>👑</span>}
                          {!isLowestPrice && index + 1}
                        </td>
                        <td style={styles.td}>
                          <strong>{supplier.supplier_name}</strong>
                          {isLowestPrice && <span style={{marginLeft: '8px', color: '#10b981', fontSize: '12px'}}>Melhor Preço</span>}
                        </td>
                        <td style={{...styles.td, textAlign: 'center'}}>
                          {whatsappNumber ? (
                            <a
                              href={`https://wa.me/${whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.whatsappButton}
                            >
                              💬 Contatar
                            </a>
                          ) : (
                            <span style={{color: '#9ca3af'}}>-</span>
                          )}
                        </td>
                        <td style={{...styles.td, textAlign: 'right', fontWeight: '600', color: '#059669'}}>
                          R$ {parseFloat(supplier.avg_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                          R$ {parseFloat(supplier.min_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                          R$ {parseFloat(supplier.max_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{...styles.td, textAlign: 'center'}}>
                          <span style={styles.badge}>{supplier.count}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline de Preços */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>📈 Evolução de Preços</h4>
            <div style={styles.timelineContainer}>
              {productDetails.timeline.slice(-30).map((item, index) => {
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                const maxPrice = Math.max(...productDetails.timeline.map(t => parseFloat(t.max_price)));

                return (
                  <div key={index} style={styles.timelineBar}>
                    <div style={styles.barColumn}>
                      <div
                        style={{
                          ...styles.priceBar,
                          height: `${(parseFloat(item.avg_price) / maxPrice) * 100}px`,
                          backgroundColor: '#10b981'
                        }}
                        title={`${formattedDate}: R$ ${item.avg_price} (média)`}
                      >
                        <span style={styles.priceLabel}>R$ {item.avg_price}</span>
                      </div>
                    </div>
                    <div style={styles.dateLabel}>{formattedDate}</div>
                    <div style={styles.countLabel}>{item.count}x</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Estado Inicial */}
      {!selectedProduct && !loading && (
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>🔍</div>
          <div style={styles.placeholderText}>
            Digite o nome de um produto acima para ver a análise detalhada de preços
          </div>
        </div>
      )}
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
  searchContainer: {
    position: 'relative',
    marginBottom: '20px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  suggestionItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s'
  },
  selectedProduct: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  selectedProductText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af'
  },
  clearButton: {
    padding: '6px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#374151'
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
  whatsappButton: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid #86efac'
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
  timelineContainer: {
    display: 'flex',
    gap: '6px',
    alignItems: 'flex-end',
    overflowX: 'auto',
    paddingBottom: '10px',
    minHeight: '150px'
  },
  timelineBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    minWidth: '50px'
  },
  barColumn: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '120px'
  },
  priceBar: {
    width: '40px',
    borderRadius: '4px 4px 0 0',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '4px'
  },
  priceLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  dateLabel: {
    fontSize: '11px',
    color: '#6b7280'
  },
  countLabel: {
    fontSize: '10px',
    color: '#9ca3af'
  },
  placeholder: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9ca3af'
  },
  placeholderIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  placeholderText: {
    fontSize: '16px'
  }
};

export default ProductPriceAnalysis;
