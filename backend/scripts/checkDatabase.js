const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

/**
 * Script para verificar a estrutura das tabelas
 */

async function checkDatabase() {
  try {
    console.log('🔄 Verificando estrutura do banco de dados...\n');

    // Verificar tabela roles
    console.log('1. Verificando tabela roles:');
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .limit(5);

    if (rolesError) {
      console.error('❌ Erro ao buscar roles:', rolesError.message);
    } else {
      console.log('✅ Roles encontradas:');
      console.table(roles);
    }

    // Verificar tabela users
    console.log('\n2. Verificando tabela users:');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao buscar users:', usersError.message);
    } else {
      console.log('✅ Usuários encontrados:');
      console.table(users);
    }

    // Verificar view users_with_roles
    console.log('\n3. Verificando view users_with_roles:');
    const { data: usersView, error: viewError } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .limit(5);

    if (viewError) {
      console.error('❌ Erro ao buscar users_with_roles:', viewError.message);
    } else {
      console.log('✅ View users_with_roles:');
      console.table(usersView);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

checkDatabase();
