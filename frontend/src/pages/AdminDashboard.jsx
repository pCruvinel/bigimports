import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/UserManagement';
import DashboardKPIs from '../components/DashboardKPIs';
import SearchesWeeklyChart from '../components/SearchesWeeklyChart';
import TopProductsChart from '../components/TopProductsChart';
import InstanceStatusChart from '../components/InstanceStatusChart';
import PriceAnalysisChart from '../components/PriceAnalysisChart';
import LogsSection from '../components/LogsSection';
import CatalogStats from '../components/CatalogStats';
import ProductsByCategoryChart from '../components/ProductsByCategoryChart';
import TopSuppliersTable from '../components/TopSuppliersTable';
import ProductsTimelineChart from '../components/ProductsTimelineChart';
import PriceAnalysisByCategory from '../components/PriceAnalysisByCategory';
import ProductPriceAnalysis from '../components/ProductPriceAnalysis';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Painel do Administrador</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/admin/settings')}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ⚙️ Configurações
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Bem-vindo, {user?.name}!</h3>
        <p style={{ margin: '5px 0' }}>Email: {user?.email}</p>
        <p style={{ margin: '5px 0' }}>Role: {user?.role}</p>
      </div>

      {/* Tabs de navegação */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #dee2e6'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === 'dashboard' ? '3px solid #007bff' : 'none',
            color: activeTab === 'dashboard' ? '#007bff' : '#6c757d'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === 'users' ? '3px solid #007bff' : 'none',
            color: activeTab === 'users' ? '#007bff' : '#6c757d'
          }}
        >
          Usuários
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === 'logs' ? '3px solid #007bff' : 'none',
            color: activeTab === 'logs' ? '#007bff' : '#6c757d'
          }}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            ...tabButtonStyle,
            borderBottom: activeTab === 'analytics' ? '3px solid #007bff' : 'none',
            color: activeTab === 'analytics' ? '#007bff' : '#6c757d'
          }}
        >
          Analytics
        </button>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'dashboard' && (
        <>
          {/* KPIs */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '30px'
          }}>
            <DashboardKPIs />
          </div>

          {/* Gráficos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '30px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <SearchesWeeklyChart />
            </div>

            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <InstanceStatusChart />
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '30px'
          }}>
            <TopProductsChart />
          </div>

          {/* Gráfico de Análise de Preços */}
          <PriceAnalysisChart />
        </>
      )}

      {activeTab === 'users' && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          marginBottom: '30px'
        }}>
          <UserManagement />
        </div>
      )}

      {activeTab === 'logs' && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          marginBottom: '30px'
        }}>
          <LogsSection />
        </div>
      )}

      {activeTab === 'analytics' && (
        <>
          {/* Estatísticas Gerais do Catálogo */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '30px'
          }}>
            <CatalogStats />
          </div>

          {/* Grid com produtos por categoria e fornecedores */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '30px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <ProductsByCategoryChart />
            </div>

            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <TopSuppliersTable />
            </div>
          </div>

          {/* Timeline de Produtos */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '30px'
          }}>
            <ProductsTimelineChart />
          </div>

          {/* Análise de Preços por Categoria */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '30px'
          }}>
            <PriceAnalysisByCategory />
          </div>

          {/* Análise de Preço por Produto */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '30px'
          }}>
            <ProductPriceAnalysis />
          </div>
        </>
      )}
    </div>
  );
};

const tabButtonStyle = {
  padding: '12px 24px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  transition: 'all 0.2s',
  marginBottom: '-2px'
};

export default AdminDashboard;
