require('dotenv').config();
const { supabaseAdmin } = require('../src/config/database');

async function checkProductsTable() {
  try {
    console.log('Verificando tabela products_catalog...\n');

    // 1. Verificar total de produtos
    const { data: allProducts, error: countError } = await supabaseAdmin
      .from('products_catalog')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('Erro ao contar produtos:', countError);
      return;
    }

    console.log(`Total de produtos na tabela: ${allProducts?.length || 0}\n`);

    // 2. Verificar primeiros 5 produtos
    const { data: sampleProducts, error: sampleError } = await supabaseAdmin
      .from('products_catalog')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('Erro ao buscar amostra:', sampleError);
      return;
    }

    console.log('Amostra de produtos:');
    console.log(JSON.stringify(sampleProducts, null, 2));
    console.log('\n');

    // 3. Verificar campos específicos
    if (sampleProducts && sampleProducts.length > 0) {
      const firstProduct = sampleProducts[0];
      console.log('Campos disponíveis no primeiro produto:');
      console.log(Object.keys(firstProduct).join(', '));
      console.log('\n');
    }

    // 4. Verificar produtos com categoria
    const { data: withCategory, error: catError } = await supabaseAdmin
      .from('products_catalog')
      .select('category')
      .not('category', 'is', null)
      .limit(5);

    if (catError) {
      console.error('Erro ao buscar produtos com categoria:', catError);
      return;
    }

    console.log(`Produtos com categoria definida: ${withCategory?.length || 0}`);
    console.log('Amostras de categorias:', withCategory?.map(p => p.category).join(', '));
    console.log('\n');

    // 5. Verificar produtos com extracted_at
    const { data: withDate, error: dateError } = await supabaseAdmin
      .from('products_catalog')
      .select('extracted_at')
      .not('extracted_at', 'is', null)
      .limit(5);

    if (dateError) {
      console.error('Erro ao buscar produtos com data:', dateError);
      return;
    }

    console.log(`Produtos com extracted_at: ${withDate?.length || 0}`);
    console.log('Amostras de datas:', withDate?.map(p => p.extracted_at).join(', '));

  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
  } finally {
    process.exit(0);
  }
}

checkProductsTable();
