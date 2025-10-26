require('dotenv').config();
const axios = require('axios');

async function testEndpoints() {
  try {
    const BASE_URL = 'http://localhost:5001/api';

    // Primeiro fazer login
    console.log('1. Fazendo login como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com', // Ajuste conforme seu usuário admin
      password: 'admin123' // Ajuste conforme sua senha
    });

    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido\n');

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Testar endpoint de produtos por categoria
    console.log('2. Testando /admin/analytics/products-by-category...');
    try {
      const categoryResponse = await axios.get(`${BASE_URL}/admin/analytics/products-by-category`, { headers });
      console.log('✅ Resposta recebida:');
      console.log(`   - Total de produtos: ${categoryResponse.data.total_products}`);
      console.log(`   - Categorias encontradas: ${categoryResponse.data.data?.length || 0}`);
      if (categoryResponse.data.data && categoryResponse.data.data.length > 0) {
        console.log('   - Primeiras 3 categorias:');
        categoryResponse.data.data.slice(0, 3).forEach(cat => {
          console.log(`     * ${cat.category}: ${cat.count} (${cat.percentage}%)`);
        });
      }
    } catch (err) {
      console.error('❌ Erro:', err.response?.data || err.message);
    }

    console.log('\n');

    // Testar endpoint de produtos timeline
    console.log('3. Testando /admin/analytics/products-timeline (30 dias)...');
    try {
      const timelineResponse = await axios.get(`${BASE_URL}/admin/analytics/products-timeline?days=30`, { headers });
      console.log('✅ Resposta recebida:');
      console.log(`   - Total de produtos: ${timelineResponse.data.total_products}`);
      console.log(`   - Dias com dados: ${timelineResponse.data.data?.length || 0}`);
      console.log(`   - Intervalo: ${timelineResponse.data.date_range?.start} até ${timelineResponse.data.date_range?.end}`);
      if (timelineResponse.data.data && timelineResponse.data.data.length > 0) {
        console.log('   - Primeiros 3 dias:');
        timelineResponse.data.data.slice(0, 3).forEach(day => {
          console.log(`     * ${day.date}: ${day.count} produtos`);
        });
      }
    } catch (err) {
      console.error('❌ Erro:', err.response?.data || err.message);
    }

    console.log('\n');

    // Testar com intervalo maior
    console.log('4. Testando /admin/analytics/products-timeline (365 dias)...');
    try {
      const timelineResponse = await axios.get(`${BASE_URL}/admin/analytics/products-timeline?days=365`, { headers });
      console.log('✅ Resposta recebida:');
      console.log(`   - Total de produtos: ${timelineResponse.data.total_products}`);
      console.log(`   - Dias com dados: ${timelineResponse.data.data?.length || 0}`);
      if (timelineResponse.data.data && timelineResponse.data.data.length > 0) {
        console.log('   - Primeiros 3 dias:');
        timelineResponse.data.data.slice(0, 3).forEach(day => {
          console.log(`     * ${day.date}: ${day.count} produtos`);
        });
      }
    } catch (err) {
      console.error('❌ Erro:', err.response?.data || err.message);
    }

  } catch (error) {
    console.error('Erro ao testar endpoints:', error.response?.data || error.message);
  }
}

// Aguardar 3 segundos para o servidor iniciar
console.log('Aguardando servidor iniciar...\n');
setTimeout(testEndpoints, 3000);
