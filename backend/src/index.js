const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (Postman, mobile apps, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Rotas
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
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

// Iniciar servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco de dados
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('⚠️  Servidor iniciado, mas sem conexão com o banco de dados');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
