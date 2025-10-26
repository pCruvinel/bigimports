/**
 * Script para executar migration da tabela system_config no Supabase
 *
 * Uso:
 *   node database/run_migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Credenciais do Supabase (do CLAUDE.md)
const SUPABASE_URL = 'https://qamschuquqdqkddntiln.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbXNjaHVxdXFkcWtkZG50aWxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYyODkzOSwiZXhwIjoyMDczMjA0OTM5fQ.T2GJIipfx35dZdVfWgskK6UTLd1sK02UhTo4Wwio_Zk';

async function runMigration() {
  console.log('🚀 Iniciando migration da tabela system_config...\n');

  // Criar cliente Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Ler arquivo SQL
    const sqlFilePath = path.join(__dirname, 'create_system_config.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 SQL lido do arquivo: create_system_config.sql');
    console.log('📊 Tamanho do SQL:', sqlContent.length, 'caracteres\n');

    // Dividir em comandos individuais (separados por ;)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log('📝 Total de comandos SQL:', sqlCommands.length, '\n');

    // Executar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];

      // Pular comentários
      if (command.startsWith('--') || command.startsWith('COMMENT')) {
        console.log(`⏭️  Pulando comando ${i + 1}: Comentário`);
        continue;
      }

      console.log(`▶️  Executando comando ${i + 1}/${sqlCommands.length}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });

        if (error) {
          // Tentar executar diretamente via REST API se rpc não funcionar
          console.log('⚠️  RPC não disponível, tentando método alternativo...');

          // Para criar tabela, precisamos usar o client com permissões
          // Como não temos acesso direto ao SQL executor via client,
          // vamos apenas informar o usuário
          throw new Error('Execute manualmente no Supabase SQL Editor');
        }

        console.log(`✅ Comando ${i + 1} executado com sucesso!\n`);
      } catch (cmdError) {
        console.error(`❌ Erro no comando ${i + 1}:`, cmdError.message);

        if (cmdError.message.includes('manualmente')) {
          console.log('\n⚠️  IMPORTANTE:');
          console.log('Não é possível executar DDL (CREATE TABLE, etc) via client JavaScript.');
          console.log('Por favor, execute manualmente no Supabase Dashboard:');
          console.log('\n1. Acesse: https://supabase.com/dashboard/project/qamschuquqdqkddntiln');
          console.log('2. Vá em "SQL Editor" no menu lateral');
          console.log('3. Cole o conteúdo do arquivo: database/create_system_config.sql');
          console.log('4. Clique em "Run" para executar\n');
          process.exit(1);
        }
      }
    }

    console.log('🎉 Migration concluída com sucesso!\n');

    // Verificar se a tabela foi criada
    console.log('🔍 Verificando se a tabela foi criada...');
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao verificar tabela:', error.message);
      console.log('\nA tabela pode não ter sido criada. Execute manualmente no SQL Editor.');
    } else {
      console.log('✅ Tabela system_config criada com sucesso!');
      console.log('📊 Registros encontrados:', data.length);
      if (data.length > 0) {
        console.log('\nConfiguração padrão:');
        data.forEach(config => {
          console.log(`  - ${config.config_key}: ${config.config_type}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro na migration:', error.message);
    console.log('\n⚠️  Execute manualmente o SQL no Supabase Dashboard');
    process.exit(1);
  }
}

// Executar
runMigration().then(() => {
  console.log('\n✅ Processo finalizado!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
