/**
 * Debug do problema com a view users_with_roles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debug() {
  try {
    const userId = '9a6bdbff-5131-48a1-b6ed-0a6f7b23c850'; // ID do usuário user@bigimports.com

    console.log('🔍 Testando consulta à view users_with_roles...\n');
    console.log(`User ID: ${userId}\n`);

    // Tentar com single()
    console.log('1️⃣  Tentando com .single():');
    const { data: user1, error: error1 } = await supabaseAdmin
      .from('users_with_roles')
      .select('id, name, email, instance_status')
      .eq('id', userId)
      .single();

    if (error1) {
      console.error('❌ Erro:', JSON.stringify(error1, null, 2));
    } else {
      console.log('✅ Sucesso:', JSON.stringify(user1, null, 2));
    }

    // Tentar com maybeSingle()
    console.log('\n2️⃣  Tentando com .maybeSingle():');
    const { data: user2, error: error2 } = await supabaseAdmin
      .from('users_with_roles')
      .select('id, name, email, instance_status')
      .eq('id', userId)
      .maybeSingle();

    if (error2) {
      console.error('❌ Erro:', JSON.stringify(error2, null, 2));
    } else {
      console.log('✅ Sucesso:', JSON.stringify(user2, null, 2));
    }

    // Tentar sem filtro de ID
    console.log('\n3️⃣  Listando todos os usuários da view:');
    const { data: allUsers, error: error3 } = await supabaseAdmin
      .from('users_with_roles')
      .select('id, name, email, role_name')
      .limit(5);

    if (error3) {
      console.error('❌ Erro:', JSON.stringify(error3, null, 2));
    } else {
      console.log('✅ Usuários encontrados:', allUsers.length);
      console.log(JSON.stringify(allUsers, null, 2));
    }

  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

debug();
