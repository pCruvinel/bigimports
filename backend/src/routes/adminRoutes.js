const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const configController = require('../controllers/configController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * Todas as rotas admin são protegidas por autenticação e role 'admin'
 */

// Middleware aplicado a todas as rotas admin
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

/**
 * CRUD de Usuários
 */

/**
 * @route   GET /api/admin/users
 * @desc    Listar todos os usuários
 * @access  Private (Admin only)
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Obter dados de um usuário específico
 * @access  Private (Admin only)
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Criar novo usuário
 * @access  Private (Admin only)
 */
router.post('/users', adminController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Atualizar dados de um usuário
 * @access  Private (Admin only)
 */
router.put('/users/:id', adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deletar um usuário
 * @access  Private (Admin only)
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * Dashboard - KPIs e Analytics
 */

/**
 * @route   GET /api/admin/dashboard/kpis
 * @desc    Obter KPIs principais do dashboard
 * @access  Private (Admin only)
 */
router.get('/dashboard/kpis', adminController.getKPIs);

/**
 * @route   GET /api/admin/dashboard/searches-weekly
 * @desc    Obter número de pesquisas por dia nos últimos 7 dias
 * @access  Private (Admin only)
 */
router.get('/dashboard/searches-weekly', adminController.getSearchesWeekly);

/**
 * @route   GET /api/admin/dashboard/top-products
 * @desc    Obter os 10 produtos mais buscados
 * @access  Private (Admin only)
 */
router.get('/dashboard/top-products', adminController.getTopProducts);

/**
 * @route   GET /api/admin/dashboard/products-list
 * @desc    Obter lista de produtos únicos para dropdown
 * @access  Private (Admin only)
 */
router.get('/dashboard/products-list', adminController.getProductsList);

/**
 * @route   GET /api/admin/dashboard/price-analysis
 * @desc    Análise temporal de preços de um produto
 * @access  Private (Admin only)
 * @query   product - Nome do produto (obrigatório)
 * @query   days - Número de dias para análise (opcional, padrão: 30)
 */
router.get('/dashboard/price-analysis', adminController.getPriceAnalysis);

/**
 * Logs
 */

/**
 * @route   GET /api/admin/logs/searches
 * @desc    Obter logs de pesquisa com paginação e filtros
 * @access  Private (Admin only)
 */
router.get('/logs/searches', adminController.getSearchLogs);

/**
 * @route   GET /api/admin/logs/connections
 * @desc    Obter logs de conexão com paginação e filtros
 * @access  Private (Admin only)
 */
router.get('/logs/connections', adminController.getConnectionLogs);

/**
 * Configurações do Sistema
 */

/**
 * @route   GET /api/admin/config
 * @desc    Obter todas as configurações do sistema
 * @access  Private (Admin only)
 */
router.get('/config', configController.getAllConfigs);

/**
 * @route   GET /api/admin/config/:key
 * @desc    Obter configuração específica por chave
 * @access  Private (Admin only)
 */
router.get('/config/:key', configController.getConfigByKey);

/**
 * @route   PUT /api/admin/config/:key
 * @desc    Atualizar configuração específica
 * @access  Private (Admin only)
 */
router.put('/config/:key', configController.updateConfig);

/**
 * @route   PUT /api/admin/config
 * @desc    Atualizar múltiplas configurações de uma vez
 * @access  Private (Admin only)
 */
router.put('/config', configController.updateMultipleConfigs);

/**
 * @route   POST /api/admin/config/test-supabase
 * @desc    Testar conexão com Supabase usando credenciais fornecidas
 * @access  Private (Admin only)
 */
router.post('/config/test-supabase', configController.testSupabaseConnection);

/**
 * Analytics Avançados - Catálogo de Produtos
 */

/**
 * @route   GET /api/admin/analytics/products-by-category
 * @desc    Distribuição de produtos por categoria
 * @access  Private (Admin only)
 */
router.get('/analytics/products-by-category', adminController.getProductsByCategory);

/**
 * @route   GET /api/admin/analytics/top-suppliers
 * @desc    Top fornecedores por quantidade de produtos
 * @access  Private (Admin only)
 * @query   limit - Número de fornecedores (opcional, padrão: 10)
 */
router.get('/analytics/top-suppliers', adminController.getTopSuppliers);

/**
 * @route   GET /api/admin/analytics/products-timeline
 * @desc    Produtos adicionados por dia
 * @access  Private (Admin only)
 * @query   days - Número de dias (opcional, padrão: 30)
 */
router.get('/analytics/products-timeline', adminController.getProductsTimeline);

/**
 * @route   GET /api/admin/analytics/price-analysis-by-category
 * @desc    Análise de preços por categoria (média, min, max, mediana)
 * @access  Private (Admin only)
 */
router.get('/analytics/price-analysis-by-category', adminController.getPriceAnalysisByCategory);

/**
 * @route   GET /api/admin/analytics/catalog-stats
 * @desc    Estatísticas gerais do catálogo
 * @access  Private (Admin only)
 */
router.get('/analytics/catalog-stats', adminController.getCatalogStats);

/**
 * @route   GET /api/admin/analytics/products-search
 * @desc    Buscar produtos para análise
 * @access  Private (Admin only)
 * @query   search - Termo de busca (mínimo 3 caracteres)
 */
router.get('/analytics/products-search', adminController.searchProductsForAnalysis);

/**
 * @route   GET /api/admin/analytics/product-price-details
 * @desc    Análise detalhada de preço de um produto específico
 * @access  Private (Admin only)
 * @query   product_name - Nome exato do produto
 */
router.get('/analytics/product-price-details', adminController.getProductPriceDetails);

module.exports = router;
