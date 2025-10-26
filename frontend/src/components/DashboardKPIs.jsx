import { useState, useEffect } from 'react';
import api from '../services/api';

const DashboardKPIs = () => {
  const [kpis, setKpis] = useState({
    activeUsers: 0,
    connectedInstances: 0,
    searchesToday: 0,
    productsCatalogedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/dashboard/kpis');
      setKpis(response.data.kpis);
    } catch (err) {
      console.error('Erro ao carregar KPIs:', err);
      setError('Erro ao carregar KPIs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Carregando KPIs...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#dc3545', textAlign: 'center' }}>
        {error}
        <br />
        <button onClick={fetchKPIs} style={{ marginTop: '10px' }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Indicadores Principais</h2>

      <div style={kpiGridStyle}>
        {/* Usuários Ativos */}
        <div style={{ ...kpiCardStyle, borderLeft: '4px solid #28a745' }}>
          <div style={kpiIconStyle}>
            <span style={{ fontSize: '32px' }}>👥</span>
          </div>
          <div style={kpiContentStyle}>
            <div style={kpiLabelStyle}>Usuários Ativos</div>
            <div style={kpiValueStyle}>{kpis.activeUsers}</div>
          </div>
        </div>

        {/* Instâncias Conectadas */}
        <div style={{ ...kpiCardStyle, borderLeft: '4px solid #007bff' }}>
          <div style={kpiIconStyle}>
            <span style={{ fontSize: '32px' }}>📱</span>
          </div>
          <div style={kpiContentStyle}>
            <div style={kpiLabelStyle}>Instâncias Conectadas</div>
            <div style={kpiValueStyle}>{kpis.connectedInstances}</div>
          </div>
        </div>

        {/* Pesquisas Hoje */}
        <div style={{ ...kpiCardStyle, borderLeft: '4px solid #ffc107' }}>
          <div style={kpiIconStyle}>
            <span style={{ fontSize: '32px' }}>🔍</span>
          </div>
          <div style={kpiContentStyle}>
            <div style={kpiLabelStyle}>Pesquisas Hoje</div>
            <div style={kpiValueStyle}>{kpis.searchesToday}</div>
          </div>
        </div>

        {/* Produtos Catalogados Hoje */}
        <div style={{ ...kpiCardStyle, borderLeft: '4px solid #17a2b8' }}>
          <div style={kpiIconStyle}>
            <span style={{ fontSize: '32px' }}>📦</span>
          </div>
          <div style={kpiContentStyle}>
            <div style={kpiLabelStyle}>Produtos Catalogados Hoje</div>
            <div style={kpiValueStyle}>{kpis.productsCatalogedToday}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Estilos
const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px'
};

const kpiCardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '15px'
};

const kpiIconStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '60px'
};

const kpiContentStyle = {
  flex: 1
};

const kpiLabelStyle = {
  fontSize: '14px',
  color: '#6c757d',
  marginBottom: '8px',
  fontWeight: '500'
};

const kpiValueStyle = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#212529'
};

export default DashboardKPIs;
