const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

/**
 * Script para criar usuários de teste usando Supabase Auth
 */

async function createAuthUsers() {
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

    // 2. Criar usuário Admin em auth.users
    console.log('\n🔄 Criando usuário Admin em auth.users...');

    const { data: adminAuthUser, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@bigimports.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin Teste'
      }
    });

    if (adminAuthError) {
      console.log('Erro recebido:', adminAuthError);

      const errorMsg = adminAuthError.message || adminAuthError.msg || JSON.stringify(adminAuthError);

      if (errorMsg.includes('already registered') || errorMsg.includes('already been registered')) {
        console.log('⚠️  Usuário Admin já existe em auth.users');

        // Buscar usuário existente
        const { data: existingAdmin } = await supabaseAdmin.auth.admin.listUsers();
        const adminUser = existingAdmin.users.find(u => u.email === 'admin@bigimports.com');

        if (adminUser) {
          console.log('✅ Encontrado usuário Admin existente:', adminUser.id);

          // Verificar se já existe em public.users
          const { data: publicAdmin } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', adminUser.id)
            .single();

          if (!publicAdmin) {
            console.log('🔄 Criando registro em public.users...');
            await createPublicUser(adminUser.id, 'Admin Teste', 'admin@bigimports.com', adminRole.id, 'premium', 1000);
          } else {
            console.log('✅ Registro já existe em public.users');
          }
        }
      } else {
        throw new Error(`Erro ao criar Admin em auth.users: ${adminAuthError.message}`);
      }
    } else {
      console.log('✅ Usuário Admin criado em auth.users:', adminAuthUser.user.id);

      // Criar em public.users
      console.log('🔄 Criando registro em public.users...');
      await createPublicUser(adminAuthUser.user.id, 'Admin Teste', 'admin@bigimports.com', adminRole.id, 'premium', 1000);

      console.log('✅ Usuário Admin criado com sucesso!');
      console.log('   Email: admin@bigimports.com');
      console.log('   Senha: admin123');
    }

    // 3. Criar usuário User em auth.users
    console.log('\n🔄 Criando usuário User em auth.users...');

    const { data: userAuthUser, error: userAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: 'user@bigimports.com',
      password: 'user123',
      email_confirm: true,
      user_metadata: {
        name: 'Usuário Teste'
      }
    });

    if (userAuthError) {
      console.log('Erro recebido (User):', userAuthError);

      const errorMsg = userAuthError.message || userAuthError.msg || JSON.stringify(userAuthError);

      if (errorMsg.includes('already registered') || errorMsg.includes('already been registered')) {
        console.log('⚠️  Usuário User já existe em auth.users');

        // Buscar usuário existente
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const normalUser = existingUsers.users.find(u => u.email === 'user@bigimports.com');

        if (normalUser) {
          console.log('✅ Encontrado usuário User existente:', normalUser.id);

          // Verificar se já existe em public.users
          const { data: publicUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', normalUser.id)
            .single();

          if (!publicUser) {
            console.log('🔄 Criando registro em public.users...');
            await createPublicUser(normalUser.id, 'Usuário Teste', 'user@bigimports.com', userRole.id, 'basic', 100, '5511999999999');
          } else {
            console.log('✅ Registro já existe em public.users');
          }
        }
      } else {
        throw new Error(`Erro ao criar User em auth.users: ${userAuthError.message}`);
      }
    } else {
      console.log('✅ Usuário User criado em auth.users:', userAuthUser.user.id);

      // Criar em public.users
      console.log('🔄 Criando registro em public.users...');
      await createPublicUser(userAuthUser.user.id, 'Usuário Teste', 'user@bigimports.com', userRole.id, 'basic', 100, '5511999999999');

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

// Função auxiliar para criar usuário em public.users
async function createPublicUser(userId, name, email, roleId, plan, maxSearches, phone = null) {
  // Verificar se já existe
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (existing) {
    console.log('⚠️  Usuário já existe em public.users, atualizando dados...');

    // Atualizar dados
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        name: name,
        email: email,
        role_id: roleId,
        status: 'active',
        plan: plan,
        max_searches_per_day: maxSearches,
        whatsapp_phone: phone
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Erro ao atualizar usuário em public.users: ${updateError.message}`);
    }

    console.log('✅ Usuário atualizado em public.users');
  } else {
    // Criar novo
    const { error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        name: name,
        email: email,
        role_id: roleId,
        status: 'active',
        plan: plan,
        max_searches_per_day: maxSearches,
        whatsapp_phone: phone
      });

    if (error) {
      throw new Error(`Erro ao criar usuário em public.users: ${error.message}`);
    }

    console.log('✅ Usuário criado em public.users');
  }
}

createAuthUsers();
