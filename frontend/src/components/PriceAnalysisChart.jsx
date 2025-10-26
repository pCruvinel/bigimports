import { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/PriceAnalysisChart.css';

const PriceAnalysisChart = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [days, setDays] = useState(30);
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartReady, setChartReady] = useState(false);

  // Carregar lista de produtos ao montar componente
  useEffect(() => {
    fetchProducts();
  }, []);

  // Carregar dados de preço quando produto for selecionado
  useEffect(() => {
    if (selectedProduct) {
      fetchPriceAnalysis();
    }
  }, [selectedProduct, days]);

  const fetchProducts = async () => {
    try {
      console.log('Buscando produtos...');
      const response = await api.get('/admin/dashboard/products-list');
      console.log('Resposta produtos:', response.data);
      setProducts(response.data.products || []);

      // Selecionar primeiro produto automaticamente
      if (response.data.products && response.data.products.length > 0) {
        setSelectedProduct(response.data.products[0].name);
        console.log('Produto selecionado:', response.data.products[0].name);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      console.error('Detalhes do erro:', err.response?.data);
      setError('Erro ao carregar lista de produtos');
    }
  };

  const fetchPriceAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setChartReady(false);

      console.log('Buscando análise de preços para:', selectedProduct, 'período:', days);
      const response = await api.get('/admin/dashboard/price-analysis', {
        params: { product: selectedProduct, days }
      });

      console.log('Resposta análise:', response.data);
      setPriceData(response.data.data || []);

      // Pequeno delay para animação
      setTimeout(() => setChartReady(true), 100);
    } catch (err) {
      console.error('Erro ao carregar análise de preços:', err);
      console.error('Detalhes do erro:', err.response?.data);
      setError('Erro ao carregar dados de preço');
      setPriceData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatPrice = (price) => {
    return `R$ ${price.toFixed(2)}`;
  };

  // Calcular valores para o gráfico
  const getChartDimensions = () => {
    if (priceData.length === 0) return { maxPrice: 0, minPrice: 0, range: 0 };

    const allPrices = priceData.flatMap(d => [d.avgPrice, d.minPrice, d.maxPrice]);
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const range = maxPrice - minPrice;

    return { maxPrice: maxPrice + (range * 0.1), minPrice: Math.max(0, minPrice - (range * 0.1)), range };
  };

  const calculateY = (value) => {
    const { maxPrice, minPrice } = getChartDimensions();
    const range = maxPrice - minPrice;
    if (range === 0) return 50;
    return 100 - ((value - minPrice) / range * 100);
  };

  const getAveragePriceTrend = () => {
    if (priceData.length < 2) return 0;
    const firstAvg = priceData[0].avgPrice;
    const lastAvg = priceData[priceData.length - 1].avgPrice;
    return ((lastAvg - firstAvg) / firstAvg * 100).toFixed(1);
  };

  return (
    <div className="price-analysis-card">
      <div className="card-header">
        <h3>Análise Temporal de Preços</h3>
        <div className="controls">
          <div className="control-group">
            <label>Produto:</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={loading || products.length === 0}
            >
              {products.length === 0 && <option value="">Carregando...</option>}
              {products.map((product) => (
                <option key={product.name} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>Período:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              disabled={loading}
            >
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="chart-loading">
          <div className="spinner"></div>
          <p>Carregando dados...</p>
        </div>
      )}

      {error && !loading && (
        <div className="chart-error">
          <p>{error}</p>
          <button onClick={fetchPriceAnalysis}>Tentar novamente</button>
        </div>
      )}

      {!loading && !error && priceData.length === 0 && (
        <div className="chart-empty">
          <p>Nenhum dado de preço disponível para este produto</p>
        </div>
      )}

      {!loading && !error && priceData.length > 0 && (
        <>
          <div className="price-stats">
            <div className="stat-item">
              <span className="stat-label">Preço Médio Atual</span>
              <span className="stat-value avg">
                {formatPrice(priceData[priceData.length - 1]?.avgPrice || 0)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Menor Preço</span>
              <span className="stat-value min">
                {formatPrice(Math.min(...priceData.map(d => d.minPrice)))}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Maior Preço</span>
              <span className="stat-value max">
                {formatPrice(Math.max(...priceData.map(d => d.maxPrice)))}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tendência</span>
              <span className={`stat-value trend ${getAveragePriceTrend() >= 0 ? 'up' : 'down'}`}>
                {getAveragePriceTrend() >= 0 ? '↑' : '↓'} {Math.abs(getAveragePriceTrend())}%
              </span>
            </div>
          </div>

          <div className="chart-container">
            <svg className={`price-chart ${chartReady ? 'ready' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Área de preço máximo */}
              <polygon
                className="area-max"
                points={priceData.map((d, i) => {
                  const x = (i / (priceData.length - 1)) * 100;
                  const y = calculateY(d.maxPrice);
                  return `${x},${y}`;
                }).join(' ') + ` 100,100 0,100`}
              />

              {/* Área de preço médio */}
              <polygon
                className="area-avg"
                points={priceData.map((d, i) => {
                  const x = (i / (priceData.length - 1)) * 100;
                  const y = calculateY(d.avgPrice);
                  return `${x},${y}`;
                }).join(' ') + ` 100,100 0,100`}
              />

              {/* Linha de preço médio */}
              <polyline
                className="line-avg"
                points={priceData.map((d, i) => {
                  const x = (i / (priceData.length - 1)) * 100;
                  const y = calculateY(d.avgPrice);
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Linha de preço mínimo */}
              <polyline
                className="line-min"
                points={priceData.map((d, i) => {
                  const x = (i / (priceData.length - 1)) * 100;
                  const y = calculateY(d.minPrice);
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Linha de preço máximo */}
              <polyline
                className="line-max"
                points={priceData.map((d, i) => {
                  const x = (i / (priceData.length - 1)) * 100;
                  const y = calculateY(d.maxPrice);
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Pontos de preço médio */}
              {priceData.map((d, i) => {
                const x = (i / (priceData.length - 1)) * 100;
                const y = calculateY(d.avgPrice);
                return (
                  <circle
                    key={`point-${i}`}
                    className="point-avg"
                    cx={x}
                    cy={y}
                    r="0.8"
                  />
                );
              })}
            </svg>

            <div className="chart-labels">
              {priceData.map((d, i) => {
                if (priceData.length > 20 && i % Math.ceil(priceData.length / 10) !== 0) return null;
                return (
                  <span key={`label-${i}`} className="date-label" style={{ left: `${(i / (priceData.length - 1)) * 100}%` }}>
                    {formatDate(d.date)}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color avg"></span>
              <span>Preço Médio</span>
            </div>
            <div className="legend-item">
              <span className="legend-color min"></span>
              <span>Preço Mínimo</span>
            </div>
            <div className="legend-item">
              <span className="legend-color max"></span>
              <span>Preço Máximo</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PriceAnalysisChart;
