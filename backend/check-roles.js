/**
 * Script para verificar estrutura da tabela roles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkRoles() {
  try {
    console.log('🔍 Verificando tabela roles...\n');

    // Buscar todas as roles
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('*');

    if (error) {
      console.error('❌ Erro ao buscar roles:', error);
      return;
    }

    if (!roles || roles.length === 0) {
      console.log('⚠️  Tabela roles está vazia!');
      console.log('\nPara criar roles, execute no Supabase SQL Editor:');
      console.log(`
INSERT INTO roles (id, role_name, description) VALUES
  (gen_random_uuid(), 'admin', 'Administrador do sistema'),
  (gen_random_uuid(), 'user', 'Usuário padrão');
      `);
      return;
    }

    console.log('✅ Roles encontradas:');
    console.log(JSON.stringify(roles, null, 2));

  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

checkRoles();
