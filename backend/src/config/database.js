const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Cliente Supabase com permissões de admin (service role)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Testar conexão com o banco de dados
const testConnection = async () => {
  try {
    // Usar supabaseAdmin para ter permissões de service role
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao conectar com o Supabase:', error.message);
      console.error('Detalhes do erro:', error);
      return false;
    }

    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar conexão:', err.message);
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection
};
