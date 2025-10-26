/**
 * Diagnóstico: Verificar se usuário aparece na tabela após criar no Auth
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function diagnose() {
  try {
    const testEmail = `diagnostico${Date.now()}@test.com`;

    console.log('🔍 DIAGNÓSTICO DE CRIAÇÃO DE USUÁRIO\n');
    console.log(`📧 Email de teste: ${testEmail}\n`);

    // Passo 1: Criar usuário no Auth
    console.log('1️⃣  Criando usuário no Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'senha123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Erro ao criar no Auth:', authError);
      return;
    }

    console.log(`✅ Usuário criado no Auth com ID: ${authData.user.id}\n`);

    // Passo 2: Aguardar 2 segundos e verificar se usuário apareceu na tabela users
    console.log('2️⃣  Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('3️⃣  Verificando se usuário apareceu automaticamente na tabela users...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userData) {
      console.log('⚠️  PROBLEMA ENCONTRADO: Usuário foi inserido AUTOMATICAMENTE na tabela users!');
      console.log('📋 Dados do usuário:', JSON.stringify(userData, null, 2));
      console.log('\n💡 Isso sugere que há uma TRIGGER ou POLICY que insere usuários automaticamente.');
      console.log('   Você precisa remover ou modificar essa trigger/policy no Supabase.\n');
    } else {
      console.log('✅ Usuário NÃO foi inserido automaticamente.');
      console.log('   Vamos tentar inserir manualmente...\n');

      // Tentar inserir manualmente
      console.log('4️⃣  Tentando inserir na tabela users...');
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          name: 'Teste Diagnostico',
          email: testEmail,
          whatsapp_phone: '5511999999999',
          instance_id: '5511999999999',
          plan: 'free',
          max_searches_per_day: 100,
          role_id: '02ffdbe0-9baa-4ec8-950b-c2b2d5c2c04f', // UUID da role 'user'
          status: 'active',
          instance_status: 'not_connected'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir:', insertError);
        console.error('Detalhes:', JSON.stringify(insertError, null, 2));
      } else {
        console.log('✅ Usuário inserido com sucesso!');
        console.log('📋 Dados:', JSON.stringify(insertedUser, null, 2));
      }
    }

    // Limpeza
    console.log('\n5️⃣  Limpando usuário de teste...');
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
    console.log('✅ Limpeza concluída\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

diagnose();
