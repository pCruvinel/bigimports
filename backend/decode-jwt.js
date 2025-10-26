/**
 * Decode JWT token para ver o user.id
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function decodeToken() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'user@bigimports.com',
      password: 'user123'
    });

    const token = loginResponse.data.token;
    console.log('Token recebido:', token.substring(0, 50) + '...\n');

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:');
    console.log(JSON.stringify(decoded, null, 2));

    // Tentar usar o token na API
    console.log('\nTestando token no endpoint /api/user/status...');
    const statusResponse = await axios.get('http://localhost:5001/api/user/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Sucesso!');
    console.log(JSON.stringify(statusResponse.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('❌ Erro:', error.response.status);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

decodeToken();
