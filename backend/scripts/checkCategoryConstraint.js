require('dotenv').config();
const { supabaseAdmin } = require('../src/config/database');

async function checkCategoryConstraint() {
  try {
    console.log('Verificando categorias existentes...\n');

    const { data: products, error } = await supabaseAdmin
      .from('products_catalog')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return;
    }

    // Pegar categorias únicas
    const uniqueCategories = [...new Set(products.map(p => p.category))];

    console.log(`Total de categorias únicas: ${uniqueCategories.length}\n`);
    console.log('Categorias permitidas:');
    uniqueCategories.forEach(cat => {
      console.log(`  - ${cat}`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkCategoryConstraint();
