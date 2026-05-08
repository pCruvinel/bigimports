const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ==============================================
// SEGURANÇA - Headers HTTP
// ==============================================
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false, // Desabilitar CSP em dev
  crossOriginEmbedderPolicy: false
}));

// ==============================================
// COMPRESSÃO - Respostas gzip
// ==============================================
app.use(compression());

// ==============================================
// RATE LIMITING - Proteção contra brute force
// ==============================================

// Rate limit global: 100 requests por IP a cada 15 minutos
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isProduction ? 100 : 1000, // Mais flexível em dev
  message: {
    error: {
      message: 'Muitas requisições. Tente novamente em alguns minutos.',
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit específico para login: 5 tentativas por IP a cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 50, // Mais flexível em dev
  message: {
    error: {
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

// ==============================================
// CORS - Cross-Origin Resource Sharing
// ==============================================
const allowedOrigins = [
  process.env.FRONTEND_URL
].filter(Boolean);

// Em desenvolvimento, permitir origens adicionais
if (!isProduction) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174');
}

app.use(cors({
  origin: (origin, callback) => {
    // Em produção, sempre exigir origin (exceto health check)
    if (!origin) {
      if (isProduction) {
        return callback(new Error('Origin header is required'));
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Limitar tamanho do body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==============================================
// HEALTH CHECK
// ==============================================
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  const status = dbConnected ? 'ok' : 'degraded';
  const httpStatus = dbConnected ? 200 : 503;

  res.status(httpStatus).json({
    status,
    message: dbConnected ? 'Backend API is running' : 'Backend API running, but database is unreachable',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development'
  });
});

// ==============================================
// ROTAS
// ==============================================
app.use('/api/auth/login', loginLimiter); // Rate limit no login
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'BigImports API v1.0',
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      user: {
        status: 'GET /api/user/status',
        connect: 'POST /api/user/connect',
        regenerateQR: 'POST /api/user/regenerate-qr',
        disconnect: 'POST /api/user/disconnect'
      },
      admin: {
        users: {
          list: 'GET /api/admin/users',
          get: 'GET /api/admin/users/:id',
          create: 'POST /api/admin/users',
          update: 'PUT /api/admin/users/:id',
          delete: 'DELETE /api/admin/users/:id'
        },
        dashboard: {
          kpis: 'GET /api/admin/dashboard/kpis',
          searchesWeekly: 'GET /api/admin/dashboard/searches-weekly',
          topProducts: 'GET /api/admin/dashboard/top-products'
        },
        logs: {
          searches: 'GET /api/admin/logs/searches',
          connections: 'GET /api/admin/logs/connections'
        }
      }
    }
  });
});

// ==============================================
// ERROR HANDLING
// ==============================================
app.use((err, req, res, next) => {
  // Em produção, nunca expor stack traces ou mensagens internas
  if (isProduction) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path} - ${err.message}`);
    res.status(err.status || 500).json({
      error: {
        message: err.status && err.status < 500
          ? err.message
          : 'Erro interno do servidor',
        status: err.status || 500
      }
    });
  } else {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        status: err.status || 500
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// ==============================================
// GRACEFUL SHUTDOWN
// ==============================================
let server;

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
    // Forçar encerramento após 10 segundos
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================
const startServer = async () => {
  try {
    // Validar variáveis de ambiente obrigatórias
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
      console.error(`❌ Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(', ')}`);
      process.exit(1);
    }

    // Alertar sobre JWT Secret fraco
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.warn('⚠️  JWT_SECRET é muito curto. Use pelo menos 32 caracteres aleatórios.');
    }

    // Testar conexão com o banco de dados
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('⚠️  Servidor iniciado, mas sem conexão com o banco de dados');
    }

    server = app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      if (isProduction) {
        console.log('🔒 Modo produção: Helmet, Rate Limiting e CORS restritivo ativos');
      }
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
