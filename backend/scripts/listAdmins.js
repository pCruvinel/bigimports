require('dotenv').config();
const { supabaseAdmin } = require('../src/config/database');

async function listAdmins() {
  try {
    const { data: admins, error } = await supabaseAdmin
      .from('users_with_roles')
      .select('*')
      .eq('role_name', 'admin');

    if (error) {
      console.error('Erro ao buscar admins:', error);
      return;
    }

    console.log(`Total de admins encontrados: ${admins?.length || 0}\n`);

    if (admins && admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`Admin ${index + 1}:`);
        console.log(`  - Email: ${admin.email}`);
        console.log(`  - Nome: ${admin.name}`);
        console.log(`  - Status: ${admin.status}`);
        console.log('');
      });
    } else {
      console.log('Nenhum admin encontrado.');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

listAdmins();
