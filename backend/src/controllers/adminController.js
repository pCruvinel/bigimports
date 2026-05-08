const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../config/database');

/**
 * ========================================
 * CRUD DE USUÁRIOS
 * ========================================
 */

/**
 * Listar todos os usuários
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return res.status(500).json({
        error: {
          message: 'Erro ao buscar usuários',
          status: 500
        }
      });
    }

    return res.status(200).json({
      users: users || [],
      total: users?.length || 0
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar usuários',
        status: 500
      }
    });
  }
};

/**
 * Obter usuário por ID
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: {
          message: 'Usuário não encontrado',
          status: 404
        }
      });
    }

    return res.status(200).json({ user });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar usuário',
        status: 500
      }
    });
  }
};

/**
 * Criar novo usuário
 * POST /api/admin/users
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, whatsapp_phone, plan, max_searches_per_day, role_id, role_name } = req.body;

    // Validação básica
    if (!name || !email || !password || !whatsapp_phone) {
      return res.status(400).json({
        error: {
          message: 'Nome, email, senha e telefone WhatsApp são obrigatórios',
          status: 400
        }
      });
    }

    // Verificar se email já existe na tabela users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle(); // Usar maybeSingle ao invés de single para não dar erro se não encontrar

    if (existingUser) {
      return res.status(409).json({
        error: {
          message: 'Email já está em uso',
          status: 409
        }
      });
    }

    // Verificar se email já existe no Auth (usuários órfãos de testes anteriores)
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const authUserExists = existingAuthUser?.users?.find(u => u.email === email);

    if (authUserExists) {
      // Deletar usuário órfão do Auth antes de criar novo
      console.log(`⚠️  Usuário órfão encontrado no Auth (${email}), deletando...`);
      await supabaseAdmin.auth.admin.deleteUser(authUserExists.id);
    }

    // Determinar role_id (buscar UUID da role)
    let finalRoleId = role_id;

    if (!finalRoleId) {
      // Se não foi passado role_id, buscar pelo role_name ou usar 'user' como padrão
      const roleToFind = role_name || 'user';
      const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', roleToFind) // A coluna é 'name', não 'role_name'
        .single();

      if (roleData) {
        finalRoleId = roleData.id;
      } else {
        // Se não encontrou, buscar role 'user' como fallback
        const { data: defaultRole } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', 'user') // A coluna é 'name', não 'role_name'
          .single();
        finalRoleId = defaultRole?.id;
      }
    }

    if (!finalRoleId) {
      return res.status(500).json({
        error: {
          message: 'Erro: Role não encontrada no banco de dados',
          status: 500
        }
      });
    }

    // Criar usuário no Supabase Auth
    // IMPORTANTE: O Supabase tem uma trigger que cria automaticamente o registro na tabela users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirma o email
    });

    if (authError || !authData.user) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return res.status(500).json({
        error: {
          message: 'Erro ao criar usuário na autenticação',
          status: 500
        }
      });
    }

    // Aguardar a trigger do Supabase criar o registro na tabela users (retry com polling)
    let userCreatedByTrigger = false;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { data: checkUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();
      if (checkUser) {
        userCreatedByTrigger = true;
        break;
      }
    }

    if (!userCreatedByTrigger) {
      // Reverter criação no Auth se trigger não criou o registro
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: {
          message: 'Timeout ao aguardar criação do registro do usuário. Tente novamente.',
          status: 500
        }
      });
    }

    // Atualizar registro na tabela public.users (criado automaticamente pela trigger)
    const instanceId = whatsapp_phone; // Usando whatsapp_phone como instance_id

    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .update({
        name,
        email,
        whatsapp_phone,
        instance_id: instanceId,
        plan: plan || 'free',
        max_searches_per_day: max_searches_per_day || 100,
        role_id: finalRoleId,
        status: 'active',
        instance_status: 'not_connected'
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (userError) {
      console.error('Erro ao criar usuário na tabela:', userError);
      console.error('Detalhes completos do erro:', JSON.stringify(userError, null, 2));

      // Reverter criação do usuário no Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return res.status(500).json({
        error: {
          message: `Erro ao criar registro do usuário: ${userError.message || 'Erro desconhecido'}`,
          details: userError.hint || userError.details,
          status: 500
        }
      });
    }

    // Buscar dados completos do usuário criado
    const { data: userData } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .eq('id', newUser.id)
      .single();

    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: userData
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao criar usuário',
        status: 500
      }
    });
  }
};

/**
 * Atualizar usuário
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, whatsapp_phone, plan, max_searches_per_day, role_id, status } = req.body;

    // Verificar se usuário existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({
        error: {
          message: 'Usuário não encontrado',
          status: 404
        }
      });
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (whatsapp_phone) updateData.whatsapp_phone = whatsapp_phone;
    if (plan) updateData.plan = plan;
    if (max_searches_per_day !== undefined) updateData.max_searches_per_day = max_searches_per_day;
    if (role_id) updateData.role_id = role_id;
    if (status) updateData.status = status;

    // Se houver mudança de email ou senha, atualizar no Auth
    if (email || password) {
      const authUpdateData = {};
      if (email) authUpdateData.email = email;
      if (password) authUpdateData.password = password;

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        authUpdateData
      );

      if (authError) {
        console.error('Erro ao atualizar Auth:', authError);
        return res.status(500).json({
          error: {
            message: 'Erro ao atualizar credenciais de autenticação',
            status: 500
          }
        });
      }
    }

    // Atualizar na tabela users
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError);
      return res.status(500).json({
        error: {
          message: 'Erro ao atualizar usuário',
          status: 500
        }
      });
    }

    // Buscar dados completos do usuário atualizado
    const { data: userData } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .eq('id', id)
      .single();

    return res.status(200).json({
      message: 'Usuário atualizado com sucesso',
      user: userData
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao atualizar usuário',
        status: 500
      }
    });
  }
};

/**
 * Deletar usuário
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({
        error: {
          message: 'Usuário não encontrado',
          status: 404
        }
      });
    }

    // Deletar usuário (cascata irá deletar registros relacionados)
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError);
      return res.status(500).json({
        error: {
          message: 'Erro ao deletar usuário',
          status: 500
        }
      });
    }

    // Deletar do Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Erro ao deletar usuário do Auth:', authError);
      // Não retorna erro pois o usuário já foi deletado da tabela
    }

    return res.status(200).json({
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao deletar usuário',
        status: 500
      }
    });
  }
};

/**
 * ========================================
 * DASHBOARD - KPIs e ANALYTICS
 * ========================================
 */

/**
 * Obter KPIs principais
 * GET /api/admin/dashboard/kpis
 */
const getKPIs = async (req, res) => {
  try {
    // Total de usuários ativos
    const { count: activeUsersCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Total de instâncias conectadas
    const { count: connectedInstancesCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('instance_status', 'connected');

    // Total de pesquisas hoje
    const today = new Date().toISOString().split('T')[0];
    const { count: searchesTodayCount } = await supabaseAdmin
      .from('search_logs')
      .select('*', { count: 'exact', head: true })
      .gte('search_timestamp', `${today}T00:00:00`)
      .lte('search_timestamp', `${today}T23:59:59`);

    // Total de produtos catalogados hoje
    const { count: productsTodayCount } = await supabaseAdmin
      .from('products_catalog')
      .select('*', { count: 'exact', head: true })
      .gte('extracted_at', `${today}T00:00:00`)
      .lte('extracted_at', `${today}T23:59:59`);

    // Analytics de instâncias (usando a view instance_analytics se existir)
    const { data: instanceAnalytics } = await supabaseAdmin
      .from('users')
      .select('instance_status')
      .eq('status', 'active');

    // Contar status das instâncias
    const instanceStatusCount = {
      connected: 0,
      not_connected: 0,
      pending_connection: 0,
      disconnected: 0,
      error: 0
    };

    instanceAnalytics?.forEach(item => {
      if (item.instance_status && instanceStatusCount.hasOwnProperty(item.instance_status)) {
        instanceStatusCount[item.instance_status]++;
      }
    });

    return res.status(200).json({
      kpis: {
        activeUsers: activeUsersCount || 0,
        connectedInstances: connectedInstancesCount || 0,
        searchesToday: searchesTodayCount || 0,
        productsCatalogedToday: productsTodayCount || 0
      },
      instanceStatusDistribution: instanceStatusCount
    });

  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar KPIs',
        status: 500
      }
    });
  }
};

/**
 * Obter pesquisas dos últimos 7 dias
 * GET /api/admin/dashboard/searches-weekly
 */
const getSearchesWeekly = async (req, res) => {
  try {
    // Data de 7 dias atrás
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    // Buscar pesquisas dos últimos 7 dias
    const { data: searches, error } = await supabaseAdmin
      .from('search_logs')
      .select('search_timestamp')
      .gte('search_timestamp', `${startDate}T00:00:00`)
      .order('search_timestamp', { ascending: true });

    if (error) {
      console.error('Erro ao buscar pesquisas semanais:', error);
      return res.status(500).json({
        error: {
          message: 'Erro ao buscar pesquisas semanais',
          status: 500
        }
      });
    }

    // Agrupar por data
    const searchesByDay = {};

    // Inicializar todos os dias com 0
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      searchesByDay[dateKey] = 0;
    }

    // Contar pesquisas por dia
    searches?.forEach(search => {
      const date = search.search_timestamp.split('T')[0];
      if (searchesByDay.hasOwnProperty(date)) {
        searchesByDay[date]++;
      }
    });

    // Converter para array ordenado
    const weeklyData = Object.keys(searchesByDay)
      .sort()
      .map(date => ({
        date,
        count: searchesByDay[date]
      }));

    return res.status(200).json({
      weeklySearches: weeklyData
    });

  } catch (error) {
    console.error('Erro ao buscar pesquisas semanais:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar pesquisas semanais',
        status: 500
      }
    });
  }
};

/**
 * Obter top 10 produtos mais buscados
 * GET /api/admin/dashboard/top-products
 */
const getTopProducts = async (req, res) => {
  try {
    // Buscar todos os normalized_query e contar
    const { data: searches, error } = await supabaseAdmin
      .from('search_logs')
      .select('normalized_query');

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return res.status(500).json({
        error: {
          message: 'Erro ao buscar produtos mais buscados',
          status: 500
        }
      });
    }

    // Contar ocorrências de cada query
    const queryCount = {};
    searches?.forEach(search => {
      if (search.normalized_query) {
        queryCount[search.normalized_query] = (queryCount[search.normalized_query] || 0) + 1;
      }
    });

    // Converter para array e ordenar
    const topProducts = Object.entries(queryCount)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.status(200).json({
      topProducts
    });

  } catch (error) {
    console.error('Erro ao buscar produtos mais buscados:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar produtos mais buscados',
        status: 500
      }
    });
  }
};

/**
 * ========================================
 * LOGS
 * ========================================
 */

/**
 * Obter logs de pesquisa
 * GET /api/admin/logs/searches
 * Query params: ?page=1&limit=20&user_phone=xxx&start_date=xxx&end_date=xxx
 */
const getSearchLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user_phone,
      start_date,
      end_date
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Construir query
    let query = supabaseAdmin
      .from('search_logs')
      .select('*', { count: 'exact' })
      .order('search_timestamp', { ascending: false });

    // Aplicar filtros
    if (user_phone) {
      query = query.eq('user_phone', user_phone);
    }

    if (start_date) {
      query = query.gte('search_timestamp', `${start_date}T00:00:00`);
    }

    if (end_date) {
      query = query.lte('search_timestamp', `${end_date}T23:59:59`);
    }

    // Aplicar paginação
    query = query.range(offset, offset + limitNum - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar logs de pesquisa:', error);
      return res.status(500).json({
        error: {
          message: 'Erro ao buscar logs de pesquisa',
          status: 500
        }
      });
    }

    return res.status(200).json({
      logs: logs || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de pesquisa:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar logs de pesquisa',
        status: 500
      }
    });
  }
};

/**
 * Obter logs de conexão
 * GET /api/admin/logs/connections
 * Query params: ?page=1&limit=20&instance_id=xxx&event_type=xxx&start_date=xxx&end_date=xxx
 */
const getConnectionLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      instance_id,
      event_type,
      start_date,
      end_date
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Construir query
    let query = supabaseAdmin
      .from('connection_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (instance_id) {
      query = query.eq('instance_id', instance_id);
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    if (start_date) {
      query = query.gte('created_at', `${start_date}T00:00:00`);
    }

    if (end_date) {
      query = query.lte('created_at', `${end_date}T23:59:59`);
    }

    // Aplicar paginação
    query = query.range(offset, offset + limitNum - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar logs de conexão:', error);
      return res.status(500).json({
        error: {
          message: 'Erro ao buscar logs de conexão',
          status: 500
        }
      });
    }

    return res.status(200).json({
      logs: logs || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de conexão:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar logs de conexão',
        status: 500
      }
    });
  }
};

/**
 * ========================================
 * ANÁLISE DE PREÇOS
 * ========================================
 */

/**
 * Obter lista de produtos únicos para o dropdown
 * GET /api/admin/dashboard/products-list
 */
const getProductsList = async (req, res) => {
  try {
    // Buscar produtos únicos (usar normalized_query da tabela search_logs ou product_name de products_catalog)
    const { data: products, error } = await supabaseAdmin
      .from('products_catalog')
      .select('product_name')
      .not('product_name', 'is', null)
      .order('product_name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar lista de produtos:', error);
      return res.status(500).json({
        error: {
          message: 'Erro ao buscar lista de produtos',
          status: 500
        }
      });
    }

    // Remover duplicatas e retornar lista única
    const uniqueProducts = [...new Set(products.map(p => p.product_name))];

    return res.status(200).json({
      products: uniqueProducts.map(name => ({ name }))
    });

  } catch (error) {
    console.error('Erro ao buscar lista de produtos:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar lista de produtos',
        status: 500
      }
    });
  }
};

/**
 * Obter análise temporal de preços de um produto
 * GET /api/admin/dashboard/price-analysis?product=nome-do-produto&days=30
 */
const getPriceAnalysis = async (req, res) => {
  try {
    const { product, days = 30 } = req.query;

    if (!product) {
      return res.status(400).json({
        error: {
          message: 'Nome do produto é obrigatório',
          status: 400
        }
      });
    }

    // Calcular data inicial (X dias atrás)
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    const startDate = daysAgo.toISOString().split('T')[0];

    // Buscar produtos do catálogo com o nome especificado
    const { data: products, error } = await supabaseAdmin
      .from('products_catalog')
      .select('product_name, price, extracted_at')
      .ilike('product_name', `%${product}%`)
      .gte('extracted_at', `${startDate}T00:00:00`)
      .order('extracted_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar análise de preços:', error);
      return res.status(500).json({
        error: {
          message: 'Erro ao buscar análise de preços',
          status: 500
        }
      });
    }

    // Agrupar por data e calcular preço médio, mínimo e máximo
    const pricesByDate = {};

    products.forEach(product => {
      const date = product.extracted_at.split('T')[0];

      if (!pricesByDate[date]) {
        pricesByDate[date] = {
          prices: [],
          count: 0
        };
      }

      // Converter preço para número (remover R$, vírgulas, etc)
      const price = parseFloat(product.price?.replace(/[^\d,.-]/g, '').replace(',', '.'));

      if (!isNaN(price) && price > 0) {
        pricesByDate[date].prices.push(price);
        pricesByDate[date].count++;
      }
    });

    // Calcular estatísticas por data
    const priceAnalysis = Object.keys(pricesByDate)
      .sort()
      .map(date => {
        const prices = pricesByDate[date].prices;
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);

        return {
          date,
          avgPrice: parseFloat(avg.toFixed(2)),
          minPrice: parseFloat(min.toFixed(2)),
          maxPrice: parseFloat(max.toFixed(2)),
          count: prices.length
        };
      });

    return res.status(200).json({
      product,
      days: parseInt(days),
      data: priceAnalysis,
      totalDataPoints: products.length
    });

  } catch (error) {
    console.error('Erro ao buscar análise de preços:', error);
    return res.status(500).json({
      error: {
        message: 'Erro ao buscar análise de preços',
        status: 500
      }
    });
  }
};

/**
 * ========================================
 * ANALYTICS AVANÇADOS - CATÁLOGO DE PRODUTOS
 * ========================================
 */

/**
 * Distribuição de produtos por categoria
 * GET /api/admin/analytics/products-by-category
 */
const getProductsByCategory = async (req, res) => {
  try {
    console.log('[ProductsByCategory] Iniciando busca de produtos...');

    // Buscar produtos em lotes para evitar limite de 1000
    let allProducts = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error } = await supabaseAdmin
        .from('products_catalog')
        .select('category')
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('[ProductsByCategory] Erro ao buscar produtos:', error);
        return res.status(500).json({
          error: { message: 'Erro ao buscar produtos por categoria', status: 500 }
        });
      }

      allProducts = allProducts.concat(batch);
      console.log(`[ProductsByCategory] Lote ${Math.floor(from / batchSize) + 1}: ${batch.length} produtos (total: ${allProducts.length})`);

      // Se retornou menos que batchSize, não há mais dados
      if (batch.length < batchSize) {
        hasMore = false;
      } else {
        from += batchSize;
      }
    }

    console.log(`[ProductsByCategory] Total de produtos encontrados: ${allProducts.length}`);

    // Agrupar manualmente por categoria
    const categoryCount = {};
    allProducts.forEach(p => {
      const cat = p.category || 'Sem Categoria';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    console.log('[ProductsByCategory] Categorias encontradas:', Object.keys(categoryCount));
    console.log('[ProductsByCategory] Total de categorias:', Object.keys(categoryCount).length);

    const totalProducts = allProducts.length;
    const result = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: parseFloat(((count / totalProducts) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count);

    console.log(`[ProductsByCategory] Retornando ${result.length} categorias`);

    return res.json({
      data: result,
      total_products: totalProducts
    });
  } catch (error) {
    console.error('[ProductsByCategory] Erro ao buscar produtos por categoria:', error);
    return res.status(500).json({
      error: { message: 'Erro ao buscar produtos por categoria', status: 500 }
    });
  }
};

/**
 * Top fornecedores por quantidade de produtos
 * GET /api/admin/analytics/top-suppliers
 */
const getTopSuppliers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log('[TopSuppliers] Iniciando busca de fornecedores...');

    // Buscar produtos em lotes para evitar limite de 1000
    let allProducts = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error } = await supabaseAdmin
        .from('products_catalog')
        .select('supplier_name, telefone')
        .not('supplier_name', 'is', null)
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('[TopSuppliers] Erro ao buscar fornecedores:', error);
        return res.status(500).json({
          error: { message: 'Erro ao buscar fornecedores', status: 500 }
        });
      }

      allProducts = allProducts.concat(batch);
      console.log(`[TopSuppliers] Lote ${Math.floor(from / batchSize) + 1}: ${batch.length} produtos (total: ${allProducts.length})`);

      if (batch.length < batchSize) {
        hasMore = false;
      } else {
        from += batchSize;
      }
    }

    console.log(`[TopSuppliers] Total de produtos encontrados: ${allProducts.length}`);

    // Agrupar por fornecedor e pegar telefone
    const supplierData = {};
    allProducts.forEach(p => {
      const supplier = p.supplier_name || 'Sem Fornecedor';
      if (!supplierData[supplier]) {
        supplierData[supplier] = {
          product_count: 0,
          telefone: p.telefone || null
        };
      }
      supplierData[supplier].product_count += 1;
      // Atualizar telefone se não tiver ou se o atual for válido
      if (p.telefone && !supplierData[supplier].telefone) {
        supplierData[supplier].telefone = p.telefone;
      }
    });

    console.log(`[TopSuppliers] Total de fornecedores únicos: ${Object.keys(supplierData).length}`);

    // Ordenar e limitar
    const result = Object.entries(supplierData)
      .map(([supplier_name, data]) => ({
        supplier_name,
        product_count: data.product_count,
        telefone: data.telefone
      }))
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, parseInt(limit));

    console.log(`[TopSuppliers] Retornando top ${result.length} fornecedores`);

    return res.json({ data: result, total: Object.keys(supplierData).length });
  } catch (error) {
    console.error('[TopSuppliers] Erro ao buscar top fornecedores:', error);
    return res.status(500).json({
      error: { message: 'Erro ao buscar top fornecedores', status: 500 }
    });
  }
};

/**
 * Produtos adicionados por dia (últimos 30 dias)
 * GET /api/admin/analytics/products-timeline
 */
const getProductsTimeline = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days);

    console.log(`[ProductsTimeline] Buscando produtos dos últimos ${daysNum} dias`);

    let query = supabaseAdmin
      .from('products_catalog')
      .select('extracted_at')
      .order('extracted_at', { ascending: true });

    let startDateISO = null;

    // Se days for 0, busca todo o período
    if (daysNum > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);
      startDateISO = startDate.toISOString();
      console.log(`[ProductsTimeline] Data de início: ${startDateISO}`);
      query = query.gte('extracted_at', startDateISO);
    } else {
      console.log(`[ProductsTimeline] Buscando todo o período`);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('[ProductsTimeline] Erro ao buscar produtos:', error);
      return res.status(500).json({
        error: { message: 'Erro ao buscar timeline de produtos', status: 500 }
      });
    }

    console.log(`[ProductsTimeline] Total de produtos encontrados: ${products?.length || 0}`);

    // Agrupar por data
    const dateCount = {};
    products.forEach(p => {
      if (p.extracted_at) {
        const date = p.extracted_at.split('T')[0];
        dateCount[date] = (dateCount[date] || 0) + 1;
      }
    });

    console.log(`[ProductsTimeline] Número de datas únicas: ${Object.keys(dateCount).length}`);
    console.log(`[ProductsTimeline] Amostra de contagem:`, Object.entries(dateCount).slice(0, 5));

    // Converter para array e ordenar
    const result = Object.entries(dateCount)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`[ProductsTimeline] Total de registros no resultado: ${result.length}`);

    const dateRange = {
      end: new Date().toISOString().split('T')[0]
    };

    if (daysNum > 0 && startDateISO) {
      dateRange.start = startDateISO.split('T')[0];
    } else if (result.length > 0) {
      // Se buscar todo o período, usar a primeira data encontrada
      dateRange.start = result[0].date;
    }

    return res.json({
      data: result,
      total_products: products.length,
      date_range: dateRange
    });
  } catch (error) {
    console.error('[ProductsTimeline] Erro ao buscar timeline de produtos:', error);
    return res.status(500).json({
      error: { message: 'Erro ao buscar timeline de produtos', status: 500 }
    });
  }
};

/**
 * Análise de preços por categoria
 * GET /api/admin/analytics/price-analysis-by-category
 */
const getPriceAnalysisByCategory = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products_catalog')
      .select('category, price')
      .not('price', 'is', null)
      .gt('price', 0);

    if (error) {
      console.error('Erro ao buscar análise de preços:', error);
      return res.status(500).json({
        error: { message: 'Erro ao buscar análise de preços', status: 500 }
      });
    }

    // Agrupar por categoria e calcular estatísticas
    const categoryStats = {};
    data.forEach(p => {
      const cat = p.category || 'Sem Categoria';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { prices: [], category: cat };
      }
      categoryStats[cat].prices.push(parseFloat(p.price));
    });

    // Calcular média, min, max
    const result = Object.values(categoryStats).map(stat => {
      const prices = stat.prices.sort((a, b) => a - b);
      const sum = prices.reduce((a, b) => a + b, 0);
      const avg = sum / prices.length;
      const min = prices[0];
      const max = prices[prices.length - 1];
      const median = prices[Math.floor(prices.length / 2)];

      return {
        category: stat.category,
        avg_price: parseFloat(avg.toFixed(2)),
        min_price: parseFloat(min.toFixed(2)),
        max_price: parseFloat(max.toFixed(2)),
        median_price: parseFloat(median.toFixed(2)),
        product_count: prices.length
      };
    }).sort((a, b) => b.product_count - a.product_count);

    return res.json({ data: result });
  } catch (error) {
    console.error('Erro ao buscar análise de preços por categoria:', error);
    return res.status(500).json({
      error: { message: 'Erro ao buscar análise de preços por categoria', status: 500 }
    });
  }
};

/**
 * Buscar produtos para análise de preço
 * GET /api/admin/analytics/products-search
 * Query: ?search=nome_do_produto
 */
const searchProductsForAnalysis = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.length < 3) {
      return res.status(400).json({
        error: { message: 'Digite pelo menos 3 caracteres para buscar', status: 400 }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('products_catalog')
      .select('product_name')
      .ilike('product_name', `%${search}%`)
      .not('price', 'is', null)
      .limit(20);

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return res.status(500).json({
        error: { message: 'Erro ao buscar produtos', status: 500 }
      });
    }

    // Retornar nomes únicos
    const uniqueProducts = [...new Set(data.map(p => p.product_name))];

    return res.json({ data: uniqueProducts });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return res.status(500).json({
      error: { message: 'Erro ao buscar produtos', status: 500 }
    });
  }
};

/**
 * Análise detalhada de preço de um produto específico
 * GET /api/admin/analytics/product-price-details
 * Query: ?product_name=iPhone
 */
const getProductPriceDetails = async (req, res) => {
  try {
    const { product_name } = req.query;

    if (!product_name) {
      return res.status(400).json({
        error: { message: 'Nome do produto é obrigatório', status: 400 }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('products_catalog')
      .select('*')
      .eq('product_name', product_name)
      .not('price', 'is', null)
      .gt('price', 0)
      .order('extracted_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar detalhes do produto:', error);
      return res.status(500).json({
        error: { message: 'Erro ao buscar detalhes do produto', status: 500 }
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        error: { message: 'Produto não encontrado', status: 404 }
      });
    }

    // Calcular estatísticas
    const prices = data.map(p => parseFloat(p.price)).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    const min = prices[0];
    const max = prices[prices.length - 1];
    const median = prices[Math.floor(prices.length / 2)];

    // Agrupar por fornecedor
    const bySupplier = {};
    data.forEach(p => {
      const supplier = p.supplier_name || 'Sem Fornecedor';
      if (!bySupplier[supplier]) {
        bySupplier[supplier] = [];
      }
      bySupplier[supplier].push({
        price: parseFloat(p.price),
        extracted_at: p.extracted_at,
        telefone: p.telefone,
        category: p.category,
        model: p.model,
        capacity: p.capacity,
        grade: p.grade,
        colors: p.colors
      });
    });

    // Agrupar por data para timeline
    const byDate = {};
    data.forEach(p => {
      const date = p.extracted_at ? p.extracted_at.split('T')[0] : 'Sem Data';
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(parseFloat(p.price));
    });

    const timeline = Object.entries(byDate)
      .map(([date, prices]) => ({
        date,
        avg_price: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
        min_price: Math.min(...prices).toFixed(2),
        max_price: Math.max(...prices).toFixed(2),
        count: prices.length
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.json({
      data: {
        product_name,
        statistics: {
          total_entries: data.length,
          avg_price: parseFloat(avg.toFixed(2)),
          min_price: parseFloat(min.toFixed(2)),
          max_price: parseFloat(max.toFixed(2)),
          median_price: parseFloat(median.toFixed(2)),
          variation: parseFloat(((max - min) / min * 100).toFixed(2))
        },
        by_supplier: Object.entries(bySupplier).map(([supplier_name, entries]) => {
          const supplierPrices = entries.map(e => e.price);
          return {
            supplier_name,
            avg_price: (supplierPrices.reduce((a, b) => a + b, 0) / supplierPrices.length).toFixed(2),
            min_price: Math.min(...supplierPrices).toFixed(2),
            max_price: Math.max(...supplierPrices).toFixed(2),
            count: entries.length,
            telefone: entries[0].telefone,
            latest_entry: entries[0]
          };
        }).sort((a, b) => parseFloat(a.avg_price) - parseFloat(b.avg_price)),
        timeline,
        latest_entries: data.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do produto:', error);
    return res.status(500).json({
      error: { message: 'Erro ao buscar detalhes do produto', status: 500 }
    });
  }
};

/**
 * Estatísticas gerais do catálogo
 * GET /api/admin/analytics/catalog-stats
 */
const getCatalogStats = async (req, res) => {
  try {
    // Total de produtos
    const { count: totalProducts, error: countError } = await supabaseAdmin
      .from('products_catalog')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Produtos com preço
    const { count: productsWithPrice, error: priceError } = await supabaseAdmin
      .from('products_catalog')
      .select('*', { count: 'exact', head: true })
      .not('price', 'is', null)
      .gt('price', 0);

    if (priceError) throw priceError;

    // Fornecedores únicos
    const { data: suppliers, error: suppliersError } = await supabaseAdmin
      .from('products_catalog')
      .select('supplier_name')
      .not('supplier_name', 'is', null);

    if (suppliersError) throw suppliersError;

    const uniqueSuppliers = new Set(suppliers.map(s => s.supplier_name)).size;

    // Categorias únicas
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('products_catalog')
      .select('category')
      .not('category', 'is', null);

    if (categoriesError) throw categoriesError;

    const uniqueCategories = new Set(categories.map(c => c.category)).size;

    // Preço médio geral
    const { data: prices, error: avgError } = await supabaseAdmin
      .from('products_catalog')
      .select('price')
      .not('price', 'is', null)
      .gt('price', 0);

    if (avgError) throw avgError;

    const avgPrice = prices.length > 0
      ? prices.reduce((sum, p) => sum + parseFloat(p.price), 0) / prices.length
      : 0;

    return res.json({
      data: {
        total_products: totalProducts || 0,
        products_with_price: productsWithPrice || 0,
        unique_suppliers: uniqueSuppliers,
        unique_categories: uniqueCategories,
        avg_price: parseFloat(avgPrice.toFixed(2)),
        price_coverage: totalProducts > 0
          ? parseFloat(((productsWithPrice / totalProducts) * 100).toFixed(2))
          : 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do catálogo:', error);
    return res.status(500).json({
      error: { message: 'Erro ao buscar estatísticas do catálogo', status: 500 }
    });
  }
};

module.exports = {
  // CRUD Usuários
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  // Dashboard
  getKPIs,
  getSearchesWeekly,
  getTopProducts,
  // Logs
  getSearchLogs,
  getConnectionLogs,
  // Análise de Preços
  getProductsList,
  getPriceAnalysis,
  // Analytics Avançados
  getProductsByCategory,
  getTopSuppliers,
  getProductsTimeline,
  getPriceAnalysisByCategory,
  getCatalogStats,
  searchProductsForAnalysis,
  getProductPriceDetails
};
