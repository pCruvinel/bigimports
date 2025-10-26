const bcrypt = require('bcryptjs');

/**
 * Script para gerar hash de senhas
 * Uso: node scripts/generatePasswordHash.js <senha>
 */

const password = process.argv[2];

if (!password) {
  console.error('❌ Por favor, forneça uma senha como argumento');
  console.log('Uso: node scripts/generatePasswordHash.js <senha>');
  console.log('Exemplo: node scripts/generatePasswordHash.js admin123');
  process.exit(1);
}

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, 10);

    console.log('\n✅ Hash gerado com sucesso!\n');
    console.log('Senha:', password);
    console.log('Hash:', hash);
    console.log('\nUse este hash no campo password_hash ao inserir o usuário no banco de dados.\n');
  } catch (error) {
    console.error('❌ Erro ao gerar hash:', error);
    process.exit(1);
  }
}

generateHash();
