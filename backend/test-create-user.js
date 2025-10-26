/**
 * Script de teste para criar usuário via API
 * Execute: node test-create-user.js
 */

const axios = require('axios');

// Configurações
const API_URL = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'admin@bigimports.com';
const ADMIN_PASSWORD = 'admin123'; // Substitua pela senha do admin

async function testCreateUser() {
  try {
    console.log('🔐 Fazendo login como admin...');

    // 1. Fazer login como admin
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginResponse.data.user.name);
    console.log('🔑 Role:', loginResponse.data.user.role);

    if (loginResponse.data.user.role !== 'admin') {
      console.error('❌ Erro: Usuário não é admin!');
      return;
    }

    // 2. Criar novo usuário de teste
    console.log('\n📝 Criando novo usuário...');

    const newUser = {
      name: 'Teste Usuario',
      email: `teste${Date.now()}@example.com`, // Email único
      password: 'senha123',
      whatsapp_phone: '5511999999999',
      plan: 'basic',
      max_searches_per_day: 100,
      role_name: 'user', // Usar role_name ao invés de role_id
      status: 'active'
    };

    console.log('Dados do usuário:', JSON.stringify(newUser, null, 2));

    const createResponse = await axios.post(
      `${API_URL}/admin/users`,
      newUser,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Usuário criado com sucesso!');
    console.log('Resposta:', JSON.stringify(createResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário:');

    if (error.response) {
      // Erro retornado pela API
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // Requisição feita mas sem resposta
      console.error('Sem resposta do servidor');
      console.error('Verifique se o backend está rodando na porta 5001');
    } else {
      // Erro ao configurar requisição
      console.error('Erro:', error.message);
    }
  }
}

// Executar teste
console.log('=== TESTE DE CRIAÇÃO DE USUÁRIO ===\n');
testCreateUser();
