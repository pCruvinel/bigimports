/**
 * Script de teste completo do fluxo de QR Code
 * Execute: node test-qrcode-flow.js
 */

const axios = require('axios');

// Configurações
const API_URL = 'http://localhost:5001/api';
const TEST_USER_EMAIL = 'user@bigimports.com'; // Usuário de teste
const TEST_USER_PASSWORD = 'user123'; // Senha do usuário de teste

async function testQRCodeFlow() {
  let token = null;

  try {
    console.log('═══════════════════════════════════════════════');
    console.log('   TESTE DE FLUXO DE GERAÇÃO DE QR CODE');
    console.log('═══════════════════════════════════════════════\n');

    // ========================================
    // 1. LOGIN
    // ========================================
    console.log('1️⃣  Fazendo login como usuário...');

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso!');
    console.log(`   👤 Usuário: ${loginResponse.data.user.name}`);
    console.log(`   📧 Email: ${loginResponse.data.user.email}`);
    console.log(`   🔑 Role: ${loginResponse.data.user.role}\n`);

    // ========================================
    // 2. VERIFICAR STATUS INICIAL
    // ========================================
    console.log('2️⃣  Verificando status inicial da conexão...');

    const statusResponse = await axios.get(`${API_URL}/user/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Status obtido:');
    console.log(`   📊 Status: ${statusResponse.data.status}`);
    console.log(`   📱 WhatsApp: ${statusResponse.data.whatsappPhone || 'Não conectado'}`);
    console.log(`   🔄 Pode regenerar: ${statusResponse.data.canRegenerate ? 'Sim' : 'Não'}\n`);

    const currentStatus = statusResponse.data.status;

    // ========================================
    // 3. CONECTAR (SE NÃO ESTIVER CONECTADO)
    // ========================================
    if (currentStatus === 'not_connected' || currentStatus === 'disconnected' || currentStatus === 'error') {
      console.log('3️⃣  Iniciando conexão WhatsApp...');
      console.log('   ⏳ Chamando webhook n8n para criar instância...\n');

      try {
        const connectResponse = await axios.post(
          `${API_URL}/user/connect`,
          {},
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        console.log('✅ Instância criada com sucesso!');
        console.log(`   📋 Mensagem: ${connectResponse.data.message}`);
        console.log(`   🆔 Instance ID: ${connectResponse.data.instanceId || 'N/A'}`);

        if (connectResponse.data.qrCode) {
          console.log(`   ✅ QR Code recebido! (${connectResponse.data.qrCode.length} caracteres)\n`);
        } else {
          console.log('   ⚠️  QR Code não foi retornado na resposta\n');
        }

        // Verificar status novamente
        console.log('4️⃣  Verificando novo status...');
        const newStatusResponse = await axios.get(`${API_URL}/user/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Novo status:');
        console.log(`   📊 Status: ${newStatusResponse.data.status}`);
        console.log(`   📅 QR gerado em: ${newStatusResponse.data.qrGeneratedAt || 'N/A'}`);
        console.log(`   🖼️  QR Code presente: ${newStatusResponse.data.qrCodeData ? 'Sim' : 'Não'}`);

        if (newStatusResponse.data.qrCodeData) {
          console.log(`   📏 Tamanho do QR Code: ${newStatusResponse.data.qrCodeData.length} caracteres`);
        }

      } catch (connectError) {
        console.error('\n❌ ERRO ao conectar:');
        if (connectError.response) {
          console.error(`   Status: ${connectError.response.status}`);
          console.error(`   Mensagem: ${JSON.stringify(connectError.response.data, null, 2)}`);
        } else {
          console.error(`   ${connectError.message}`);
        }
      }

    } else if (currentStatus === 'pending_connection') {
      console.log('3️⃣  Conexão já está pendente');
      console.log(`   📅 QR gerado em: ${statusResponse.data.qrGeneratedAt}`);
      console.log(`   🖼️  QR Code presente: ${statusResponse.data.qrCodeData ? 'Sim' : 'Não'}\n`);

    } else if (currentStatus === 'connected') {
      console.log('3️⃣  Usuário já está conectado!');
      console.log(`   ✅ Nome: ${statusResponse.data.name}`);
      console.log(`   📅 Conectado em: ${statusResponse.data.connectedAt}\n`);
    }

    // ========================================
    // RESUMO
    // ========================================
    console.log('\n═══════════════════════════════════════════════');
    console.log('   RESUMO DO TESTE');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ Teste concluído com sucesso!\n');
    console.log('Próximos passos:');
    console.log('1. Verifique se o QR Code aparece no frontend');
    console.log('2. Escaneie o QR Code com o WhatsApp');
    console.log('3. O workflow de polling do n8n deve detectar a conexão');
    console.log('4. O status deve mudar para "connected"\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Sem resposta do servidor');
      console.error('Verifique se o backend está rodando na porta 5001');
    } else {
      console.error('Erro:', error.message);
    }
  }
}

// Executar teste
testQRCodeFlow();
