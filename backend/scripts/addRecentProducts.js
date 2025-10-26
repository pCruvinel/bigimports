require('dotenv').config();
const { supabaseAdmin } = require('../src/config/database');

async function addRecentProducts() {
  try {
    console.log('Adicionando produtos com datas recentes...\n');

    const categories = ['Celulares', 'Acessórios', 'Caixas', 'Peças', 'Tablets'];
    const products = [];

    // Criar produtos para os últimos 30 dias
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const productsPerDay = Math.floor(Math.random() * 10) + 5; // 5-15 produtos por dia

      for (let j = 0; j < productsPerDay; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const price = Math.floor(Math.random() * 1000) + 50;

        products.push({
          product_name: `Produto Teste ${i}-${j}`,
          category: category,
          model: `Modelo ${Math.floor(Math.random() * 100)}`,
          price: price,
          original_currency: price.toString(),
          source_chat_id: 'test-chat@g.us',
          source_instance: 'test-instance',
          supplier_name: 'Fornecedor Teste',
          sender_id: 'test@s.whatsapp.net',
          message_type: 'group',
          extracted_at: date.toISOString(),
        });
      }
    }

    console.log(`Criando ${products.length} produtos...`);

    // Inserir em lotes de 100
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const { error } = await supabaseAdmin
        .from('products_catalog')
        .insert(batch);

      if (error) {
        console.error(`Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, error);
      } else {
        console.log(`Lote ${Math.floor(i / batchSize) + 1} inserido com sucesso (${batch.length} produtos)`);
      }
    }

    console.log('\n✅ Produtos adicionados com sucesso!');
    console.log(`Total: ${products.length} produtos`);

    // Mostrar resumo por categoria
    const categoryCounts = {};
    products.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    console.log('\nResumo por categoria:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} produtos`);
    });

  } catch (error) {
    console.error('Erro ao adicionar produtos:', error);
  } finally {
    process.exit(0);
  }
}

addRecentProducts();
