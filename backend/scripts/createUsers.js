const { supabaseAdmin } = require('../src/config/database');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Script para criar usuários de teste no banco de dados
 */

// Gerar UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

async function createUsers() {
  try {
    console.log('🔄 Iniciando criação de usuários...\n');

    // 1. Obter IDs das roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('id, name');

    if (rolesError) {
      throw new Error(`Erro ao buscar roles: ${rolesError.message}`);
    }

    console.log('✅ Roles encontradas:', roles);

    const adminRole = roles.find(r => r.name === 'admin');
    const userRole = roles.find(r => r.name === 'user');

    if (!adminRole || !userRole) {
      throw new Error('Roles "admin" ou "user" não encontradas no banco de dados');
    }

    // 2. Criar usuário Admin
    console.log('\n🔄 Criando usuário Admin...');

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .insert({
        name: 'Admin Teste',
        email: 'admin@bigimports.com',
        password_hash: '$2a$10$Pltgvqigk7TWb52VPoZhHujBy4TVzVgNHJ8XFGdpAZaNN5KPk09ce',
        role_id: adminRole.id,
        status: 'active',
        plan: 'premium',
        max_searches_per_day: 1000
      })
      .select()
      .single();

    if (adminError) {
      if (adminError.code === '23505') {
        console.log('⚠️  Usuário Admin já existe');
      } else {
        throw new Error(`Erro ao criar Admin: ${adminError.message}`);
      }
    } else {
      console.log('✅ Usuário Admin criado com sucesso!');
      console.log('   Email: admin@bigimports.com');
      console.log('   Senha: admin123');
    }

    // 3. Criar usuário User
    console.log('\n🔄 Criando usuário User...');

    const { data: normalUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name: 'Usuário Teste',
        email: 'user@bigimports.com',
        password_hash: '$2a$10$zfIQEISAqdj2VHQD4I5Ak.CvB6EJNtpDrmkjWLQTw65KI5fg/BTc.',
        role_id: userRole.id,
        status: 'active',
        plan: 'basic',
        max_searches_per_day: 100,
        whatsapp_phone: '5511999999999'
      })
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') {
        console.log('⚠️  Usuário User já existe');
      } else {
        throw new Error(`Erro ao criar User: ${userError.message}`);
      }
    } else {
      console.log('✅ Usuário User criado com sucesso!');
      console.log('   Email: user@bigimports.com');
      console.log('   Senha: user123');
    }

    // 4. Verificar usuários criados
    console.log('\n🔄 Verificando usuários criados...\n');

    const { data: users, error: verifyError } = await supabaseAdmin
      .from('users_with_roles')
      .select('id, name, email, role_name, status, plan')
      .in('email', ['admin@bigimports.com', 'user@bigimports.com']);

    if (verifyError) {
      throw new Error(`Erro ao verificar usuários: ${verifyError.message}`);
    }

    console.log('✅ Usuários criados/existentes:');
    console.table(users);

    console.log('\n✅ Script concluído com sucesso!\n');
    console.log('Credenciais de acesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@bigimports.com');
    console.log('  Senha: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User:');
    console.log('  Email: user@bigimports.com');
    console.log('  Senha: user123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao criar usuários:', error.message);
    process.exit(1);
  }
}

createUsers();
