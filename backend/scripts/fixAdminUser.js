const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

/**
 * Script para corrigir dados do usuário Admin
 */

async function fixAdminUser() {
  try {
    console.log('🔄 Corrigindo dados do usuário Admin...\n');

    // Buscar role de admin
    const { data: adminRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (!adminRole) {
      throw new Error('Role admin não encontrada');
    }

    // Atualizar usuário admin@bigimports.com
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        name: 'Admin Teste',
        role_id: adminRole.id,
        plan: 'premium',
        max_searches_per_day: 1000
      })
      .eq('email', 'admin@bigimports.com');

    if (error) {
      throw new Error(`Erro ao atualizar: ${error.message}`);
    }

    console.log('✅ Usuário Admin atualizado com sucesso!\n');

    // Verificar
    const { data: users } = await supabaseAdmin
      .from('users_with_roles')
      .select('id, name, email, role_name, status, plan')
      .in('email', ['admin@bigimports.com', 'user@bigimports.com']);

    console.log('Usuários atualizados:');
    console.table(users);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixAdminUser();
