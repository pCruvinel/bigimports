/**
 * Verificar se usuário user@bigimports.com existe na tabela users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário user@bigimports.com...\n');

    // Buscar na tabela users
    const { data: user, error } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .eq('email', 'user@bigimports.com')
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar:', error);
      return;
    }

    if (!user) {
      console.log('⚠️  Usuário NÃO encontrado na tabela users');
      console.log('\nVerificando no Auth...');

      // Buscar no Auth
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email === 'user@bigimports.com');

      if (authUser) {
        console.log('✅ Usuário EXISTE no Auth!');
        console.log(`   ID: ${authUser.id}`);
        console.log(`   Email: ${authUser.email}`);
        console.log(`   Criado em: ${authUser.created_at}`);
        console.log('\n💡 PROBLEMA: Usuário existe no Auth mas não na tabela users!');
        console.log('   Isso pode acontecer se a trigger falhou ou não existe.\n');
      } else {
        console.log('❌ Usuário não existe nem no Auth nem na tabela users');
        console.log('\nPara criar, execute o script createTestUsers.sql no Supabase');
      }

    } else {
      console.log('✅ Usuário encontrado na tabela users!');
      console.log(JSON.stringify(user, null, 2));
    }

  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

checkUser();
